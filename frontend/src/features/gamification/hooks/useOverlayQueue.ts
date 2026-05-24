// src/features/gamification/hooks/useOverlayQueue.ts — Overlay queue system
// Prevents overlapping notifications with priority-based queuing and auto-dismissal

import { useState, useCallback, useRef, useEffect } from 'react';

export type OverlayType = 'level_up' | 'streak_milestone' | 'challenge_completed' | 'achievement_unlocked' | 'streak_at_risk';

export interface OverlayItem {
  id: string;
  type: OverlayType;
  data: Record<string, unknown>;
  priority: number;
  timestamp: number;
  duration?: number; // Auto-dismiss duration in ms
}

const OVERLAY_PRIORITIES: Record<OverlayType, number> = {
  level_up: 4,
  streak_milestone: 3,
  challenge_completed: 2,
  achievement_unlocked: 1,
  streak_at_risk: 5, // Highest priority for streak risk warnings
};

const DEFAULT_DURATION = 4000; // 4 seconds default

export function useOverlayQueue() {
  const [queue, setQueue] = useState<OverlayItem[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<OverlayItem | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('overlay_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out items older than 5 minutes
        const now = Date.now();
        const valid = parsed.filter((item: OverlayItem) => now - item.timestamp < 5 * 60 * 1000);
        setQueue(valid);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save queue to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('overlay_queue', JSON.stringify(queue));
    } catch {
      // Ignore localStorage errors
    }
  }, [queue]);

  // Clear dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const enqueue = useCallback((type: OverlayType, data: Record<string, unknown>, duration?: number) => {
    const newItem: OverlayItem = {
      id: `${type}_${Date.now()}`,
      type,
      data,
      priority: OVERLAY_PRIORITIES[type],
      timestamp: Date.now(),
      duration: duration ?? DEFAULT_DURATION,
    };

    setQueue((prev) => {
      // Insert in priority order (highest first)
      const newQueue = [...prev, newItem].sort((a, b) => b.priority - a.priority);
      return newQueue;
    });
  }, []);

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setActiveOverlay(null);
  }, []);

  // Process queue when no active overlay
  useEffect(() => {
    if (!activeOverlay && queue.length > 0) {
      const nextItem = queue[0];
      setActiveOverlay(nextItem);
      setQueue((prev) => prev.slice(1));

      // Auto-dismiss after duration
      if (nextItem.duration) {
        dismissTimerRef.current = window.setTimeout(() => {
          dismiss();
        }, nextItem.duration) as unknown as number;
      }
    }
  }, [activeOverlay, queue, dismiss]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    dismiss();
  }, [dismiss]);

  return {
    activeOverlay,
    queue,
    enqueue,
    dismiss,
    clearQueue,
  };
}
