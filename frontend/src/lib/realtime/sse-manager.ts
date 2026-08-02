// Reconnect-safe SSE store — complements useSse hook for progression events

import { create } from 'zustand';

export type SseEventType =
  | 'xp_updated'
  | 'level_up'
  | 'streak_milestone'
  | 'streak_at_risk'
  | 'badge_earned'
  | 'goal_completed'
  | 'goal_progress'
  | 'challenge_updated'
  | 'challenge_completed'
  | 'notification'
  | 'session_event'
  | 'comeback_trigger'
  | 'fatigue_warning'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission';

export interface SseEvent {
  type: SseEventType;
  timestamp: string;
  userId?: string;
  data: Record<string, unknown>;
}

export interface SseConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastEvent: string | null;
  error: string | null;
}

interface SseStore {
  connectionState: SseConnectionState;
  eventHistory: SseEvent[];
  lastEventId: string | null;
  listeners: Map<SseEventType, Set<(event: SseEvent) => void>>;
  connect: () => void;
  disconnect: () => void;
  handleEvent: (event: SseEvent, id?: string) => void;
  subscribe: (type: SseEventType, callback: (event: SseEvent) => void) => () => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

let eventSource: EventSource | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const seenEventIds = new Set<string>();

function eventKey(event: SseEvent, id?: string): string {
  if (id) return id;
  return `${event.type}:${event.timestamp}:${JSON.stringify(event.data)}`;
}

export const useSseStore = create<SseStore>((set, get) => ({
  connectionState: {
    connected: false,
    reconnecting: false,
    lastEvent: null,
    error: null,
  },
  eventHistory: [],
  lastEventId: null,
  listeners: new Map(),

  connect: async () => {
    if (eventSource) {
      eventSource.close();
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const lastId = get().lastEventId;

    set((state) => ({
      connectionState: { ...state.connectionState, reconnecting: true },
    }));

    // Acquire secure handshake ticket before connecting
    let ticket: string | null = null;
    try {
      const { getSSEHandshakeTicket } = await import('../../services/authService');
      ticket = await getSSEHandshakeTicket();
    } catch (err) {
      console.error('[SSE] Failed to acquire handshake ticket:', err);
      set((state) => ({
        connectionState: { ...state.connectionState, error: 'Failed to authenticate SSE', reconnecting: false },
      }));
      return;
    }

    let url = `${baseUrl}/api/events?ticket=${encodeURIComponent(ticket)}`;
    if (lastId) {
      url += `&lastEventId=${encodeURIComponent(lastId)}`;
    }
    
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      set((state) => ({
        connectionState: {
          ...state.connectionState,
          connected: true,
          reconnecting: false,
          error: null,
        },
      }));
      reconnectAttempts = 0;
    };

    eventSource.onmessage = (event) => {
      if (event.data?.startsWith(':')) return;
      try {
        const parsed = JSON.parse(event.data) as SseEvent & { stats?: Record<string, unknown> };
        const normalized: SseEvent = {
          type: parsed.type,
          timestamp: parsed.timestamp ?? new Date().toISOString(),
          userId: parsed.userId,
          data: parsed.data ?? (parsed.stats ? { ...parsed.stats } : {}),
        };
        
        const id = event.lastEventId;
        const key = eventKey(normalized, id);
        
        if (seenEventIds.has(key)) return;
        seenEventIds.add(key);
        
        if (seenEventIds.size > 200) {
          const first = seenEventIds.values().next().value;
          if (first) seenEventIds.delete(first);
        }
        
        get().handleEvent(normalized, id);
      } catch (err) {
        console.error('[SSE] Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            connected: false,
            reconnecting: true,
            error: `Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})…`,
          },
        }));
        reconnectTimeout = setTimeout(() => {
          // Acquire fresh ticket before reconnecting
          get().connect();
        }, RECONNECT_DELAY * reconnectAttempts);
      } else {
        set((state) => ({
          connectionState: {
            ...state.connectionState,
            connected: false,
            reconnecting: false,
            error: 'Connection unavailable',
          },
        }));
      }
    };
  },

  disconnect: () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    eventSource?.close();
    eventSource = null;
    set({
      connectionState: {
        connected: false,
        reconnecting: false,
        lastEvent: null,
        error: null,
      },
    });
  },

  handleEvent: (event, id) => {
    const { listeners, eventHistory } = get();
    const newHistory = [event, ...eventHistory].slice(0, MAX_HISTORY);
    set({
      eventHistory: newHistory,
      lastEventId: id || get().lastEventId,
      connectionState: {
        ...get().connectionState,
        lastEvent: event.type,
      },
    });

    listeners.get(event.type)?.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[SSE] Listener error:', err);
      }
    });
  },

  subscribe: (type, callback) => {
    const { listeners } = get();
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(callback);
    return () => {
      const setForType = listeners.get(type);
      setForType?.delete(callback);
      if (setForType?.size === 0) listeners.delete(type);
    };
  },

  clearHistory: () => set({ eventHistory: [] }),
}));

export const useXpUpdates = () => {
  const latestEvent = useSseStore((s) => s.eventHistory.find((e) => e.type === 'xp_updated'));
  return {
    latestXp: latestEvent?.data?.xp as number | undefined,
    delta: latestEvent?.data?.delta as number | undefined,
  };
};

export const useStreakUpdates = () => {
  const latestEvent = useSseStore((s) =>
    s.eventHistory.find((e) => e.type === 'streak_milestone' || e.type === 'streak_at_risk')
  );
  return {
    streak: latestEvent?.data?.streak as number | undefined,
    atRisk: latestEvent?.type === 'streak_at_risk',
  };
};

export const useAchievementUnlocks = () => {
  const latestEvent = useSseStore((s) => s.eventHistory.find((e) => e.type === 'badge_earned'));
  return {
    achievement: latestEvent?.data as { name?: string; rarity?: string } | undefined,
  };
};

export const useConnectionState = () => useSseStore((s) => s.connectionState);

export default useSseStore;
