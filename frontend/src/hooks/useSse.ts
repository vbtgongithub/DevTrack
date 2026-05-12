// ============================================================================
// useSse.ts — Server-Sent Events hook with reconnect logic
// ============================================================================
// Manages EventSource lifecycle, auth header injection, heartbeat awareness,
// reconnecting, and cache invalidation on SSE events.
// Designed to be used alongside TanStack Query — does NOT replace polling.
// ============================================================================

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { useUIStore } from '../store/uiStore';

const SSE_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  return envUrl || '';
})();

const SSE_PATH = '/api/events';
const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_CONSECUTIVE_FAILURES = 5;

// ---------------------------------------------------------------------------
// Event types — mirrors backend SseEvent
// ---------------------------------------------------------------------------

export type SseEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission'
  | 'xp_updated'
  | 'level_up';

export interface SseEvent {
  type: SseEventType;
  timestamp: string;
  userId?: string;
  platform?: string;
  stats?: {
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    rating?: number;
    totalContests?: number;
    ingested?: number;
    successCount?: number;
    failedCount?: number;
    error?: string;
  };
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

interface UseSseOptions {
  onEvent?: (event: SseEvent) => void;
  extraInvalidateKeys?: string[][];
  enabled?: boolean;
}

interface UseSseResult {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastEvent: SseEvent | null;
  reconnectAttempt: number;
  diagnostics: SseDiagnostics;
}

export interface SseDiagnostics {
  connectedAt: number | null;
  lastEventAt: number | null;
  totalEventsReceived: number;
  totalReconnects: number;
  consecutiveFailures: number;
  avgReconnectDelay: number;
}

// ---------------------------------------------------------------------------
// Internal: invalidate queries on sync events
// ---------------------------------------------------------------------------

function invalidateOnSyncEvent(
  queryClient: ReturnType<typeof useQueryClient>,
  event: SseEvent
): void {
  switch (event.type) {
    case 'sync_started':
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.syncStatus });
      break;
    case 'sync_completed':
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.submissions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.contests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.topics });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.platformStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.syncStatus });
      break;
    case 'new_submission':
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.submissions() });
      break;
    case 'sync_failed':
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.syncStatus });
      break;
  }
}

// ---------------------------------------------------------------------------
// Store state — lives outside the hook so useSyncExternalStore can snapshot it
// ---------------------------------------------------------------------------

interface StoreState {
  connectionStatus: ConnectionStatus;
  lastEvent: SseEvent | null;
  reconnectAttempt: number;
  connectedAt: number | null;
  lastEventAt: number | null;
  totalEventsReceived: number;
  totalReconnects: number;
  consecutiveFailures: number;
  reconnectDelays: number[];
}

const store: StoreState = {
  connectionStatus: 'disconnected',
  lastEvent: null,
  reconnectAttempt: 0,
  connectedAt: null,
  lastEventAt: null,
  totalEventsReceived: 0,
  totalReconnects: 0,
  consecutiveFailures: 0,
  reconnectDelays: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(): StoreState {
  return store;
}

// ---------------------------------------------------------------------------
// useSse
// ---------------------------------------------------------------------------

export function useSse(options: UseSseOptions = {}): UseSseResult {
  const { onEvent, extraInvalidateKeys = [], enabled = true } = options;

  const queryClient = useQueryClient();
  const setSseStatus = useUIStore((s) => s.setSseStatus);
  const setInfrastructureDegraded = useUIStore((s) => s.setInfrastructureDegraded);

  // Stable refs — mutable state that doesn't trigger re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const connectFnRef = useRef<() => void>(() => {});

  // Derived state via useSyncExternalStore — re-renders only when snapshot changes
  const { connectionStatus, lastEvent, reconnectAttempt } = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot
  );

  // ---------------------------------------------------------------------------
  // Set state helpers — update the external store
  // ---------------------------------------------------------------------------

  const setStatus = useCallback((status: ConnectionStatus) => {
    if (store.connectionStatus === status) return;
    store.connectionStatus = status;
    emitChange();
    // Map to UI store's 3-state model — 'connecting' is treated as 'reconnecting'
    setSseStatus(status === 'connecting' ? 'reconnecting' : status);
    if (status === 'disconnected') {
      setInfrastructureDegraded(true);
    }
  }, [setSseStatus, setInfrastructureDegraded]);

  const setLastEvent = useCallback((event: SseEvent) => {
    store.lastEvent = event;
    emitChange();
  }, []);

  // ---------------------------------------------------------------------------
  // Connect — builds EventSource, wires handlers, stores in ref
  // ---------------------------------------------------------------------------

  const doConnect = useCallback(() => {
    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    const token = localStorage.getItem('devtrack_access_token');
    if (!token) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    const url = `${SSE_BASE_URL}${SSE_PATH}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      consecutiveFailuresRef.current = 0;
      store.connectedAt = Date.now();
      store.totalReconnects = reconnectAttempt > 0 ? store.totalReconnects + 1 : store.totalReconnects;
      store.consecutiveFailures = 0;
      setStatus('connected');

      heartbeatTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - lastMessageRef.current;
        if (lastMessageRef.current > 0 && elapsed > HEARTBEAT_INTERVAL_MS * 2) {
          console.warn('[SSE] Heartbeat stale, reconnecting...', { elapsed });
          es.close();
          scheduleReconnect(true);
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    es.onmessage = (ev) => {
      lastMessageRef.current = Date.now();
      if (ev.data?.startsWith(':')) return;

      let event: SseEvent;
      try {
        event = JSON.parse(ev.data) as SseEvent;
      } catch {
        console.warn('[SSE] Failed to parse event', { raw: ev.data });
        return;
      }

      store.lastEvent = event;
      store.lastEventAt = Date.now();
      store.totalEventsReceived++;
      store.consecutiveFailures = 0;
      setLastEvent(event);
      onEvent?.(event);
      invalidateOnSyncEvent(queryClient, event);

      for (const key of extraInvalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    es.onerror = () => {
      consecutiveFailuresRef.current += 1;
      store.consecutiveFailures = consecutiveFailuresRef.current;

      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
        console.error('[SSE] Max consecutive failures reached, stopping');
        setStatus('disconnected');
        es.close();
        return;
      }

      es.close();
      const delay = Math.min(
        RECONNECT_DELAY_MS * Math.pow(1.5, store.reconnectAttempt),
        MAX_RECONNECT_DELAY_MS
      );
      store.reconnectDelays.push(delay);
      scheduleReconnect(false);
    };

    function scheduleReconnect(isHeartbeat: boolean) {
      if (reconnectTimeoutRef.current !== null) return;

      const attempt = isHeartbeat ? store.reconnectAttempt + 1 : store.reconnectAttempt;
      const delay = Math.min(
        RECONNECT_DELAY_MS * Math.pow(1.5, attempt),
        MAX_RECONNECT_DELAY_MS
      );

      store.reconnectAttempt = attempt + 1;
      setStatus('reconnecting');
      emitChange();

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connectFnRef.current();
      }, delay);
    }
  }, [enabled, onEvent, queryClient, extraInvalidateKeys, setStatus, setLastEvent]);

  // Keep connectFnRef.current fresh so reconnect closures work correctly
  useEffect(() => {
    connectFnRef.current = doConnect;
  }, [doConnect]);

  // ---------------------------------------------------------------------------
  // Connect on mount, teardown on unmount — driven by ref, no state in effect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      // Tear down any active connection
      if (heartbeatTimerRef.current !== null) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current !== null) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      store.reconnectAttempt = 0;
      store.lastEvent = null;
      emitChange();
      return;
    }

    doConnect();
    return () => {
      if (heartbeatTimerRef.current !== null) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current !== null) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, doConnect]);

  const avgDelay = store.reconnectDelays.length > 0
    ? store.reconnectDelays.reduce((a, b) => a + b, 0) / store.reconnectDelays.length
    : 0;

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    lastEvent,
    reconnectAttempt,
    diagnostics: {
      connectedAt: store.connectedAt,
      lastEventAt: store.lastEventAt,
      totalEventsReceived: store.totalEventsReceived,
      totalReconnects: store.totalReconnects,
      consecutiveFailures: store.consecutiveFailures,
      avgReconnectDelay: Math.round(avgDelay),
    },
  };
}