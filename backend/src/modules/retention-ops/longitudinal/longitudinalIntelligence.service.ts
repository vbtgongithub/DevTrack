// src/modules/retention-ops/longitudinal/longitudinalIntelligence.service.ts — Adaptive Longitudinal Intelligence
// Phase-E: Build long-term behavioral adaptation systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { UserAnalytics, XpTransaction } from '../../../db/models/index.js';

export interface LongitudinalMetrics {
  userId: string;
  multiWeekMomentum: number;
  burnoutRecoverySuccess: number;
  challengeAdaptationSuccess: number;
  onboardingEvolution: number;
  progressionSustainability: number;
  trustEvolution: number;
  fatigueRecoveryPatterns: number;
}

export interface BehavioralTrajectory {
  userId: string;
  trajectory: 'improving' | 'stable' | 'declining';
  confidence: number;
  predictedRetention: number;
  factors: string[];
  lastUpdated: Date;
}

export interface AdaptationMemory {
  userId: string;
  adaptationHistory: Array<{
    timestamp: Date;
    type: string;
    beforeValue: number;
    afterValue: number;
    triggeredBy: string;
  }>;
  trendAnalysis: Record<string, 'improving' | 'stable' | 'declining'>;
}

const TRAJECTORY_KEY_PREFIX = 'longitudinal:trajectory:';
const ADAPTATION_KEY_PREFIX = 'longitudinal:adaptation:';
const SYSTEM_TREND_KEY = 'longitudinal:system:trends';

export const longitudinalIntelligence = {
  // ─── Calculate user longitudinal metrics ───────────────────────────────
  async calculateUserMetrics(userId: string): Promise<LongitudinalMetrics> {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [recentAnalytics, oldAnalytics, recentXp, oldXp] = await Promise.all([
      UserAnalytics.findOne({ userId }),
      UserAnalytics.findOne({ userId: userId, createdAt: { $lte: monthAgo } }),
      XpTransaction.find({ userId, createdAt: { $gte: weekAgo } }),
      XpTransaction.find({ userId, createdAt: { $gte: monthAgo, $lt: weekAgo } }),
    ]);

    const recentXpTotal = recentXp.reduce((sum: number, t: any) => sum + (t.xpAwarded || 0), 0);
    const oldXpTotal = oldXp.reduce((sum: number, t: any) => sum + (t.xpAwarded || 0), 0);

    const multiWeekMomentum = this.calculateMultiWeekMomentum(recentXpTotal, oldXpTotal);
    const burnoutRecoverySuccess = this.calculateBurnoutRecovery(recentAnalytics);
    const challengeAdaptationSuccess = this.calculateChallengeAdaptation(recentAnalytics);
    const onboardingEvolution = this.calculateOnboardingEvolution(recentAnalytics);
    const progressionSustainability = this.calculateProgressionSustainability(recentAnalytics, recentXp);
    const trustEvolution = this.calculateTrustEvolution(recentAnalytics);
    const fatigueRecoveryPatterns = this.calculateFatigueRecovery(recentAnalytics);

    return {
      userId,
      multiWeekMomentum,
      burnoutRecoverySuccess,
      challengeAdaptationSuccess,
      onboardingEvolution,
      progressionSustainability,
      trustEvolution,
      fatigueRecoveryPatterns,
    };
  },

  // ─── Calculate multi-week momentum ─────────────────────────────────────
  calculateMultiWeekMomentum(recentXp: number, oldXp: number): number {
    if (oldXp === 0) return recentXp > 0 ? 70 : 30;

    const change = ((recentXp - oldXp) / oldXp) * 100;

    if (change > 50) return 85;
    if (change > 20) return 70;
    if (change > -10) return 55;
    if (change > -30) return 40;
    return 25;
  },

  // ─── Calculate burnout recovery success ───────────────────────────────
  calculateBurnoutRecovery(analytics: any): number {
    if (!analytics) return 50;

    const burnoutPeriods = analytics.burnoutPeriods || 0;
    const recoveries = analytics.successfulRecoveries || 0;
    const currentFatigue = analytics.fatigueLevel || 'low';

    let recovery = 50;

    if (burnoutPeriods > 0) {
      const recoveryRate = recoveries / burnoutPeriods;
      recovery = 30 + recoveryRate * 50;
    }

    if (currentFatigue === 'low') {
      recovery += 20;
    } else if (currentFatigue === 'high') {
      recovery -= 20;
    }

    return Math.max(0, Math.min(100, recovery));
  },

  // ─── Calculate challenge adaptation success ───────────────────────────
  calculateChallengeAdaptation(analytics: any): number {
    if (!analytics) return 50;

    const challengeWins = analytics.challengeWins || 0;
    const challengeAttempts = analytics.challengeAttempts || 1;
    const difficultyProgression = analytics.difficultyProgression || 0;

    const successRate = challengeAttempts > 0 ? (challengeWins / challengeAttempts) * 100 : 50;

    let adaptation = successRate * 0.6 + (50 + difficultyProgression * 0.5) * 0.4;

    return Math.max(0, Math.min(100, adaptation));
  },

  // ─── Calculate onboarding evolution ───────────────────────────────────
  calculateOnboardingEvolution(analytics: any): number {
    if (!analytics) return 50;

    const daysActive = analytics.daysActive || 0;
    const milestonesCompleted = analytics.milestonesCompleted || 0;

    if (daysActive < 7) {
      return 60;
    }

    let evolution = 40;

    if (daysActive >= 7 && daysActive < 30) {
      evolution += 20;
    } else if (daysActive >= 30) {
      evolution += 30;
    }

    evolution += Math.min(20, milestonesCompleted * 2);

    return Math.max(0, Math.min(100, evolution));
  },

  // ─── Calculate progression sustainability ───────────────────────────────
  calculateProgressionSustainability(analytics: any, xpTransactions: any[]): number {
    if (!analytics || xpTransactions.length === 0) return 50;

    const daysActive = analytics.daysActive || 0;
    const totalXp = xpTransactions.reduce((sum: number, t: any) => sum + (t.xpAwarded || 0), 0);
    const avgDailyXp = totalXp / 7;

    let sustainability = 40;

    if (avgDailyXp > 30 && avgDailyXp < 500) {
      sustainability += 30;
    } else if (avgDailyXp >= 500) {
      sustainability += 15;
    } else if (avgDailyXp < 30) {
      sustainability -= 10;
    }

    if (daysActive > 30 && avgDailyXp > 50) {
      sustainability += 15;
    }

    return Math.max(0, Math.min(100, sustainability));
  },

  // ─── Calculate trust evolution ─────────────────────────────────────────
  calculateTrustEvolution(analytics: any): number {
    if (!analytics) return 70;

    const trustScore = analytics.trustScore || 70;

    if (trustScore >= 80) return 85;
    if (trustScore >= 60) return 70;
    if (trustScore >= 40) return 55;
    return 35;
  },

  // ─── Calculate fatigue recovery patterns ───────────────────────────────
  calculateFatigueRecovery(analytics: any): number {
    if (!analytics) return 50;

    const fatigueHistory = analytics.fatigueHistory || [];
    const recoverySpeed = analytics.fatigueRecoverySpeed || 50;

    if (fatigueHistory.length === 0) return 60;

    const recentFatigue = fatigueHistory.slice(-7);
    const hasFullRecovery = recentFatigue.filter((f: any) => f.level === 'low').length >= 5;

    let patterns = recoverySpeed;

    if (hasFullRecovery) {
      patterns += 20;
    }

    return Math.max(0, Math.min(100, patterns));
  },

  // ─── Get behavioral trajectory ─────────────────────────────────────────
  async getBehavioralTrajectory(userId: string): Promise<BehavioralTrajectory> {
    const redis = getRedisClient();
    const key = TRAJECTORY_KEY_PREFIX + userId;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const metrics = await this.calculateUserMetrics(userId);
    const trajectory = this.computeTrajectory(metrics);

    await redis.set(key, JSON.stringify(trajectory), 'EX', 3600);

    return trajectory;
  },

  // ─── Compute trajectory from metrics ───────────────────────────────────
  computeTrajectory(metrics: LongitudinalMetrics): BehavioralTrajectory {
    const positive = [metrics.multiWeekMomentum, metrics.burnoutRecoverySuccess, metrics.progressionSustainability];
    const negative = [metrics.challengeAdaptationSuccess, metrics.onboardingEvolution, metrics.fatigueRecoveryPatterns];

    const avgPositive = positive.reduce((a, b) => a + b, 0) / positive.length;
    const avgNegative = negative.reduce((a, b) => a + b, 0) / negative.length;

    let trajectory: 'improving' | 'stable' | 'declining';
    let confidence = 70;
    const factors: string[] = [];

    if (avgPositive > 60 && avgNegative > 50) {
      trajectory = 'improving';
      factors.push('Strong momentum and progression');
    } else if (avgPositive < 40 || avgNegative < 35) {
      trajectory = 'declining';
      factors.push('Declining engagement and progression');
      confidence = 80;
    } else {
      trajectory = 'stable';
      factors.push('Consistent engagement pattern');
    }

    const predictedRetention = Math.round((avgPositive + avgNegative) / 2);

    return {
      userId: metrics.userId,
      trajectory,
      confidence,
      predictedRetention,
      factors,
      lastUpdated: new Date(),
    };
  },

  // ─── Get adaptation memory ────────────────────────────────────────────
  async getAdaptationMemory(userId: string): Promise<AdaptationMemory> {
    const redis = getRedisClient();
    const key = ADAPTATION_KEY_PREFIX + userId;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const memory: AdaptationMemory = {
      userId,
      adaptationHistory: [],
      trendAnalysis: {
        momentum: 'stable',
        fatigue: 'stable',
        progression: 'stable',
      },
    };

    await redis.set(key, JSON.stringify(memory), 'EX', 86400 * 30);

    return memory;
  },

  // ─── Record adaptation event ─────────────────────────────────────────
  async recordAdaptation(userId: string, type: string, beforeValue: number, afterValue: number, triggeredBy: string): Promise<void> {
    const redis = getRedisClient();
    const key = ADAPTATION_KEY_PREFIX + userId;

    let memory = await this.getAdaptationMemory(userId);

    memory.adaptationHistory.push({
      timestamp: new Date(),
      type,
      beforeValue,
      afterValue,
      triggeredBy,
    });

    if (memory.adaptationHistory.length > 100) {
      memory.adaptationHistory = memory.adaptationHistory.slice(-50);
    }

    await redis.set(key, JSON.stringify(memory), 'EX', 86400 * 30);

    logger.info('[longitudinal] Adaptation recorded', { userId, type, beforeValue, afterValue });
  },

  // ─── Get system trends ─────────────────────────────────────────────────
  async getSystemTrends(): Promise<Record<string, 'improving' | 'stable' | 'declining'>> {
    const redis = getRedisClient();
    const cached = await redis.get(SYSTEM_TREND_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await UserAnalytics.find({}).limit(100);
    const trends: Record<string, number[]> = {
      momentum: [],
      fatigue: [],
      retention: [],
    };

    for (const user of analytics) {
      const metrics = await this.calculateUserMetrics(user.userId.toString());
      trends.momentum.push(metrics.multiWeekMomentum);
      trends.fatigue.push(metrics.fatigueRecoveryPatterns);
      trends.retention.push(metrics.progressionSustainability);
    }

    const result: Record<string, 'improving' | 'stable' | 'declining'> = {};
    for (const [key, values] of Object.entries(trends)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > 60) result[key] = 'improving';
      else if (avg < 40) result[key] = 'declining';
      else result[key] = 'stable';
    }

    await redis.set(SYSTEM_TREND_KEY, JSON.stringify(result), 'EX', 3600);

    return result;
  },

  // ─── Predict long-term retention ──────────────────────────────────────
  async predictLongTermRetention(userId: string, weeks: number = 4): Promise<{
    predictedRetention: number;
    confidence: number;
    factors: string[];
  }> {
    const trajectory = await this.getBehavioralTrajectory(userId);
    const metrics = await this.calculateUserMetrics(userId);

    let predictedRetention = trajectory.predictedRetention;
    const confidence = trajectory.confidence;
    const factors = [...trajectory.factors];

    for (let i = 0; i < weeks; i++) {
      if (trajectory.trajectory === 'improving') {
        predictedRetention = Math.min(95, predictedRetention + 2);
      } else if (trajectory.trajectory === 'declining') {
        predictedRetention = Math.max(20, predictedRetention - 5);
      }
    }

    if (metrics.burnoutRecoverySuccess < 40) {
      factors.push('Low burnout recovery may impact long-term retention');
      predictedRetention -= 10;
    }

    if (metrics.fatigueRecoveryPatterns < 45) {
      factors.push('Poor fatigue recovery patterns');
      predictedRetention -= 5;
    }

    return {
      predictedRetention: Math.max(0, Math.min(100, predictedRetention)),
      confidence,
      factors,
    };
  },
};

export default longitudinalIntelligence;