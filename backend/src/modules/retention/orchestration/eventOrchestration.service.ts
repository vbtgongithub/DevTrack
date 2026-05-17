// src/modules/retention/orchestration/eventOrchestration.service.ts — Retention Event Orchestrator
// Phase-C1: Centralized engagement event handling with deduplication

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { eventBus } from '../../../shared/sse/index.js';
import { notificationService } from '../../../modules/notifications/notification.service.js';
import { productAnalytics } from '../../../modules/analytics/productAnalytics.service.js';

// ─── Event Types ─────────────────────────────────────────────────────────────

export type RetentionEventType =
  | 'goal_completed'
  | 'goal_progress'
  | 'challenge_completed'
  | 'challenge_started'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'level_up'
  | 'momentum_spike'
  | 'momentum_dip'
  | 'near_goal'
  | 'comeback_started'
  | 'comeback_completed'
  | 'burnout_warning'
  | 'streak_at_risk'
  | 'daily_login';

export interface RetentionEvent {
  id: string;
  type: RetentionEventType;
  userId: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, unknown>;
  source: 'system' | 'user' | 'worker';
}

// Event priority mapping
const EVENT_PRIORITY: Record<RetentionEventType, 'low' | 'medium' | 'high' | 'critical'> = {
  goal_completed: 'medium',
  goal_progress: 'low',
  challenge_completed: 'medium',
  challenge_started: 'low',
  achievement_unlocked: 'high',
  streak_milestone: 'high',
  level_up: 'high',
  momentum_spike: 'medium',
  momentum_dip: 'low',
  near_goal: 'medium',
  comeback_started: 'high',
  comeback_completed: 'high',
  burnout_warning: 'critical',
  streak_at_risk: 'high',
  daily_login: 'low',
};

// Event cooldown windows (in milliseconds)
const EVENT_COOLDOWNS: Partial<Record<RetentionEventType, number>> = {
  goal_completed: 60000, // 1 minute
  challenge_completed: 60000,
  achievement_unlocked: 300000, // 5 minutes
  streak_milestone: 3600000, // 1 hour
  level_up: 60000,
  momentum_spike: 300000,
  near_goal: 60000,
  comeback_started: 86400000, // 1 day
  burnout_warning: 3600000,
  streak_at_risk: 1800000, // 30 minutes
};

// Redis keys
const ORCHESTRATION_KEYS = {
  eventCooldown: (userId: string, eventType: string) => `orchestration:cooldown:${userId}:${eventType}`,
  recentEvents: (userId: string) => `orchestration:recent:${userId}`,
};

export const eventOrchestration = {
  // ─── Handle incoming retention event ────────────────────────────────────
  async handleEvent(event: RetentionEvent): Promise<void> {
    const { userId, type, priority } = event;

    // Check deduplication cooldown
    const canProcess = await this.checkCooldown(userId, type);
    if (!canProcess) {
      logger.debug('[orchestration] Event skipped - in cooldown', {
        userId,
        type,
      });
      return;
    }

    // Process event through orchestration pipeline
    await Promise.all([
      this.fanoutToNotifications(userId, event),
      this.fanoutToSSE(userId, event),
      this.fanoutToAnalytics(event),
      this.updateCooldown(userId, type),
    ]);

    logger.info('[orchestration] Event processed', {
      userId,
      type,
      priority,
      eventId: event.id,
    });
  },

  // ─── Fanout to notification system ───────────────────────────────────────
  async fanoutToNotifications(userId: string, event: RetentionEvent): Promise<void> {
    const { type, data } = event;

    // Map retention events to notification types
    const notificationMap: Partial<Record<RetentionEventType, { title: string; message: string }>> = {
      goal_completed: {
        title: 'Goal Completed! 🎯',
        message: `You completed: ${data.goalTitle || 'your goal'}`,
      },
      challenge_completed: {
        title: 'Challenge Conquered! 🏆',
        message: `You completed: ${data.challengeTitle || 'a challenge'}`,
      },
      achievement_unlocked: {
        title: 'Achievement Unlocked! 🏅',
        message: `You earned: ${data.achievementName || 'a new achievement'}`,
      },
      streak_milestone: {
        title: `${data.streakDays} Day Streak! 🔥`,
        message: 'Amazing consistency! Keep it up!',
      },
      level_up: {
        title: `Level Up! ⬆️`,
        message: `You reached level ${data.newLevel}`,
      },
      streak_at_risk: {
        title: 'Streak at Risk! ⚠️',
        message: "Don't lose your streak - log activity today!",
      },
      burnout_warning: {
        title: 'Take a Break 💤',
        message: 'You\'ve been very active. Consider taking a break.',
      },
      near_goal: {
        title: 'Almost There! 🎯',
        message: `You're ${data.xpNeeded} XP away from ${data.goalName}`,
      },
    };

    const notifConfig = notificationMap[type];
    if (!notifConfig) return;

    // Only notify for high priority events
    if (EVENT_PRIORITY[type] === 'low') return;

    try {
      await notificationService.create(
        userId,
        'achievement' as any,
        notifConfig.title,
        notifConfig.message,
        data
      );
    } catch (err) {
      logger.warn('[orchestration] Failed to send notification', { error: err, userId, type });
    }
  },

  // ─── Fanout to SSE for real-time updates ─────────────────────────────────
  async fanoutToSSE(userId: string, event: RetentionEvent): Promise<void> {
    const { type, data } = event;

    // Map to SSE event type
    const sseTypeMap: Record<RetentionEventType, string> = {
      goal_completed: 'badge_earned',
      goal_progress: 'xp_updated',
      challenge_completed: 'badge_earned',
      challenge_started: 'xp_updated',
      achievement_unlocked: 'badge_earned',
      streak_milestone: 'streak_milestone',
      level_up: 'level_up',
      momentum_spike: 'xp_updated',
      momentum_dip: 'xp_updated',
      near_goal: 'xp_updated',
      comeback_started: 'streak_milestone',
      comeback_completed: 'level_up',
      burnout_warning: 'xp_updated',
      streak_at_risk: 'streak_milestone',
      daily_login: 'xp_updated',
    };

    const sseType = sseTypeMap[type];

    eventBus.publish(
      {
        type: sseType as any,
        timestamp: event.timestamp.toISOString(),
        userId,
        stats: data as any,
      },
      userId
    );
  },

  // ─── Fanout to analytics pipeline ────────────────────────────────────────
  async fanoutToAnalytics(event: RetentionEvent): Promise<void> {
    const { type, userId, data, timestamp } = event;

    // Track important events in analytics
    const analyticsEventMap: Record<RetentionEventType, string | null> = {
      goal_completed: 'goal_completed',
      goal_progress: null, // Too frequent
      challenge_completed: 'challenge_completed',
      challenge_started: null,
      achievement_unlocked: 'achievement_unlocked',
      streak_milestone: 'streak_updated',
      level_up: 'level_up',
      momentum_spike: 'momentum_updated',
      momentum_dip: 'momentum_updated',
      near_goal: 'near_goal',
      comeback_started: 'comeback_started',
      comeback_completed: 'comeback_completed',
      burnout_warning: 'burnout_warning',
      streak_at_risk: 'streak_updated',
      daily_login: 'session_start',
    };

    const analyticsEvent = analyticsEventMap[type];
    if (!analyticsEvent) return;

    try {
      await productAnalytics.track(
        analyticsEvent as any,
        userId,
        {
          ...data,
          eventPriority: EVENT_PRIORITY[type],
          source: event.source,
        }
      );
    } catch (err) {
      logger.warn('[orchestration] Failed to track analytics', { error: err, type });
    }
  },

  // ─── Check event cooldown for deduplication ─────────────────────────────
  async checkCooldown(userId: string, eventType: RetentionEventType): Promise<boolean> {
    const cooldownMs = EVENT_COOLDOWNS[eventType];
    if (!cooldownMs) return true; // No cooldown for this event type

    const redis = getRedisClient();
    const key = ORCHESTRATION_KEYS.eventCooldown(userId, eventType);

    const lastEvent = await redis.get(key);
    if (!lastEvent) return true;

    const lastEventTime = parseInt(lastEvent, 10);
    const timeSinceLastEvent = Date.now() - lastEventTime;

    return timeSinceLastEvent >= cooldownMs;
  },

  // ─── Update event cooldown ──────────────────────────────────────────────
  async updateCooldown(userId: string, eventType: RetentionEventType): Promise<void> {
    const cooldownMs = EVENT_COOLDOWNS[eventType];
    if (!cooldownMs) return;

    const redis = getRedisClient();
    const key = ORCHESTRATION_KEYS.eventCooldown(userId, eventType);

    await redis.set(key, String(Date.now()), 'PX', cooldownMs);
  },

  // ─── Track recent event count for rate limiting ─────────────────────────
  async getRecentEventCount(userId: string, windowMs: number): Promise<number> {
    const redis = getRedisClient();
    const key = ORCHESTRATION_KEYS.recentEvents(userId);

    const now = Date.now();
    const windowStart = now - windowMs;

    // Use sorted set for time-bounded event tracking
    await redis.zadd(key, now, `${now}`);
    await redis.zremrangebyscore(key, 0, windowStart);
    await redis.expire(key, Math.ceil(windowMs / 1000) + 10);

    return await redis.zcard(key);
  },

  // ─── Create event with standard structure ────────────────────────────────
  createEvent(
    type: RetentionEventType,
    userId: string,
    data: Record<string, unknown>,
    source: 'system' | 'user' | 'worker' = 'system'
  ): RetentionEvent {
    return {
      id: `ret_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      userId,
      timestamp: new Date(),
      priority: EVENT_PRIORITY[type],
      data,
      source,
    };
  },

  // ─── Handle milestone events with special priority ──────────────────────
  async handleMilestone(userId: string, milestoneType: string, value: number): Promise<void> {
    const milestoneEvent = this.createEvent(
      'achievement_unlocked',
      userId,
      {
        milestoneType,
        milestoneValue: value,
        achievementName: this.getMilestoneName(milestoneType, value),
      },
      'system'
    );
    milestoneEvent.priority = 'critical';

    await this.handleEvent(milestoneEvent);
  },

  // ─── Helper to get milestone name ───────────────────────────────────────
  getMilestoneName(type: string, value: number): string {
    const names: Record<string, Record<number, string>> = {
      streak: {
        7: 'Week Warrior',
        14: 'Fortnight Force',
        30: 'Monthly Master',
        100: 'Century Champion',
      },
      problems: {
        10: 'Problem Solver',
        50: 'Code Warrior',
        100: 'Algorithm Ace',
        500: 'DSA Master',
      },
      xp: {
        1000: 'XP Hunter',
        5000: 'XP Champion',
        10000: 'XP Legend',
      },
      level: {
        5: 'Rising Star',
        10: 'Level Master',
        15: 'Elite Coder',
      },
    };

    return names[type]?.[value] ?? `${type} milestone`;
  },
};

export default eventOrchestration;