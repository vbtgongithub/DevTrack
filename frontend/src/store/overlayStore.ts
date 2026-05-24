// src/store/overlayStore.ts — Global Overlay Queue Store
// Prevents overlapping notifications with priority-based queuing and auto-dismissal.
// Shared across all tabs via singleton SSE coordination and global store.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type OverlayType = 'level_up' | 'streak_milestone' | 'challenge_completed' | 'achievement_unlocked' | 'streak_at_risk';

export interface OverlayItem {
  id: string;
  type: OverlayType;
  data: Record<string, unknown>;
  priority: number;
  timestamp: number;
  duration?: number;
}

const OVERLAY_PRIORITIES: Record<OverlayType, number> = {
  level_up: 4,
  streak_milestone: 3,
  challenge_completed: 2,
  achievement_unlocked: 1,
  streak_at_risk: 5,
};

const DEFAULT_DURATION = 4000;

interface OverlayState {
  queue: OverlayItem[];
  activeOverlay: OverlayItem | null;
  
  // Actions
  enqueue: (type: OverlayType, data: Record<string, unknown>, duration?: number) => void;
  dismiss: () => void;
  processQueue: () => void;
  clearQueue: () => void;
}

export const useOverlayStore = create<OverlayState>()(
  devtools(
    (set, get) => ({
      queue: [],
      activeOverlay: null,

      enqueue: (type, data, duration) => {
        const newItem: OverlayItem = {
          id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type,
          data,
          priority: OVERLAY_PRIORITIES[type],
          timestamp: Date.now(),
          duration: duration ?? DEFAULT_DURATION,
        };

        set((state) => {
          const newQueue = [...state.queue, newItem].sort((a, b) => b.priority - a.priority);
          return { queue: newQueue };
        });

        // Trigger queue processing if nothing is active
        if (!get().activeOverlay) {
          get().processQueue();
        }
      },

      dismiss: () => {
        set({ activeOverlay: null });
        // Process next item after a small gap for transitions
        setTimeout(() => {
          get().processQueue();
        }, 300);
      },

      processQueue: () => {
        const { activeOverlay, queue } = get();
        if (activeOverlay || queue.length === 0) return;

        const [nextItem, ...remainingQueue] = queue;
        set({ activeOverlay: nextItem, queue: remainingQueue });

        if (nextItem.duration) {
          setTimeout(() => {
            // Only dismiss if this is still the active overlay
            if (get().activeOverlay?.id === nextItem.id) {
              get().dismiss();
            }
          }, nextItem.duration);
        }
      },

      clearQueue: () => {
        set({ queue: [], activeOverlay: null });
      },
    }),
    { name: 'OverlayStore' }
  )
);
