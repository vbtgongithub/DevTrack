// src/modules/retention-v2/fatigue/fatigueSuppression.service.ts — Fatigue Suppression Engine
// Phase-D: Prevent retention collapse from over-engagement

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { retentionProfileService } from '../profile/retentionProfile.service.js';

export interface SuppressionConfig {
  notificationSuppression: number; // 0-100
  challengeIntensityReduction: number; // 0-100
  xpPacingSlowdown: number; // 0-100
  streakPressureReduction: number; // 0-100
  cooldownInjection: number; // hours
}

export interface FatigueIndicators {
  excessiveGrinding: boolean;
  decliningConsistency: boolean;
  lowRewardResponsiveness: boolean;
  frustrationIndicators: boolean;
  streakAnxietyPatterns: boolean;
}

// Suppression thresholds
const THRESHOLDS = {
  fatigue: {
    mild: 30,
    moderate: 50,
    severe: 70,
  },
  burnout: {
    warning: 40,
    critical: 70,
  },
  momentum: {
    declining: -20,
    negative: -40,
  },
};

const SUPPRESSION_KEYS = {
  active: (userId: string) => `fatigue:active:${userId}`,
  suppressCount: (userId: string) => `fatigue:count:${userId}`,
  cooldown: (userId: string) => `fatigue:cooldown:${userId}`,
};

export const fatigueSuppressionService = {
  // ─── Check suppression status ───────────────────────────────────────────
  async getSuppressionLevel(userId: string): Promise<SuppressionConfig> {
    const profile = await retentionProfileService.getProfile(userId);

    if (!profile) {
      return this.getDefaultSuppression();
    }

    const { fatigueScore, burnoutProbability, momentumScore, engagementQuality } = profile;

    // Determine suppression level based on multiple factors
    let suppression: SuppressionConfig;

    if (burnoutProbability > THRESHOLDS.burnout.critical) {
      suppression = this.getCriticalSuppression();
    } else if (burnoutProbability > THRESHOLDS.burnout.warning || fatigueScore > THRESHOLDS.fatigue.severe) {
      suppression = this.getSevereSuppression();
    } else if (fatigueScore > THRESHOLDS.fatigue.moderate) {
      suppression = this.getModerateSuppression();
    } else if (fatigueScore > THRESHOLDS.fatigue.mild || momentumScore < THRESHOLDS.momentum.declining) {
      suppression = this.getMildSuppression();
    } else {
      return this.getDefaultSuppression();
    }

    // Check if suppression is already active
    const redis = getRedisClient();
    const activeKey = SUPPRESSION_KEYS.active(userId);
    const isActive = await redis.exists(activeKey);

    if (isActive) {
      // Extend suppression if still needed
      const activeSuppression = await redis.get(activeKey);
      if (activeSuppression) {
        const parsed = JSON.parse(activeSuppression) as SuppressionConfig;
        suppression = {
          notificationSuppression: Math.max(suppression.notificationSuppression, parsed.notificationSuppression),
          challengeIntensityReduction: Math.max(suppression.challengeIntensityReduction, parsed.challengeIntensityReduction),
          xpPacingSlowdown: Math.max(suppression.xpPacingSlowdown, parsed.xpPacingSlowdown),
          streakPressureReduction: Math.max(suppression.streakPressureReduction, parsed.streakPressureReduction),
          cooldownInjection: Math.max(suppression.cooldownInjection, parsed.cooldownInjection),
        };
      }
    }

    return suppression;
  },

  // ─── Activate suppression ───────────────────────────────────────────────
  async activateSuppression(userId: string, config: SuppressionConfig): Promise<void> {
    const redis = getRedisClient();

    // Store active suppression
    await redis.set(
      SUPPRESSION_KEYS.active(userId),
      JSON.stringify(config),
      'EX',
      Math.max(config.cooldownInjection * 3600, 3600)
    );

    // Increment suppression count
    const countKey = SUPPRESSION_KEYS.suppressCount(userId);
    await redis.incr(countKey);

    logger.info('[fatigue] Suppression activated', {
      userId,
      notificationSuppression: config.notificationSuppression,
      challengeReduction: config.challengeIntensityReduction,
      xpSlowdown: config.xpPacingSlowdown,
      cooldown: config.cooldownInjection,
    });
  },

  // ─── Check fatigue indicators ───────────────────────────────────────────
  async detectFatigueIndicators(userId: string): Promise<FatigueIndicators> {
    const profile = await retentionProfileService.getProfile(userId);

    if (!profile) {
      return {
        excessiveGrinding: false,
        decliningConsistency: false,
        lowRewardResponsiveness: false,
        frustrationIndicators: false,
        streakAnxietyPatterns: false,
      };
    }

    const indicators: FatigueIndicators = {
      // Excessive grinding: high XP without progression
      excessiveGrinding: profile.engagementQuality < 40 && profile.fatigueScore > 50,

      // Declining consistency: negative momentum
      decliningConsistency: profile.momentumScore < THRESHOLDS.momentum.declining,

      // Low reward responsiveness
      lowRewardResponsiveness: profile.rewardResponsiveness < 30,

      // Frustration: high fatigue with low engagement
      frustrationIndicators: profile.fatigueScore > 60 && profile.engagementQuality < 50,

      // Streak anxiety: high streak with declining momentum
      streakAnxietyPatterns: profile.streakResilience < 40 && profile.momentumScore < 0,
    };

    return indicators;
  },

  // ─── Gradual recovery from suppression ─────────────────────────────────
  async checkRecovery(userId: string): Promise<boolean> {
    const profile = await retentionProfileService.getProfile(userId);

    if (!profile) return true;

    // Recovery conditions
    if (profile.burnoutProbability < THRESHOLDS.burnout.warning &&
        profile.fatigueScore < THRESHOLDS.fatigue.mild &&
        profile.momentumScore > 0) {
      // Clear suppression
      const redis = getRedisClient();
      await redis.del(SUPPRESSION_KEYS.active(userId));
      await redis.del(SUPPRESSION_KEYS.cooldown(userId));

      logger.info('[fatigue] Suppression recovered', { userId });
      return true;
    }

    return false;
  },

  // ─── Apply suppression to challenge generation ───────────────────────────
  applyToChallengeDifficulty(baseDifficulty: number, suppression: SuppressionConfig): number {
    // Reduce difficulty based on suppression level
    const reduction = suppression.challengeIntensityReduction / 100;
    return Math.max(1, Math.floor(baseDifficulty * (1 - reduction)));
  },

  // ─── Apply suppression to XP rewards ─────────────────────────────────────
  applyToXpReward(baseXp: number, suppression: SuppressionConfig): number {
    // Slow down XP pacing
    const slowdown = suppression.xpPacingSlowdown / 100;
    return Math.max(Math.floor(baseXp * 0.7), Math.floor(baseXp * (1 - slowdown)));
  },

  // ─── Apply suppression to streak pressure ────────────────────────────────
  applyToStreakMessage(currentStreak: number, suppression: SuppressionConfig): string {
    if (suppression.streakPressureReduction > 50) {
      return "Don't worry about your streak - just have fun!";
    } else if (suppression.streakPressureReduction > 30) {
      return "Your streak is safe. Focus on quality over quantity.";
    }
    return "Keep your streak going!";
  },

  // ─── Get suppression configs ────────────────────────────────────────────
  getDefaultSuppression(): SuppressionConfig {
    return {
      notificationSuppression: 0,
      challengeIntensityReduction: 0,
      xpPacingSlowdown: 0,
      streakPressureReduction: 0,
      cooldownInjection: 0,
    };
  },

  getMildSuppression(): SuppressionConfig {
    return {
      notificationSuppression: 20,
      challengeIntensityReduction: 10,
      xpPacingSlowdown: 10,
      streakPressureReduction: 15,
      cooldownInjection: 2,
    };
  },

  getModerateSuppression(): SuppressionConfig {
    return {
      notificationSuppression: 40,
      challengeIntensityReduction: 25,
      xpPacingSlowdown: 25,
      streakPressureReduction: 35,
      cooldownInjection: 6,
    };
  },

  getSevereSuppression(): SuppressionConfig {
    return {
      notificationSuppression: 60,
      challengeIntensityReduction: 40,
      xpPacingSlowdown: 40,
      streakPressureReduction: 50,
      cooldownInjection: 12,
    };
  },

  getCriticalSuppression(): SuppressionConfig {
    return {
      notificationSuppression: 80,
      challengeIntensityReduction: 60,
      xpPacingSlowdown: 60,
      streakPressureReduction: 70,
      cooldownInjection: 24,
    };
  },
};

export default fatigueSuppressionService;