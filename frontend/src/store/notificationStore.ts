// ============================================================================
// notificationStore.ts — Notification Queue Store
// ============================================================================
// In-memory notification queue with FIFO eviction (max 50).
// Persists last 20 notifications to localStorage for page-refresh survival.
// ============================================================================

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'xp_updated'
  | 'level_up'
  | 'streak_milestone'
  | 'streak_at_risk'
  | 'sync_completed'
  | 'sync_failed'
  | 'achievement_unlocked'
  | 'mission_completed'
  | 'challenge_completed'
  | 'notification_created'
  | 'general';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  priority: NotificationPriority;
  tone?: string;
  platform?: string;
  read: boolean;
  createdAt: number; // timestamp
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isDrawerOpen: boolean;

  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'devtrack_notifications';
const MAX_ITEMS = 50;
const PERSIST_COUNT = 20;
let notifCounter = 0;

function loadFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]) {
  try {
    const toSave = notifications.slice(0, PERSIST_COUNT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // localStorage unavailable — silently fail
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initial = loadFromStorage();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initial,
  unreadCount: initial.filter((n) => !n.read).length,
  isDrawerOpen: false,

  addNotification: (n) => {
    const id = `notif-${Date.now()}-${++notifCounter}`;
    const newNotif: Notification = {
      ...n,
      id,
      read: false,
      createdAt: Date.now(),
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications].slice(0, MAX_ITEMS);
      const unread = updated.filter((x) => !x.read).length;
      saveToStorage(updated);
      return { notifications: updated, unreadCount: unread };
    });
  },

  markAllRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return { notifications: updated, unreadCount: 0 };
    });
  },

  markRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      const unread = updated.filter((x) => !x.read).length;
      saveToStorage(updated);
      return { notifications: updated, unreadCount: unread };
    });
  },

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  clearAll: () => {
    saveToStorage([]);
    set({ notifications: [], unreadCount: 0 });
  },
}));
