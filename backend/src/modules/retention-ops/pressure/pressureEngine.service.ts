// src/modules/retention-ops/pressure/pressureEngine.service.ts — Engagement Pressure Engine
// Phase-E: Centralized engagement pressure management

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';

export interface PressureScore {
  overall: number;
  streak: number;
  challenge: number;
  notification: number;
  leaderboard: number;
  reward: number;
  onboarding: number;
  comeback: number;
}

export interface PressureConfig {
  maxPressure: number;
  warningThreshold: number;
  criticalThreshold: number;
  decayRate: number;
  recoveryRate: number;
}

export interface UserPressureState {
  userId: string;
  currentPressure: number;
  lastUpdated: Date;
  pressureHistory: Array<{ timestamp: Date; pressure: number }>;
}

const DEFAULT_CONFIG: PressureConfig = {
  maxPressure: 100,
  warningThreshold: 70,
  criticalThreshold: 85,
  decayRate: 0.05,
  recoveryRate: 0.1,
};

const PRESSURE_KEY_PREFIX = 'pressure:user:';
const SYSTEM_PRESSURE_KEY = 'pressure:system';
const CONFIG_KEY = 'pressure:config';

export const pressureEngine = {
  // ─── Get pressure configuration ───────────────────────────────────────
  async getConfig(): Promise<PressureConfig> {
    const redis = getRedisClient();
    const cached = await redis.get(CONFIG_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return DEFAULT_CONFIG;
  },

  // ─── Update pressure configuration ─────────────────────────────────────
  async updateConfig(config: Partial<PressureConfig>): Promise<void> {
    const redis = getRedisClient();
    const current = await this.getConfig();
    const updated = { ...current, ...config };

    await redis.set(CONFIG_KEY, JSON.stringify(updated), 'EX', 86400 * 30);

    logger.info('[pressure] Config updated', { config: updated });
  },

  // ─── Calculate user pressure score ────────────────────────────────────
  async calculateUserPressure(userId: string): Promise<PressureScore> {
    const [analytics, xp] = await Promise.all([
      UserAnalytics.findOne({ userId }) as any,
      UserXp.findOne({ userId }),
    ]);

    const streakPressure = this.calculateStreakPressure(analytics?.currentStreak || 0);
    const challengePressure = this.calculateChallengePressure(analytics?.activeChallenges?.length || 0);
    const rewardPressure = this.calculateRewardPressure(xp?.totalXp || 0);
    const onboardingPressure = this.calculateOnboardingPressure(analytics?.daysActive || 0);
    const comebackPressure = this.calculateComebackPressure(analytics?.streakRecoverable || false);
    const notificationPressure = this.calculateNotificationPressure();
    const leaderboardPressure = this.calculateLeaderboardPressure();

    const overall = Math.round(
      streakPressure * 0.25 +
      challengePressure * 0.2 +
      rewardPressure * 0.15 +
      notificationPressure * 0.15 +
      leaderboardPressure * 0.1 +
      onboardingPressure * 0.05 +
      comebackPressure * 0.1
    );

    return {
      overall,
      streak: streakPressure,
      challenge: challengePressure,
      notification: notificationPressure,
      leaderboard: leaderboardPressure,
      reward: rewardPressure,
      onboarding: onboardingPressure,
      comeback: comebackPressure,
    };
  },

  // ─── Calculate streak pressure ────────────────────────────────────────
  calculateStreakPressure(streak: number): number {
    if (streak === 0) return 20;
    if (streak < 3) return 30;
    if (streak < 7) return 45;
    if (streak < 14) return 60;
    if (streak < 30) return 75;
    return 85;
  },

  // ─── Calculate challenge pressure ─────────────────────────────────────
  calculateChallengePressure(activeChallenges: number): number {
    if (activeChallenges === 0) return 10;
    if (activeChallenges <= 2) return 30;
    if (activeChallenges <= 4) return 50;
    if (activeChallenges <= 6) return 70;
    return 85;
  },

  // ─── Calculate notification pressure ───────────────────────────────────
  calculateNotificationPressure(): number {
    return 40;
  },

  // ─── Calculate leaderboard pressure ───────────────────────────────────
  calculateLeaderboardPressure(): number {
    return 35;
  },

  // ─── Calculate reward pressure ────────────────────────────────────────
  calculateRewardPressure(totalXp: number): number {
    if (totalXp < 100) return 20;
    if (totalXp < 500) return 35;
    if (totalXp < 2000) return 50;
    if (totalXp < 10000) return 65;
    return 75;
  },

  // ─── Calculate onboarding pressure ─────────────────────────────────────
  calculateOnboardingPressure(daysActive: number): number {
    if (daysActive < 1) return 80;
    if (daysActive < 3) return 60;
    if (daysActive < 7) return 40;
    return 20;
  },

  // ─── Calculate comeback pressure ───────────────────────────────────────
  calculateComebackPressure(recoverable: boolean): number {
    return recoverable ? 70 : 20;
  },

  // ─── Update user pressure state ───────────────────────────────────────
  async updateUserPressure(userId: string, pressureDelta: number): Promise<void> {
    const redis = getRedisClient();
    const key = PRESSURE_KEY_PREFIX + userId;

    let state = await this.getUserPressureState(userId);
    const config = await this.getConfig();

    const newPressure = Math.max(0, Math.min(config.maxPressure, state.currentPressure + pressureDelta));

    state.currentPressure = newPressure;
    state.lastUpdated = new Date();
    state.pressureHistory.push({ timestamp: new Date(), pressure: newPressure });

    if (state.pressureHistory.length > 100) {
      state.pressureHistory = state.pressureHistory.slice(-100);
    }

    await redis.set(key, JSON.stringify(state), 'EX', 86400 * 30);
  },

  // ─── Get user pressure state ──────────────────────────────────────────
  async getUserPressureState(userId: string): Promise<UserPressureState> {
    const redis = getRedisClient();
    const key = PRESSURE_KEY_PREFIX + userId;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return {
      userId,
      currentPressure: 0,
      lastUpdated: new Date(),
      pressureHistory: [],
    };
  },

  // ─── Get system-wide pressure ─────────────────────────────────────────
  async getSystemPressure(): Promise<{ avgPressure: number; highPressureUsers: number; pressureDistribution: Record<string, number> }> {
    const redis = getRedisClient();
    const cached = await redis.get(SYSTEM_PRESSURE_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await UserAnalytics.find({}).limit(1000);
    let totalPressure = 0;
    let highPressureCount = 0;
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const user of analytics) {
      const pressure = await this.calculateUserPressure(user.userId.toString());
      totalPressure += pressure.overall;

      if (pressure.overall >= 85) {
        highPressureCount++;
        distribution.critical++;
      } else if (pressure.overall >= 70) {
        distribution.high++;
      } else if (pressure.overall >= 40) {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    }

    const result = {
      avgPressure: analytics.length > 0 ? Math.round(totalPressure / analytics.length) : 0,
      highPressureUsers: highPressureCount,
      pressureDistribution: distribution,
    };

    await redis.set(SYSTEM_PRESSURE_KEY, JSON.stringify(result), 'EX', 300);

    return result;
  },

  // ─── Apply pressure reduction ─────────────────────────────────────────
  async applyPressureReduction(userId: string, reductionAmount: number): Promise<number> {
    const redis = getRedisClient();
    const key = PRESSURE_KEY_PREFIX + userId;

    let state = await this.getUserPressureState(userId);
    state.currentPressure = Math.max(0, state.currentPressure - reductionAmount);
    state.lastUpdated = new Date();

    await redis.set(key, JSON.stringify(state), 'EX', 86400 * 30);

    return state.currentPressure;
  },

  // ─── Get pressure recommendations ────────────────────────────────────
  async getPressureRecommendations(): Promise<Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>> {
    const recommendations: Array<{ action: string; priority: 'low' | 'medium' | 'high'; description: string }> = [];
    const systemPressure = await this.getSystemPressure();
    const config = await this.getConfig();

    if (systemPressure.avgPressure > config.warningThreshold) {
      recommendations.push({
        action: 'reduce_notification_frequency',
        priority: 'high',
        description: 'System-wide pressure is high, reduce notification frequency',
      });
    }

    if (systemPressure.pressureDistribution.critical > 10) {
      recommendations.push({
        action: 'activate_fatigue_suppression',
        priority: 'high',
        description: 'Many users at critical pressure, activate fatigue suppression',
      });
    }

    if (systemPressure.avgPressure > config.criticalThreshold) {
      recommendations.push({
        action: 'pause_challenges',
        priority: 'medium',
        description: 'Critical pressure level, consider pausing new challenges',
      });
    }

    if (systemPressure.pressureDistribution.high > 50) {
      recommendations.push({
        action: 'increase_rewards',
        priority: 'medium',
        description: 'Many users experiencing high pressure, increase reward frequency',
      });
    }

    return recommendations;
  },

  // ─── Check if user needs pressure relief ──────────────────────────────
  async checkPressureRelief(userId: string): Promise<{
    needsRelief: boolean;
    reliefActions: string[];
  }> {
    const state = await this.getUserPressureState(userId);
    const config = await this.getConfig();
    const reliefActions: string[] = [];

    if (state.currentPressure >= config.criticalThreshold) {
      reliefActions.push('reduce_notifications');
      reliefActions.push('pause_challenges');
      reliefActions.push('offer_recovery_bonus');
    } else if (state.currentPressure >= config.warningThreshold) {
      reliefActions.push('reduce_notifications');
      reliefActions.push('adjust_goal_difficulty');
    }

    return {
      needsRelief: reliefActions.length > 0,
      reliefActions,
    };
  },
};

export default pressureEngine;