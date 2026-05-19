// ============================================================================
// eventHandlers.ts — Centralized SSE Event → UI Action Mapping
// ============================================================================
// Single source of truth for how SSE events affect UI state.
// Called by the SseProvider / AppProviders on each SSE event.
// ============================================================================

import type { QueryClient } from '@tanstack/react-query';
import type { SseEvent } from '../../hooks/useSse';
import { useGamificationStore } from '../../store/gamificationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { queryKeys } from '../../lib/queryClient';

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export function handleSseEvent(
  event: SseEvent,
  queryClient: QueryClient
): void {
  const gamification = useGamificationStore.getState();
  const notifications = useNotificationStore.getState();

  switch (event.type) {
    // ─── XP gain ───
    case 'xp_updated': {
      const p = event.payload || {};
      const newXp = p.newTotalXp ?? event.stats?.totalSolved;
      const xpGained = p.xpAwarded ?? event.stats?.easySolved;
      if (typeof newXp === 'number') {
        gamification.setLiveXp(newXp);
      }
      if (typeof xpGained === 'number' && xpGained > 0) {
        gamification.setPendingXpGain(xpGained);
        // Auto-clear after animation completes
        setTimeout(() => {
          useGamificationStore.getState().setPendingXpGain(null);
        }, 2000);
      }
      queryClient.invalidateQueries({ queryKey: ['xp', 'state'] });
      break;
    }

    // ─── Level up ───
    case 'level_up': {
      const p = event.payload || {};
      const newLevel = p.newLevel ?? event.stats?.rating;
      const totalXp = p.totalXp ?? event.stats?.totalSolved;
      if (typeof newLevel === 'number') {
        gamification.triggerLevelUp(newLevel, totalXp ?? 0);
        // Auto-dismiss after 5s
        setTimeout(() => {
          useGamificationStore.getState().dismissLevelUp();
        }, 5000);
      }
      queryClient.invalidateQueries({ queryKey: ['xp', 'state'] });
      notifications.addNotification({
        type: 'level_up',
        title: `Level Up!`,
        body: `You've reached Level ${newLevel}!`,
        priority: 'high',
      });
      break;
    }

    // ─── Streak milestone ───
    case 'streak_milestone': {
      const p = event.payload || {};
      const streakDays = p.days ?? event.stats?.totalSolved;
      if (typeof streakDays === 'number') {
        gamification.triggerStreakMilestone(streakDays);
        // Auto-dismiss after 4s
        setTimeout(() => {
          useGamificationStore.getState().dismissStreakMilestone();
        }, 4000);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.streak });
      notifications.addNotification({
        type: 'streak_milestone',
        title: `${streakDays} Day Streak! 🔥`,
        body: 'Your consistency is paying off!',
        priority: 'high',
      });
      break;
    }

    // ─── Streak at risk ───
    case 'streak_at_risk': {
      notifications.addNotification({
        type: 'streak_at_risk',
        title: 'Streak at Risk',
        body: 'Complete an activity today to keep your streak alive',
        priority: 'high',
        tone: 'gentle-nudge',
      });
      break;
    }

    // ─── Mission progress ───
    case 'mission_progress': {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      break;
    }

    // ─── Achievement unlocked ───
    case 'achievement_unlocked':
    case 'badge_earned': {
      const statsPayload = event.stats as unknown as { id?: string; name?: string; rarity?: string; description?: string; icon?: string };
      const p = event.payload || statsPayload || {};
      gamification.triggerAchievementUnlock({
        id: p.id ?? `achievement-${Date.now()}`,
        name: p.name ?? 'Achievement',
        description: p.description ?? 'You unlocked an achievement!',
        icon: p.icon ?? '🏆',
        rarity: (p.rarity as 'common' | 'rare' | 'epic' | 'legendary') ?? 'common',
      });
      // Auto-dismiss after 4s
      setTimeout(() => {
        useGamificationStore.getState().dismissAchievement();
      }, 4000);
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all });
      notifications.addNotification({
        type: 'achievement_unlocked',
        title: `Achievement Unlocked: ${p.name ?? 'Unknown'}`,
        body: p.description ?? 'Keep it up!',
        priority: 'medium',
      });
      break;
    }

    // ─── Sync completed ───
    case 'sync_completed': {
      const p = event.payload || {};
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.dashboard });
      queryClient.invalidateQueries({ queryKey: ['xp', 'state'] });
      notifications.addNotification({
        type: 'sync_completed',
        title: `${event.platform ?? 'Platform'} sync complete`,
        body: `${p.stats?.ingested ?? event.stats?.ingested ?? 0} new submissions ingested`,
        priority: 'low',
        platform: event.platform,
      });
      break;
    }

    // ─── Sync failed ───
    case 'sync_failed': {
      notifications.addNotification({
        type: 'sync_failed',
        title: `${event.platform ?? 'Platform'} sync failed`,
        body: event.stats?.error ?? 'Sync encountered an error',
        priority: 'high',
      });
      break;
    }

    // ─── Notification created (generic) ───
    case 'notification_created': {
      const p = event.stats as unknown as { title?: string; body?: string; priority?: string };
      notifications.addNotification({
        type: 'notification_created',
        title: p?.title ?? 'Notification',
        body: p?.body,
        priority: (p?.priority as 'low' | 'medium' | 'high') ?? 'low',
      });
      break;
    }

    // ─── Runtime state patches → invalidate dashboard ───
    case 'runtime_state_patch':
    case 'runtime_state_full': {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: ['xp', 'state'] });
      break;
    }

    default:
      break;
  }
}
