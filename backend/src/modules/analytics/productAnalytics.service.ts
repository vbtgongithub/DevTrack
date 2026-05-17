// src/modules/analytics/productAnalytics.service.ts — Product Analytics Event Pipeline
// Phase-B: Immutable analytics events for retention tracking

import { Types } from 'mongoose';
import { getRedisClient } from '../../shared/redis/client.js';
import { logger } from '../../shared/logger.js';

// Analytics event types
export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'feature_used'
  | 'streak_updated'
  | 'xp_earned'
  | 'level_up'
  | 'leaderboard_viewed'
  | 'leaderboard_interaction'
  | 'problem_attempted'
  | 'problem_solved'
  | 'inactivity_detected'
  | 'return_visit';

// Immutable analytics event
export interface AnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  userId: string;
  timestamp: Date;
  sessionId?: string;
  properties: Record<string, unknown>;
  source: 'frontend' | 'backend' | 'worker';
}

// Aggregation buckets
export interface RetentionMetrics {
  date: string;
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  retainedUsers: number;
  retentionRate: number;
}

export interface EngagementMetrics {
  date: string;
  avgSessionDuration: number;
  avgDailyXp: number;
  avgProblemsSolved: number;
  leaderboardViews: number;
}

const ANALYTICS_KEYS = {
  dailyEvents: (date: string) => `analytics:events:${date}`,
  sessionData: (sessionId: string) => `analytics:session:${sessionId}`,
  retentionData: (date: string) => `analytics:retention:${date}`,
};

export const productAnalytics = {
  // ─── Track analytics event ───────────────────────────────────────────
  async track(
    eventType: AnalyticsEventType,
    userId: string,
    properties: Record<string, unknown>,
    options?: { sessionId?: string; source?: 'frontend' | 'backend' | 'worker' }
  ): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      eventType,
      userId,
      timestamp: new Date(),
      sessionId: options?.sessionId,
      properties,
      source: options?.source || 'backend',
    };

    // Store in Redis for real-time access
    const redis = getRedisClient();
    const dateKey = event.timestamp.toISOString().split('T')[0];

    // Add to daily event stream
    await redis.lpush(ANALYTICS_KEYS.dailyEvents(dateKey), JSON.stringify(event));

    // Trim to keep last 1000 events per day in Redis
    await redis.ltrim(ANALYTICS_KEYS.dailyEvents(dateKey), 0, 999);

    // Periodic flush to MongoDB (every 100 events or 1 minute)
    await this.maybeFlush(dateKey);

    logger.debug('[analytics] Event tracked', { eventType, userId, eventId: event.id });

    return event;
  },

  // ─── Flush events to MongoDB (batched) ────────────────────────────────
  async flushToDatabase(dateKey: string): Promise<number> {
    const redis = getRedisClient();
    const key = ANALYTICS_KEYS.dailyEvents(dateKey);

    const events = await redis.lrange(key, 0, -1);
    if (events.length === 0) return 0;

    // Would store in ActivityEvent or dedicated analytics collection
    // For now, just log
    logger.info('[analytics] Flushing events to DB', { dateKey, count: events.length });

    // Clear after flush (deduplication handled by event IDs)
    await redis.del(key);

    return events.length;
  },

  // ─── Periodic flush check ───────────────────────────────────────────
  async maybeFlush(dateKey: string): Promise<void> {
    const redis = getRedisClient();
    const key = ANALYTICS_KEYS.dailyEvents(dateKey);
    const length = await redis.llen(key);

    // Flush every 100 events
    if (length >= 100) {
      await this.flushToDatabase(dateKey);
    }
  },

  // ─── Session tracking ─────────────────────────────────────────────────
  async startSession(userId: string, properties?: Record<string, unknown>): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const redis = getRedisClient();

    await redis.hset(ANALYTICS_KEYS.sessionData(sessionId), {
      userId,
      startTime: String(Date.now()),
      ...properties,
    });

    await redis.expire(ANALYTICS_KEYS.sessionData(sessionId), 3600); // 1 hour

    // Track session start
    await this.track('session_start', userId, { sessionId, ...properties });

    return sessionId;
  },

  async endSession(sessionId: string): Promise<void> {
    const redis = getRedisClient();
    const sessionData = await redis.hgetall(ANALYTICS_KEYS.sessionData(sessionId));

    if (!sessionData.userId) return;

    const duration = Date.now() - parseInt(sessionData.startTime || '0', 10);

    // Track session end
    await this.track('session_end', sessionData.userId, {
      sessionId,
      duration,
    });

    // Clean up
    await redis.del(ANALYTICS_KEYS.sessionData(sessionId));
  },

  // ─── Streak retention tracking ───────────────────────────────────────
  async trackStreakRetention(userId: string, streakDays: number): Promise<void> {
    const previousStreakKey = `analytics:streak:prev:${userId}`;
    const redis = getRedisClient();

    const previousStreak = await redis.get(previousStreakKey);
    const previousDays = previousStreak ? parseInt(previousStreak, 10) : 0;

    if (streakDays > previousDays) {
      // Streak improved
      await this.track('streak_updated', userId, {
        previousStreak: previousDays,
        currentStreak: streakDays,
        change: 'increased',
      });
    } else if (streakDays === previousDays && streakDays > 0) {
      // Streak maintained
      await this.track('streak_updated', userId, {
        currentStreak: streakDays,
        change: 'maintained',
      });
    }

    // Update previous streak
    await redis.set(previousStreakKey, String(streakDays), 'EX', 86400 * 30);
  },

  // ─── Inactivity detection ─────────────────────────────────────────
  async detectInactivity(userId: string, daysInactive: number): Promise<void> {
    if (daysInactive === 1) {
      await this.track('inactivity_detected', userId, {
        daysInactive: 1,
        severity: 'mild',
      });
    } else if (daysInactive >= 7) {
      await this.track('inactivity_detected', userId, {
        daysInactive,
        severity: 'critical',
      });
    }
  },

  // ─── Return visit tracking ──────────────────────────────────────────
  async trackReturnVisit(userId: string, daysSinceLastVisit: number): Promise<void> {
    await this.track('return_visit', userId, {
      daysSinceLastVisit,
      segment: daysSinceLastVisit <= 1
        ? 'churned_recent'
        : daysSinceLastVisit <= 7
          ? 'churned_week'
          : 'churned_month',
    });
  },

  // ─── Get engagement metrics ─────────────────────────────────────────
  async getEngagementMetrics(date: Date): Promise<EngagementMetrics> {
    const dateKey = date.toISOString().split('T')[0];
    const redis = getRedisClient();

    const events = await redis.lrange(ANALYTICS_KEYS.dailyEvents(dateKey), 0, -1);

    let sessionDurationSum = 0;
    let sessionCount = 0;
    let xpEarned = 0;
    let problemsSolved = 0;
    let leaderboardViews = 0;

    for (const eventStr of events) {
      const event = JSON.parse(eventStr) as AnalyticsEvent;

      switch (event.eventType) {
        case 'session_end':
          if (event.properties.duration) {
            sessionDurationSum += event.properties.duration as number;
            sessionCount++;
          }
          break;
        case 'xp_earned':
          xpEarned++;
          break;
        case 'problem_solved':
          problemsSolved++;
          break;
        case 'leaderboard_viewed':
          leaderboardViews++;
          break;
      }
    }

    const uniqueUsers = new Set(events.map((e) => JSON.parse(e).userId)).size;

    return {
      date: dateKey,
      avgSessionDuration: sessionCount > 0 ? sessionDurationSum / sessionCount : 0,
      avgDailyXp: uniqueUsers > 0 ? xpEarned / uniqueUsers : 0,
      avgProblemsSolved: uniqueUsers > 0 ? problemsSolved / uniqueUsers : 0,
      leaderboardViews,
    };
  },

  // ─── Get retention metrics ───────────────────────────────────────────
  async getRetentionMetrics(forDate: Date): Promise<RetentionMetrics> {
    const dateKey = forDate.toISOString().split('T')[0];
    const redis = getRedisClient();

    // Get unique users from today's events
    const todayEvents = await redis.lrange(ANALYTICS_KEYS.dailyEvents(dateKey), 0, -1);
    const todayUsers = new Set(todayEvents.map((e) => JSON.parse(e).userId));

    // Calculate weekly active (would need historical data - simplified)
    const weeklyActiveUsers = todayUsers.size;

    // Would need cohort analysis for actual retention calculation
    return {
      date: dateKey,
      totalUsers: todayUsers.size,
      dailyActiveUsers: todayUsers.size,
      weeklyActiveUsers,
      retainedUsers: weeklyActiveUsers,
      retentionRate: 100, // Simplified
    };
  },

  // ─── Feature usage tracking ─────────────────────────────────────────
  async trackFeatureUsage(
    userId: string,
    featureName: string,
    properties?: Record<string, unknown>
  ): Promise<void> {
    await this.track('feature_used', userId, {
      featureName,
      ...properties,
    });
  },
};

export default productAnalytics;