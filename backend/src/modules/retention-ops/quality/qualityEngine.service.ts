// src/modules/retention-ops/quality/qualityEngine.service.ts — Healthy Engagement Quality Engine
// Phase-E: Optimize sustainable engagement instead of raw activity

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { UserAnalytics, UserXp, XpTransaction } from '../../../db/models/index.js';

export interface QualityMetrics {
  userId: string;
  sustainableMomentum: number;
  healthyConsistency: number;
  fatigueAdjustedRetention: number;
  recoveryQuality: number;
  meaningfulProgression: number;
  engagementSustainability: number;
  healthyComebackSuccess: number;
  overallQualityScore: number;
}

export interface QualityThresholds {
  minMomentum: number;
  minConsistency: number;
  maxFatigue: number;
  minRecoveryQuality: number;
  minProgressionQuality: number;
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  minMomentum: 40,
  minConsistency: 35,
  maxFatigue: 30,
  minRecoveryQuality: 45,
  minProgressionQuality: 40,
};

const QUALITY_KEY_PREFIX = 'quality:user:';
const SYSTEM_QUALITY_KEY = 'quality:system:latest';

export const qualityEngine = {
  // ─── Calculate user quality metrics ───────────────────────────────────
  async calculateUserQuality(userId: string): Promise<QualityMetrics> {
    const [analytics, xp, recentTransactions] = await Promise.all([
      UserAnalytics.findOne({ userId }),
      UserXp.findOne({ userId }),
      XpTransaction.find({ userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    const sustainableMomentum = this.calculateSustainableMomentum(analytics, recentTransactions);
    const healthyConsistency = this.calculateHealthyConsistency(analytics);
    const fatigueAdjustedRetention = this.calculateFatigueAdjustedRetention(analytics);
    const recoveryQuality = this.calculateRecoveryQuality(analytics);
    const meaningfulProgression = this.calculateMeaningfulProgression(xp, recentTransactions);
    const engagementSustainability = this.calculateEngagementSustainability(analytics, recentTransactions);
    const healthyComebackSuccess = this.calculateHealthyComebackSuccess(analytics);

    const overallQualityScore = Math.round(
      sustainableMomentum * 0.2 +
      healthyConsistency * 0.15 +
      fatigueAdjustedRetention * 0.2 +
      recoveryQuality * 0.1 +
      meaningfulProgression * 0.15 +
      engagementSustainability * 0.1 +
      healthyComebackSuccess * 0.1
    );

    const metrics: QualityMetrics = {
      userId,
      sustainableMomentum,
      healthyConsistency,
      fatigueAdjustedRetention,
      recoveryQuality,
      meaningfulProgression,
      engagementSustainability,
      healthyComebackSuccess,
      overallQualityScore,
    };

    await this.storeUserQuality(userId, metrics);

    return metrics;
  },

  // ─── Calculate sustainable momentum ──────────────────────────────────
  calculateSustainableMomentum(analytics: any, transactions: any[]): number {
    if (!analytics || transactions.length === 0) return 50;

    const streak = analytics.currentStreak || 0;
    const daysActive = analytics.daysActive || 0;
    const lastActiveDaysAgo = analytics.lastActiveAt
      ? Math.floor((Date.now() - new Date(analytics.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
      : 30;

    let momentum = 30;

    if (streak >= 3 && streak < 30) {
      momentum += 25;
    } else if (streak >= 30) {
      momentum += 35;
    }

    if (daysActive > 7 && daysActive < 60) {
      momentum += 15;
    } else if (daysActive >= 60) {
      momentum += 20;
    }

    if (lastActiveDaysAgo <= 1) {
      momentum += 15;
    } else if (lastActiveDaysAgo <= 3) {
      momentum += 5;
    } else if (lastActiveDaysAgo > 7) {
      momentum -= 20;
    }

    return Math.max(0, Math.min(100, momentum));
  },

  // ─── Calculate healthy consistency ───────────────────────────────────
  calculateHealthyConsistency(analytics: any): number {
    if (!analytics) return 50;

    const streak = analytics.currentStreak || 0;
    const longestStreak = analytics.longestStreak || 1;
    const daysActive = analytics.daysActive || 0;

    if (streak === 0) return 20;

    const consistencyRatio = streak / Math.max(longestStreak, 1);
    const consistency = Math.min(100, consistencyRatio * 100);

    const baseConsistency = 30;
    const streakBonus = Math.min(40, Math.log2(streak + 1) * 10);
    const activityBonus = Math.min(20, Math.floor(daysActive / 10) * 2);

    return Math.max(0, Math.min(100, baseConsistency + streakBonus + activityBonus));
  },

  // ─── Calculate fatigue-adjusted retention ─────────────────────────────
  calculateFatigueAdjustedRetention(analytics: any): number {
    if (!analytics) return 50;

    const daysActive = analytics.daysActive || 0;
    const currentStreak = analytics.currentStreak || 0;
    const fatigueLevel = analytics.fatigueLevel || 'low';

    let baseRetention = 50;

    if (daysActive < 7) {
      baseRetention += 10;
    } else if (daysActive > 30 && daysActive < 90) {
      baseRetention += 15;
    } else if (daysActive >= 90) {
      baseRetention += 20;
    }

    if (fatigueLevel === 'high') {
      baseRetention -= 25;
    } else if (fatigueLevel === 'medium') {
      baseRetention -= 10;
    }

    if (currentStreak > 0 && currentStreak < 7) {
      baseRetention += 10;
    }

    return Math.max(0, Math.min(100, baseRetention));
  },

  // ─── Calculate recovery quality ───────────────────────────────────────
  calculateRecoveryQuality(analytics: any): number {
    if (!analytics) return 50;

    const hasRecoveredStreak = analytics.streakRecovered || false;
    const comebackAttempts = analytics.comebackAttempts || 0;
    const successfulComebacks = analytics.successfulComebacks || 0;

    let quality = 30;

    if (hasRecoveredStreak) {
      quality += 30;
    }

    if (comebackAttempts > 0) {
      const successRate = successfulComebacks / comebackAttempts;
      quality += successRate * 30;
    }

    if (analytics.currentStreak > analytics.previousBestStreak) {
      quality += 10;
    }

    return Math.max(0, Math.min(100, quality));
  },

  // ─── Calculate meaningful progression ─────────────────────────────────
  calculateMeaningfulProgression(xp: any, transactions: any[]): number {
    if (!xp || transactions.length === 0) return 50;

    const totalXp = xp.totalXp || 0;
    const level = xp.currentLevel || 1;
    const recentXp = transactions.reduce((sum, t) => sum + (t.xpAwarded || 0), 0);

    let progression = 30;

    const xpPerDay = recentXp / 7;
    if (xpPerDay > 50 && xpPerDay < 500) {
      progression += 25;
    } else if (xpPerDay >= 500 && xpPerDay < 2000) {
      progression += 15;
    } else if (xpPerDay >= 2000) {
      progression -= 10;
    }

    if (level > 1 && level < 50) {
      progression += 20;
    }

    const activityQuality = transactions.filter(t =>
      (t.sourceType === 'dsa' || t.sourceType === 'problem') && t.xpAwarded > 10
    ).length / Math.max(transactions.length, 1);

    progression += activityQuality * 25;

    return Math.max(0, Math.min(100, progression));
  },

  // ─── Calculate engagement sustainability ──────────────────────────────
  calculateEngagementSustainability(analytics: any, transactions: any[]): number {
    if (!analytics || transactions.length === 0) return 50;

    const sessionCount = transactions.length;
    const daysWithActivity = new Set(transactions.map(t =>
      new Date(t.createdAt).toISOString().split('T')[0]
    )).size;

    let sustainability = 40;

    const activityFrequency = daysWithActivity / 7;
    if (activityFrequency >= 0.5 && activityFrequency <= 0.9) {
      sustainability += 25;
    } else if (activityFrequency > 0.9) {
      sustainability -= 15;
    }

    if (analytics.currentStreak > 0 && analytics.currentStreak < 14) {
      sustainability += 20;
    }

    if (sessionCount > 50 && analytics.daysActive < 14) {
      sustainability -= 20;
    }

    return Math.max(0, Math.min(100, sustainability));
  },

  // ─── Calculate healthy comeback success ───────────────────────────────
  calculateHealthyComebackSuccess(analytics: any): number {
    if (!analytics) return 50;

    const streakRecoverable = analytics.streakRecoverable || false;
    const currentStreak = analytics.currentStreak || 0;

    if (!streakRecoverable && currentStreak === 0) {
      return 60;
    }

    let success = 40;

    if (streakRecoverable) {
      success += 30;
    }

    if (currentStreak > 0) {
      success += 20;
    }

    return Math.max(0, Math.min(100, success));
  },

  // ─── Store user quality metrics ───────────────────────────────────────
  async storeUserQuality(userId: string, metrics: QualityMetrics): Promise<void> {
    const redis = getRedisClient();
    const key = QUALITY_KEY_PREFIX + userId;
    await redis.set(key, JSON.stringify(metrics), 'EX', 3600);
  },

  // ─── Get system-wide quality metrics ──────────────────────────────────
  async getSystemQuality(): Promise<{
    avgQuality: number;
    qualityDistribution: Record<string, number>;
    usersNeedingAttention: string[];
  }> {
    const redis = getRedisClient();
    const cached = await redis.get(SYSTEM_QUALITY_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    const analytics = await UserAnalytics.find({}).limit(1000);
    let totalQuality = 0;
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    const usersNeedingAttention: string[] = [];

    for (const user of analytics) {
      const quality = await this.calculateUserQuality(user.userId.toString());
      totalQuality += quality.overallQualityScore;

      if (quality.overallQualityScore >= 80) {
        distribution.excellent++;
      } else if (quality.overallQualityScore >= 60) {
        distribution.good++;
      } else if (quality.overallQualityScore >= 40) {
        distribution.fair++;
      } else {
        distribution.poor++;
        if (quality.overallQualityScore < 30) {
          usersNeedingAttention.push(user.userId.toString());
        }
      }
    }

    const result = {
      avgQuality: analytics.length > 0 ? Math.round(totalQuality / analytics.length) : 50,
      qualityDistribution: distribution,
      usersNeedingAttention: usersNeedingAttention.slice(0, 20),
    };

    await redis.set(SYSTEM_QUALITY_KEY, JSON.stringify(result), 'EX', 300);

    return result;
  },

  // ─── Get quality thresholds ───────────────────────────────────────────
  async getThresholds(): Promise<QualityThresholds> {
    return DEFAULT_THRESHOLDS;
  },

  // ─── Identify quality issues ─────────────────────────────────────────
  async identifyQualityIssues(userId: string): Promise<string[]> {
    const metrics = await this.calculateUserQuality(userId);
    const issues: string[] = [];

    if (metrics.sustainableMomentum < DEFAULT_THRESHOLDS.minMomentum) {
      issues.push('Low sustainable momentum');
    }

    if (metrics.healthyConsistency < DEFAULT_THRESHOLDS.minConsistency) {
      issues.push('Inconsistent engagement pattern');
    }

    if (metrics.fatigueAdjustedRetention < 100 - DEFAULT_THRESHOLDS.maxFatigue) {
      issues.push('High fatigue affecting retention');
    }

    if (metrics.recoveryQuality < DEFAULT_THRESHOLDS.minRecoveryQuality) {
      issues.push('Poor recovery from breaks');
    }

    if (metrics.meaningfulProgression < DEFAULT_THRESHOLDS.minProgressionQuality) {
      issues.push('Low quality progression');
    }

    if (metrics.engagementSustainability < 40) {
      issues.push('Unsustainable engagement pattern');
    }

    return issues;
  },

  // ─── Get quality recommendations ─────────────────────────────────────
  async getQualityRecommendations(userId: string): Promise<Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>> {
    const metrics = await this.calculateUserQuality(userId);
    const recommendations: Array<{
      action: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    if (metrics.sustainableMomentum < 40) {
      recommendations.push({
        action: 'increase_momentum',
        priority: 'high',
        description: 'Implement momentum-boosting activities',
      });
    }

    if (metrics.healthyConsistency < 35) {
      recommendations.push({
        action: 'improve_consistency',
        priority: 'high',
        description: 'Create consistent engagement triggers',
      });
    }

    if (metrics.fatigueAdjustedRetention < 60) {
      recommendations.push({
        action: 'reduce_fatigue',
        priority: 'high',
        description: 'Activate fatigue suppression',
      });
    }

    if (metrics.recoveryQuality < 45) {
      recommendations.push({
        action: 'improve_recovery',
        priority: 'medium',
        description: 'Enhance comeback support systems',
      });
    }

    return recommendations;
  },
};

export default qualityEngine;