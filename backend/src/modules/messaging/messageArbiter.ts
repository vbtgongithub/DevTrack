// src/modules/messaging/messageArbiter.ts — Priority, cooldown, suppression rules
// Decides whether a message should be sent based on user state and message history

import { getRedisClient } from '../../shared/redis/client.js';
import { logger } from '../../shared/logger.js';

export interface MessageDecision {
  allowed: boolean;
  reason?: string;
  suppressed?: boolean;
  cooldownActive?: boolean;
}

export interface MessagePriority {
  level: 'critical' | 'high' | 'normal' | 'low';
  score: number;
}

const COOLDOWN_PERIOD_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_MESSAGES_PER_DAY = 5;
const FATIGUE_SUPPRESSION_THRESHOLD = 'high'; // Suppress non-critical messages when fatigue >= high

export class MessageArbiter {
  /**
   * Check if a message should be sent based on priority, cooldown, and suppression rules
   */
  async shouldSend(
    userId: string,
    context: string,
    priority: MessagePriority,
    userState: {
      fatigueState?: string;
      emotionalState?: string;
    }
  ): Promise<MessageDecision> {
    const redis = getRedisClient();
    const cooldownKey = `messaging:cooldown:${userId}`;
    const dailyCountKey = `messaging:daily:${userId}:${new Date().toISOString().split('T')[0]}`;

    try {
      // Check cooldown
      const lastMessageTime = await redis.get(cooldownKey);
      if (lastMessageTime) {
        const timeSinceLastMessage = Date.now() - parseInt(lastMessageTime, 10);
        if (timeSinceLastMessage < COOLDOWN_PERIOD_MS) {
          return {
            allowed: false,
            reason: 'cooldown_active',
            cooldownActive: true,
          };
        }
      }

      // Check daily limit
      const dailyCount = await redis.incr(dailyCountKey);
      if (dailyCount === 1) {
        await redis.expire(dailyCountKey, 86400); // 24 hours
      }
      if (dailyCount > MAX_MESSAGES_PER_DAY) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
        };
      }

      // Fatigue suppression
      if (
        userState.fatigueState === FATIGUE_SUPPRESSION_THRESHOLD &&
        priority.level !== 'critical'
      ) {
        logger.info('[messaging] Message suppressed due to fatigue', {
          userId,
          context,
          fatigueState: userState.fatigueState,
          priority: priority.level,
        });
        return {
          allowed: false,
          reason: 'fatigue_suppression',
          suppressed: true,
        };
      }

      // Message allowed - set cooldown
      await redis.set(cooldownKey, Date.now().toString(), 'PX', COOLDOWN_PERIOD_MS);

      return {
        allowed: true,
      };
    } catch (error) {
      logger.error('[messaging] Error in message arbitration', { error, userId, context });
      // Fail open - allow message if arbitration fails
      return {
        allowed: true,
        reason: 'arbitration_error',
      };
    }
  }

  /**
   * Get message priority based on context and user state
   */
  getPriority(context: string, userState: { emotionalState?: string }): MessagePriority {
    // Critical messages
    if (context === 'comeback') {
      return { level: 'critical', score: 100 };
    }

    // High priority messages
    if (context === 'streak_at_risk') {
      return { level: 'high', score: 80 };
    }

    // Normal priority
    if (['level_up', 'milestone_reached', 'goal_completed', 'challenge_completed'].includes(context)) {
      return { level: 'normal', score: 50 };
    }

    // Low priority
    if (context === 'fatigue_warning') {
      // Elevate priority if user is discouraged
      if (userState.emotionalState === 'discouraged' || userState.emotionalState === 'overwhelmed') {
        return { level: 'high', score: 70 };
      }
      return { level: 'low', score: 30 };
    }

    return { level: 'normal', score: 50 };
  }

  /**
   * Reset cooldown for a user (for testing or manual override)
   */
  async resetCooldown(userId: string): Promise<void> {
    const redis = getRedisClient();
    const cooldownKey = `messaging:cooldown:${userId}`;
    await redis.del(cooldownKey);
    logger.info('[messaging] Cooldown reset', { userId });
  }
}

export const messageArbiter = new MessageArbiter();
