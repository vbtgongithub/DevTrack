// ============================================================================
// useSse.ts — Server-Sent Events hook with reconnect logic
// ============================================================================
// Manages EventSource lifecycle, auth header injection, heartbeat awareness,
// reconnecting, and cache invalidation on SSE events.
// Designed to be used alongside TanStack Query — does NOT replace polling.
// ============================================================================

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { useUIStore } from '../store/uiStore';

const SSE_PATH = '/events';
const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_CONSECUTIVE_FAILURES = 5;

// ---------------------------------------------------------------------------
// Event types — mirrors backend SseEvent (full taxonomy)
// ---------------------------------------------------------------------------

export type SseEventType =
  // Runtime state (primary)
  | 'runtime_state_patch'
  | 'runtime_state_full'
  // Behavioral
  | 'behavioral_message'
  | 'notification_created'
  // Progression moments
  | 'level_up'
  | 'streak_milestone'
  | 'streak_at_risk'
  | 'achievement_unlocked'
  | 'goal_completed'
  | 'challenge_completed'
  | 'near_milestone'
  | 'mission_progress'
  // Sync
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission'
  // Legacy (for backwards compatibility)
  | 'xp_updated'
  | 'badge_earned'
  // System
  | 'heartbeat';

export interface SseEventEnvelope {
  id: string;
  type: SseEventType;
  sequence: number;
  timestamp: string;
  userId: string;
  payload: Record<string, unknown>;
}

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
  payload?: any;
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
  eventHistory: SseEvent[];
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
  eventHistory: SseEvent[];
  lastEventId: string | null;
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
  eventHistory: [],
  lastEventId: null,
};

const MAX_HISTORY = 50;
const seenEventIds = new Set<string>();

function eventKey(event: SseEvent): string {
  return `${event.type}:${event.timestamp}:${JSON.stringify(event.stats)}`;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(): StoreState {
  return store;
}

// ---------------------------------------------------------------------------
// Global Connection State and Registry for Hook Instances (Singleton pattern)
// ---------------------------------------------------------------------------

interface HookCallbackRegistry {
  onEvent?: (event: SseEvent) => void;
  queryClient: ReturnType<typeof useQueryClient>;
  extraInvalidateKeys: string[][];
}

const activeCallbacks = new Set<HookCallbackRegistry>();

let globalEventSource: EventSource | null = null;
let globalReconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let globalHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
let globalLastMessage = 0;
let globalConsecutiveFailures = 0;
let globalDisconnectedAt: number | null = null;

// Stale state recovery threshold (30 seconds)
const STALE_STATE_THRESHOLD_MS = 30_000;

async function connectGlobalSse(setSseStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void, setInfrastructureDegraded: (degraded: boolean) => void) {
  if (globalEventSource !== null) return;

  const token = localStorage.getItem('devtrack_access_token');
  if (!token) {
    store.connectionStatus = 'disconnected';
    emitChange();
    setSseStatus('disconnected');
    return;
  }

  store.connectionStatus = 'connecting';
  emitChange();
  setSseStatus('reconnecting');

  // Securely request a short-lived SSE handshake ticket via HTTP API
  let ticket: string | null = null;
  try {
    const { default: axiosClient } = await import('../utils/axiosClient');
    const { data } = await axiosClient.post<{ data: { ticket: string } }>('/auth/sse-handshake');
    ticket = data.data.ticket;
  } catch (err) {
    console.warn('[SSE] Failed to obtain secure SSE handshake ticket. Falling back to JWT token.', err);
  }

  // Build URL with ticket or fallback to token for resiliency
  const urlParams = new URLSearchParams();
  if (ticket) {
    urlParams.set('ticket', ticket);
  } else {
    urlParams.set('token', token);
  }
  
  if (store.lastEventId) {
    urlParams.set('lastEventId', store.lastEventId);
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${envUrl}${SSE_PATH}?${urlParams.toString()}`;
  const es = new EventSource(url);
  globalEventSource = es;

  es.onopen = () => {
    globalConsecutiveFailures = 0;
    const now = Date.now();
    store.connectedAt = now;
    store.totalReconnects = store.reconnectAttempt > 0 ? store.totalReconnects + 1 : store.totalReconnects;
    store.consecutiveFailures = 0;
    store.connectionStatus = 'connected';
    emitChange();
    setSseStatus('connected');

    // Stale state recovery: if disconnected for >30s, force-invalidate all queries
    if (globalDisconnectedAt !== null) {
      const disconnectDuration = now - globalDisconnectedAt;
      if (disconnectDuration > STALE_STATE_THRESHOLD_MS) {
        console.info('[SSE] Reconnected after long disconnect, invalidating all queries', {
          disconnectDuration: Math.round(disconnectDuration / 1000) + 's',
        });
        
        // Force-invalidate all queries to ensure fresh state
        for (const cb of activeCallbacks) {
          cb.queryClient.invalidateQueries();
        }
      }
      globalDisconnectedAt = null;
    }

    if (globalHeartbeatTimer) clearInterval(globalHeartbeatTimer);
    globalHeartbeatTimer = setInterval(() => {
      const elapsed = Date.now() - globalLastMessage;
      if (globalLastMessage > 0 && elapsed > HEARTBEAT_INTERVAL_MS * 2) {
        console.warn('[SSE] Heartbeat stale, reconnecting...', { elapsed });
        es.close();
        globalEventSource = null;
        scheduleReconnect(true, setSseStatus, setInfrastructureDegraded);
      }
    }, HEARTBEAT_INTERVAL_MS);
  };

  es.onmessage = (ev) => {
    globalLastMessage = Date.now();
    if (ev.data?.startsWith(':')) return;

    let event: SseEvent;
    try {
      const parsed = JSON.parse(ev.data) as SseEventEnvelope | SseEvent;
      if ('id' in parsed && 'sequence' in parsed) {
        event = {
          type: parsed.type,
          timestamp: parsed.timestamp,
          userId: parsed.userId,
          stats: parsed.payload as SseEvent['stats'],
          payload: parsed.payload,
        };
        store.lastEventId = parsed.id;
      } else {
        event = parsed as SseEvent;
      }
    } catch {
      console.warn('[SSE] Failed to parse event', { raw: ev.data });
      return;
    }

    const key = eventKey(event);
    if (seenEventIds.has(key)) return;
    seenEventIds.add(key);
    if (seenEventIds.size > 200) {
      const first = seenEventIds.values().next().value;
      if (first) seenEventIds.delete(first);
    }

    store.eventHistory = [event, ...store.eventHistory].slice(0, MAX_HISTORY);
    store.lastEvent = event;
    store.lastEventAt = Date.now();
    store.totalEventsReceived++;
    store.consecutiveFailures = 0;
    emitChange();

    // Broadcast to all registered hooks
    for (const cb of activeCallbacks) {
      try {
        cb.onEvent?.(event);
        invalidateOnSyncEvent(cb.queryClient, event);
        for (const key of cb.extraInvalidateKeys) {
          cb.queryClient.invalidateQueries({ queryKey: key });
        }
      } catch (e) {
        console.error('[SSE] Hook callback failed', e);
      }
    }
  };

  es.onerror = () => {
    globalConsecutiveFailures += 1;
    store.consecutiveFailures = globalConsecutiveFailures;

    // Track when we disconnected for stale state recovery
    if (globalDisconnectedAt === null) {
      globalDisconnectedAt = Date.now();
    }

    if (globalConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('[SSE] Max consecutive failures reached, stopping');
      store.connectionStatus = 'disconnected';
      emitChange();
      setSseStatus('disconnected');
      setInfrastructureDegraded(true);
      es.close();
      globalEventSource = null;
      return;
    }

    es.close();
    globalEventSource = null;
    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(1.5, store.reconnectAttempt),
      MAX_RECONNECT_DELAY_MS
    );
    store.reconnectDelays.push(delay);
    scheduleReconnect(false, setSseStatus, setInfrastructureDegraded);
  };
}

function disconnectGlobalSse(setSseStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void) {
  if (globalHeartbeatTimer !== null) {
    clearInterval(globalHeartbeatTimer);
    globalHeartbeatTimer = null;
  }
  if (globalReconnectTimeout !== null) {
    clearTimeout(globalReconnectTimeout);
    globalReconnectTimeout = null;
  }
  if (globalEventSource !== null) {
    globalEventSource.close();
    globalEventSource = null;
  }
  store.connectionStatus = 'disconnected';
  store.reconnectAttempt = 0;
  store.lastEvent = null;
  store.eventHistory = [];
  store.lastEventId = null;
  globalDisconnectedAt = null;
  emitChange();
  setSseStatus('disconnected');
}

function scheduleReconnect(
  isHeartbeat: boolean,
  setSseStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void,
  setInfrastructureDegraded: (degraded: boolean) => void
) {
  if (globalReconnectTimeout !== null) return;

  const attempt = isHeartbeat ? store.reconnectAttempt + 1 : store.reconnectAttempt;
  const delay = Math.min(
    RECONNECT_DELAY_MS * Math.pow(1.5, attempt),
    MAX_RECONNECT_DELAY_MS
  );

  store.reconnectAttempt = attempt + 1;
  store.connectionStatus = 'reconnecting';
  emitChange();
  setSseStatus('reconnecting');

  globalReconnectTimeout = setTimeout(() => {
    globalReconnectTimeout = null;
    connectGlobalSse(setSseStatus, setInfrastructureDegraded);
  }, delay);
}

// ---------------------------------------------------------------------------
// useSse
// ---------------------------------------------------------------------------

export function useSse(options: UseSseOptions = {}): UseSseResult {
  const { onEvent, extraInvalidateKeys = [], enabled = true } = options;

  const queryClient = useQueryClient();
  const setSseStatus = useUIStore((s) => s.setSseStatus);
  const setInfrastructureDegraded = useUIStore((s) => s.setInfrastructureDegraded);

  // Sync state from external store using useSyncExternalStore
  const { connectionStatus, lastEvent, reconnectAttempt } = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot
  );

  // Maintain callback ref to avoid closure staleness
  const callbackRef = useRef<HookCallbackRegistry>({
    onEvent,
    queryClient,
    extraInvalidateKeys,
  });

  useEffect(() => {
    callbackRef.current = { onEvent, queryClient, extraInvalidateKeys };
  });

  useEffect(() => {
    if (!enabled) return;

    const cb = callbackRef.current;
    activeCallbacks.add(cb);

    // If this is the first active hook, connect to SSE!
    if (activeCallbacks.size === 1) {
      connectGlobalSse(setSseStatus, setInfrastructureDegraded);
    }

    return () => {
      activeCallbacks.delete(cb);
      // If no active hooks remain, disconnect from SSE!
      if (activeCallbacks.size === 0) {
        disconnectGlobalSse(setSseStatus);
      }
    };
  }, [enabled, setSseStatus, setInfrastructureDegraded]);

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
    eventHistory: store.eventHistory,
  };
}

// ---------------------------------------------------------------------------
// Compatibility shims for old sse-manager exports (migration period)
// ---------------------------------------------------------------------------

export const useXpUpdates = () => {
  const latestEvent = store.eventHistory.find((e) => e.type === 'xp_updated' || e.type === 'runtime_state_patch');
  return {
    latestXp: latestEvent?.stats?.totalSolved as number | undefined,
    delta: latestEvent?.stats?.easySolved as number | undefined,
  };
};

export const useStreakUpdates = () => {
  const latestEvent = store.eventHistory.find(
    (e) => e.type === 'streak_milestone' || e.type === 'streak_at_risk'
  );
  return {
    streak: latestEvent?.stats?.totalSolved as number | undefined,
    atRisk: latestEvent?.type === 'streak_at_risk',
  };
};

export const useAchievementUnlocks = () => {
  const latestEvent = store.eventHistory.find((e) => e.type === 'badge_earned' || e.type === 'achievement_unlocked');
  return {
    achievement: latestEvent?.stats as { name?: string; rarity?: string } | undefined,
  };
};

export const useConnectionState = () => ({
  connected: store.connectionStatus === 'connected',
  reconnecting: store.connectionStatus === 'reconnecting',
  lastEvent: store.lastEvent?.type ?? null,
  error: store.connectionStatus === 'disconnected' ? 'Connection unavailable' : null,
});