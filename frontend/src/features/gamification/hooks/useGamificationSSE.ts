// ============================================================================
// useGamificationSSE.ts — Gamification SSE Event Handler
// ============================================================================
// Handles SSE events related to gamification (XP, level, streak, achievements).
// Updates Zustand store and invalidates TanStack Query cache.
// ============================================================================

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSse, type SseEvent } from '../../../hooks/useSse';
import { useGamificationStore } from '../../../store/gamificationStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { xpQueryKeys } from './useXpState';
import { streakQueryKeys } from './useStreakState';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to handle gamification-related SSE events
 * 
 * Automatically subscribes to SSE events and updates:
 * - Zustand gamification store (optimistic UI updates)
 * - TanStack Query cache (background refetch)
 * - Notification store (user feedback)
 * 
 * @example
 * // In a top-level component (e.g., AppProviders)
 * useGamificationSSE();
 */
export const useGamificationSSE = () => {
  const queryClient = useQueryClient();
  const gamificationStore = useGamificationStore();
  const notificationStore = useNotificationStore();
  const { lastEvent } = useSse();

  useEffect(() => {
    if (!lastEvent) return;

    handleGamificationEvent(lastEvent, {
      gamificationStore,
      notificationStore,
      queryClient,
    });
  }, [lastEvent, gamificationStore, notificationStore, queryClient]);
};

// ---------------------------------------------------------------------------
// Event Handler
// ---------------------------------------------------------------------------

interface Stores {
  gamificationStore: any;
  notificationStore: any;
  queryClient: ReturnType<typeof useQueryClient>;
}

function handleGamificationEvent(event: SseEvent, stores: Stores) {
  const { gamificationStore, notificationStore, queryClient } = stores;

  switch (event.type) {
    case 'xp_updated': {
      // Optimistically update live XP
      if (event.stats?.totalSolved !== undefined) {
        gamificationStore.setLiveXp(event.stats.totalSolved);
      }

      // Show XP gain animation if we have the amount
      if (event.stats?.easySolved !== undefined && event.stats.easySolved > 0) {
        gamificationStore.setPendingXpGain(event.stats.easySolved);
        
        // Clear after animation duration
        setTimeout(() => {
          gamificationStore.setPendingXpGain(null);
        }, 1800);
      }

      // Background refetch to confirm
      queryClient.invalidateQueries({ queryKey: xpQueryKeys.current });
      break;
    }

    case 'level_up': {
      // Update live level
      if (event.stats?.rating !== undefined) {
        gamificationStore.setLiveLevel(event.stats.rating);
      }

      // Show level-up overlay
      const newLevel = event.stats?.rating ?? 1;
      const totalXp = event.stats?.totalSolved ?? 0;
      gamificationStore.showLevelUpOverlay({ newLevel, totalXp });

      // Invalidate XP query
      queryClient.invalidateQueries({ queryKey: xpQueryKeys.current });

      // Add notification
      notificationStore.addNotification({
        id: `level-up-${Date.now()}`,
        type: 'level_up',
        title: `Level ${newLevel} Reached!`,
        body: 'You\'ve unlocked new achievements and rewards',
        createdAt: Date.now(),
        read: false,
      });
      break;
    }

    case 'streak_milestone': {
      // Update live streak
      if (event.stats?.totalSolved !== undefined) {
        gamificationStore.setLiveStreak(event.stats.totalSolved);
      }

      // Show streak milestone overlay
      const streakDays = event.stats?.totalSolved ?? 0;
      gamificationStore.showStreakMilestoneOverlay({ days: streakDays });

      // Invalidate streak query
      queryClient.invalidateQueries({ queryKey: streakQueryKeys.current });

      // Add notification
      notificationStore.addNotification({
        id: `streak-milestone-${Date.now()}`,
        type: 'streak_milestone',
        title: `${streakDays} Day Streak!`,
        body: 'Your consistency is building compound growth',
        createdAt: Date.now(),
        read: false,
      });
      break;
    }

    case 'streak_at_risk': {
      // Add high-priority notification
      notificationStore.addNotification({
        id: `streak-at-risk-${Date.now()}`,
        type: 'streak_at_risk',
        title: 'Streak at Risk',
        body: 'Complete an activity today to keep your streak alive',
        createdAt: Date.now(),
        read: false,
      });
      break;
    }

    case 'achievement_unlocked': {
      // Show achievement overlay
      if (event.payload) {
        gamificationStore.showAchievementOverlay(event.payload);
      }

      // Invalidate achievements query
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'achievements'] });

      // Add notification
      notificationStore.addNotification({
        id: `achievement-${Date.now()}`,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        body: event.payload?.name ?? 'New achievement earned',
        createdAt: Date.now(),
        read: false,
      });
      break;
    }

    case 'sync_completed': {
      // Invalidate all gamification queries on sync
      queryClient.invalidateQueries({ queryKey: xpQueryKeys.current });
      queryClient.invalidateQueries({ queryKey: streakQueryKeys.current });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      break;
    }
  }
}
