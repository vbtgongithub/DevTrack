// src/modules/retention-v2/pacing/emotionalPacing.service.ts — Emotional Pacing Engine
// Phase-D: Psychologically timed reward systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { retentionProfileService } from '../profile/retentionProfile.service.js';

export interface PacingConfig {
  rewardSpacing: number; // hours between significant rewards
  milestoneFrequency: 'aggressive' | 'balanced' | 'relaxed';
  levelUpPacing: 'fast' | 'standard' | 'slow';
  streakMilestonePacing: 'aggressive' | 'balanced' | 'relaxed';
}

export interface RewardTiming {
  shouldReward: boolean;
  rewardType: 'xp' | 'achievement' | 'milestone' | 'streak' | 'level';
  timingScore: number; // 0-100, how good is this timing
  message: string;
}

// Minimum spacing between rewards (hours)
const MIN_REWARD_SPACING = {
  xp: 1,
  achievement: 4,
  milestone: 8,
  streak: 12,
  level: 6,
};

// Pacing configuration
const PACING_CONFIGS: Record<string, PacingConfig> = {
  aggressive: { rewardSpacing: 2, milestoneFrequency: 'aggressive', levelUpPacing: 'fast', streakMilestonePacing: 'aggressive' },
  balanced: { rewardSpacing: 4, milestoneFrequency: 'balanced', levelUpPacing: 'standard', streakMilestonePacing: 'balanced' },
  relaxed: { rewardSpacing: 8, milestoneFrequency: 'relaxed', levelUpPacing: 'slow', streakMilestonePacing: 'relaxed' },
};

const PACING_KEYS = {
  lastReward: (userId: string, type: string) => `pacing:last:${userId}:${type}`,
  rewardQueue: (userId: string) => `pacing:queue:${userId}`,
};

export const emotionalPacingService = {
  // ─── Get pacing configuration for user ───────────────────────────────────
  async getPacingConfig(userId: string): Promise<PacingConfig> {
    const profile = await retentionProfileService.getProfile(userId);

    if (!profile) {
      return PACING_CONFIGS.balanced;
    }

    // Adjust pacing based on state
    switch (profile.state) {
      case 'high_momentum':
        return PACING_CONFIGS.aggressive; // Ride the wave
      case 'fatigued':
      case 'burnout_risk':
        return PACING_CONFIGS.relaxed; // Give space
      case 'recovering':
        return PACING_CONFIGS.relaxed;
      case 'streak_risk':
        return PACING_CONFIGS.aggressive; // Need encouragement
      case 'comeback_candidate':
        return PACING_CONFIGS.balanced; // Gentle re-entry
      default:
        return PACING_CONFIGS.balanced;
    }
  },

  // ─── Check if reward should be given ────────────────────────────────────
  async shouldGiveReward(userId: string, rewardType: RewardTiming['rewardType']): Promise<RewardTiming> {
    const redis = getRedisClient();
    const lastRewardKey = PACING_KEYS.lastReward(userId, rewardType);

    const lastReward = await redis.get(lastRewardKey);
    const now = Date.now();

    // Get minimum spacing for this reward type
    const minSpacing = MIN_REWARD_SPACING[rewardType] * 60 * 60 * 1000;

    // Get pacing config to adjust timing
    const config = await this.getPacingConfig(userId);
    const spacingMultiplier = config.rewardSpacing / 4; // balanced = 1
    const adjustedSpacing = minSpacing * spacingMultiplier;

    if (lastReward) {
      const timeSinceLast = now - parseInt(lastReward, 10);
      if (timeSinceLast < adjustedSpacing) {
        return {
          shouldReward: false,
          rewardType,
          timingScore: Math.round((timeSinceLast / adjustedSpacing) * 100),
          message: `Wait ${Math.ceil((adjustedSpacing - timeSinceLast) / (1000 * 60 * 60))} hours`,
        };
      }
    }

    // Check profile for timing quality
    const profile = await retentionProfileService.getProfile(userId);
    let timingScore = 70; // default

    if (profile) {
      // Good momentum = better timing
      if (profile.momentumScore > 20) timingScore = 90;
      if (profile.momentumScore > 40) timingScore = 95;

      // Fatigue reduces timing quality
      if (profile.fatigueScore > 40) timingScore = Math.max(40, timingScore - 20);

      // High engagement quality = good timing
      if (profile.engagementQuality > 70) timingScore = Math.min(95, timingScore + 10);
    }

    return {
      shouldReward: true,
      rewardType,
      timingScore,
      message: this.getRewardMessage(rewardType, timingScore),
    };
  },

  // ─── Record reward given ─────────────────────────────────────────────────
  async recordReward(userId: string, rewardType: RewardTiming['rewardType']): Promise<void> {
    const redis = getRedisClient();
    const lastRewardKey = PACING_KEYS.lastReward(userId, rewardType);

    await redis.set(lastRewardKey, String(Date.now()));

    logger.debug('[pacing] Reward recorded', { userId, rewardType });
  },

  // ─── Queue reward for later ─────────────────────────────────────────────
  async queueReward(userId: string, rewardType: RewardTiming['rewardType'], delayHours: number): Promise<void> {
    const redis = getRedisClient();
    const queueKey = PACING_KEYS.rewardQueue(userId);

    const queueItem = {
      type: rewardType,
      scheduledAt: Date.now() + delayHours * 60 * 60 * 1000,
    };

    await redis.lpush(queueKey, JSON.stringify(queueItem));
    await redis.expire(queueKey, delayHours * 60 * 60 + 3600);
  },

  // ─── Process queued rewards ─────────────────────────────────────────────
  async processRewardQueue(userId: string): Promise<RewardTiming[]> {
    const redis = getRedisClient();
    const queueKey = PACING_KEYS.rewardQueue(userId);

    const items = await redis.lrange(queueKey, 0, -1);
    const now = Date.now();
    const ready: RewardTiming[] = [];

    for (const item of items) {
      const parsed = JSON.parse(item);
      if (parsed.scheduledAt <= now) {
        ready.push({
          shouldReward: true,
          rewardType: parsed.type,
          timingScore: 80,
          message: 'Queued reward ready',
        });
        await redis.lrem(queueKey, 1, item);
      }
    }

    return ready;
  },

  // ─── Calculate optimal milestone timing ───────────────────────────────────
  calculateMilestoneTiming(currentValue: number, targetValue: number, pacing: PacingConfig): {
    nextMilestone: number;
    estimatedHours: number;
    isNearMilestone: boolean;
  } {
    const milestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
    const nextMilestone = milestones.find((m) => m > currentValue) ?? targetValue;

    // Calculate estimated hours based on pace
    const paceMultiplier = pacing.milestoneFrequency === 'aggressive' ? 0.5 :
                           pacing.milestoneFrequency === 'relaxed' ? 2 : 1;

    const remaining = nextMilestone - currentValue;
    const estimatedHours = remaining * 24 * paceMultiplier;

    const isNearMilestone = remaining <= 2;

    return { nextMilestone, estimatedHours, isNearMilestone };
  },

  // ─── Get reward message based on timing ──────────────────────────────────
  getRewardMessage(rewardType: RewardTiming['rewardType'], timingScore: number): string {
    const messages: Record<string, string[]> = {
      xp: [
        'Great time for some XP!',
        'Perfect moment to earn points!',
        'You\'re on fire! Keep going!',
      ],
      achievement: [
        'You\'ve earned a reward!',
        'Achievement unlocked!',
        'Time to celebrate your progress!',
      ],
      milestone: [
        'A milestone awaits!',
        'You\'re close to something big!',
        'Almost there!',
      ],
      streak: [
        'Keep that streak going!',
        'Your consistency is impressive!',
        'One more day to victory!',
      ],
      level: [
        'Level up time!',
        'You\'re ready to level up!',
        'New level, new challenges!',
      ],
    };

    const typeMessages = messages[rewardType] || messages.xp;
    const index = timingScore > 80 ? 0 : timingScore > 60 ? 1 : 2;

    return typeMessages[index] || 'Keep going!';
  },

  // ─── Get pacing health metrics ──────────────────────────────────────────
  async getPacingHealth(userId: string): Promise<{
    recentRewards: number;
    averageSpacing: number;
    pacingHealth: number;
    recommendation: string;
  }> {
    const redis = getRedisClient();
    let totalSpacing = 0;
    let rewardCount = 0;

    for (const type of Object.keys(MIN_REWARD_SPACING)) {
      const lastReward = await redis.get(PACING_KEYS.lastReward(userId, type));
      if (lastReward) {
        rewardCount++;
        totalSpacing += Date.now() - parseInt(lastReward, 10);
      }
    }

    const averageSpacing = rewardCount > 0 ? totalSpacing / rewardCount / (1000 * 60 * 60) : 0;

    // Health: ideal is 4-8 hours between rewards
    let health = 100;
    if (averageSpacing < 2) health = 40; // Too spammy
    if (averageSpacing > 12) health = 60; // Too slow

    let recommendation = 'Pacing looks good!';
    if (health < 50) recommendation = 'Consider slowing down reward frequency';
    if (health > 80 && averageSpacing > 8) recommendation = 'You could use more rewards!';

    return {
      recentRewards: rewardCount,
      averageSpacing: Math.round(averageSpacing * 10) / 10,
      pacingHealth: health,
      recommendation,
    };
  },
};

export default emotionalPacingService;