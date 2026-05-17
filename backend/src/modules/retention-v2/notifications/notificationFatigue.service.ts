// src/modules/retention-v2/notifications/notificationFatigue.service.ts — Notification Fatigue Orchestrator
// Phase-D: Prevent notification burnout with engagement-aware delivery

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { retentionProfileService } from '../profile/retentionProfile.service.js';
import { fatigueSuppressionService } from '../fatigue/fatigueSuppression.service.js';

export interface NotificationDecision {
  shouldSend: boolean;
  delay?: number; // hours to delay
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface NotificationHealth {
  sentToday: number;
  openedToday: number;
  fatigueScore: number;
  healthScore: number;
}

// Notification types with priority and fatigue sensitivity
const NOTIFICATION_CONFIG: Record<string, { priority: 'critical' | 'high' | 'medium' | 'low'; fatigueSensitive: boolean; maxDaily: number }> = {
  streak_reminder: { priority: 'high', fatigueSensitive: true, maxDaily: 3 },
  streak_milestone: { priority: 'critical', fatigueSensitive: false, maxDaily: 1 },
  level_up: { priority: 'critical', fatigueSensitive: false, maxDaily: 1 },
  goal_completed: { priority: 'medium', fatigueSensitive: true, maxDaily: 5 },
  challenge_completed: { priority: 'medium', fatigueSensitive: true, maxDaily: 3 },
  achievement: { priority: 'high', fatigueSensitive: false, maxDaily: 2 },
  comeback: { priority: 'high', fatigueSensitive: true, maxDaily: 1 },
  inactivity: { priority: 'low', fatigueSensitive: true, maxDaily: 1 },
  burnout_warning: { priority: 'low', fatigueSensitive: true, maxDaily: 1 },
};

const NOTIF_KEYS = {
  sentCount: (userId: string) => `notif:sent:${userId}`,
  openCount: (userId: string) => `notif:open:${userId}`,
  lastSent: (userId: string, type: string) => `notif:last:${userId}:${type}`,
  cooldown: (userId: string, type: string) => `notif:cooldown:${userId}:${type}`,
  dailyReset: 'notif:daily:reset',
};

export const notificationFatigueService = {
  // ─── Decide whether to send notification ───────────────────────────────
  async shouldSendNotification(
    userId: string,
    type: string
  ): Promise<NotificationDecision> {
    const config = NOTIFICATION_CONFIG[type as keyof typeof NOTIFICATION_CONFIG];
    if (!config) {
      return { shouldSend: true, priority: 'medium', reason: 'Unknown type - allow' };
    }

    const redis = getRedisClient();

    // Check daily limit
    const sentKey = NOTIF_KEYS.sentCount(userId);
    const sentToday = parseInt((await redis.get(sentKey)) || '0', 10);
    if (sentToday >= config.maxDaily) {
      return {
        shouldSend: false,
        priority: config.priority,
        reason: `Daily limit reached (${config.maxDaily})`,
      };
    }

    // Check fatigue from profile
    const profile = await retentionProfileService.getProfile(userId);
    if (profile) {
      // High fatigue = reduce notifications
      if (profile.notificationFatigue > 70) {
        return {
          shouldSend: false,
          priority: config.priority,
          reason: 'High notification fatigue',
        };
      }

      // Fatigued state = critical only
      if (profile.state === 'fatigued' && config.priority !== 'critical') {
        return {
          shouldSend: false,
          priority: config.priority,
          reason: 'User in fatigued state',
        };
      }

      // Burnout risk = no notifications
      if (profile.state === 'burnout_risk') {
        return {
          shouldSend: false,
          priority: config.priority,
          reason: 'User at burnout risk',
        };
      }
    }

    // Check suppression from fatigue service
    const suppression = await fatigueSuppressionService.getSuppressionLevel(userId);
    if (suppression.notificationSuppression > 50) {
      if (config.priority !== 'critical') {
        return {
          shouldSend: false,
          priority: config.priority,
          reason: `Suppression active (${suppression.notificationSuppression}%)`,
        };
      }
    }

    // Check type-specific cooldown
    const cooldownKey = NOTIF_KEYS.cooldown(userId, type);
    const inCooldown = await redis.exists(cooldownKey);
    if (inCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      return {
        shouldSend: false,
        priority: config.priority,
        reason: `Type cooldown (${Math.ceil(ttl / 60)} min)`,
        delay: Math.ceil(ttl / 3600),
      };
    }

    // Check engagement time preferences (placeholder)
    // Would check user's preferred notification hours

    // All checks passed - allow with priority
    return {
      shouldSend: true,
      priority: config.priority,
      reason: 'All checks passed',
    };
  },

  // ─── Record notification sent ───────────────────────────────────────
  async recordNotificationSent(userId: string, type: string): Promise<void> {
    const redis = getRedisClient();
    const today = new Date().toISOString().split('T')[0];

    // Increment daily count
    const sentKey = NOTIF_KEYS.sentCount(userId);
    await redis.incr(sentKey);
    await redis.expire(sentKey, 86400); // 24 hours

    // Set type-specific cooldown
    const config = NOTIFICATION_CONFIG[type as keyof typeof NOTIFICATION_CONFIG];
    const cooldownMinutes = config ? 60 : 30; // Default 30 min
    const cooldownKey = NOTIF_KEYS.cooldown(userId, type);
    await redis.set(cooldownKey, '1', 'EX', cooldownMinutes * 60);

    logger.debug('[notif-fatigue] Notification recorded', { userId, type });
  },

  // ─── Record notification opened ───────────────────────────────────────
  async recordNotificationOpened(userId: string): Promise<void> {
    const redis = getRedisClient();

    const openKey = NOTIF_KEYS.openCount(userId);
    await redis.incr(openKey);
    await redis.expire(openKey, 86400);

    // Update engagement quality
    const profile = await retentionProfileService.getProfile(userId);
    if (profile) {
      // Opening notifications is positive engagement
      const newResponsiveness = Math.min(100, profile.notificationResponsiveness + 5);
      // Would update in profile
    }
  },

  // ─── Get notification health ─────────────────────────────────────────
  async getNotificationHealth(userId: string): Promise<NotificationHealth> {
    const redis = getRedisClient();

    const sentKey = NOTIF_KEYS.sentCount(userId);
    const openKey = NOTIF_KEYS.openCount(userId);

    const sentToday = parseInt((await redis.get(sentKey)) || '0', 10);
    const openedToday = parseInt((await redis.get(openKey)) || '0', 10);

    // Calculate fatigue score
    let fatigueScore = 0;
    if (sentToday > 10) fatigueScore += 30;
    if (sentToday > 15) fatigueScore += 30;
    if (sentToday > 0 && openedToday === 0) fatigueScore += 20; // Not opening

    // Get profile-based fatigue
    const profile = await retentionProfileService.getProfile(userId);
    if (profile) {
      fatigueScore = Math.max(fatigueScore, profile.notificationFatigue);
    }

    // Health score
    const openRate = sentToday > 0 ? openedToday / sentToday : 0;
    const healthScore = Math.max(0, 100 - fatigueScore - (openRate < 0.3 ? 20 : 0));

    return {
      sentToday,
      openedToday,
      fatigueScore,
      healthScore,
    };
  },

  // ─── Batch notifications for digest ───────────────────────────────────
  async getDigestRecommendations(userId: string): Promise<{
    shouldSend: boolean;
    digestType: 'realtime' | 'daily' | 'weekly' | 'none';
    messages: string[];
  }> {
    const health = await this.getNotificationHealth(userId);
    const profile = await retentionProfileService.getProfile(userId);

    // High fatigue = switch to digest
    if (health.fatigueScore > 60 || (profile?.notificationFatigue ?? 0) > 60) {
      const messages = [];
      if (health.sentToday > 10) messages.push('High volume - switch to daily digest');
      if (health.healthScore < 40) messages.push('Low engagement - reduce frequency');

      return {
        shouldSend: true,
        digestType: 'daily',
        messages,
      };
    }

    // Normal = realtime is fine
    if (health.healthScore > 60) {
      return {
        shouldSend: true,
        digestType: 'realtime',
        messages: ['Healthy engagement - use realtime'],
      };
    }

    // Medium = use daily digest
    return {
      shouldSend: true,
      digestType: 'daily',
      messages: ['Moderate engagement - daily digest recommended'],
    };
  },

  // ─── Reset daily counters ───────────────────────────────────────────────
  async resetDailyCounters(): Promise<void> {
    // Called by daily cron job
    logger.info('[notif-fatigue] Daily reset triggered');
    // Redis expiry handles this automatically
  },
};

export default notificationFatigueService;