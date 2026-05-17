// src/modules/retention-ops/cohort/cohortIntelligence.service.ts — Retention Cohort Intelligence
// Phase-E: Cohort-level behavioral analysis

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { User, UserAnalytics, UserXp } from '../../../db/models/index.js';

export type CohortDimension = 'onboarding_week' | 'trust_score' | 'progression_speed' | 'consistency_pattern' | 'comeback_behavior' | 'fatigue_pattern' | 'engagement_quality';

export interface CohortSegment {
  id: string;
  name: string;
  dimension: CohortDimension;
  range: { min: number; max: number };
  totalUsers: number;
  activeUsers: number;
  avgRetention: number;
  avgEngagement: number;
  avgStreak: number;
  healthScore: number;
}

export interface CohortTrend {
  segmentId: string;
  period: string;
  retentionChange: number;
  engagementChange: number;
  streakChange: number;
}

export interface CohortEvolution {
  cohortDate: string;
  dimension: CohortDimension;
  segments: CohortSegment[];
  trends: CohortTrend[];
  overallHealth: number;
}

const COHORT_KEY_PREFIX = 'cohort:segments:';
const EVOLUTION_KEY_PREFIX = 'cohort:evolution:';

export const cohortIntelligence = {
  // ─── Get cohorts by dimension ───────────────────────────────────────────
  async getCohortsByDimension(dimension: CohortDimension): Promise<CohortSegment[]> {
    const redis = getRedisClient();
    const key = COHORT_KEY_PREFIX + dimension;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const segments = await this.computeCohortSegments(dimension);
    await redis.set(key, JSON.stringify(segments), 'EX', 3600);

    return segments;
  },

  // ─── Compute cohort segments for dimension ───────────────────────────
  async computeCohortSegments(dimension: CohortDimension): Promise<CohortSegment[]> {
    const users = await User.find({}).limit(1000);
    const segments: Record<string, any[]> = {
      low: [],
      medium: [],
      high: [],
      power: [],
    };

    for (const user of users) {
      const value = await this.getUserDimensionValue(user._id.toString(), dimension);

      if (value < 25) {
        segments.low.push(user);
      } else if (value < 50) {
        segments.medium.push(user);
      } else if (value < 75) {
        segments.high.push(user);
      } else {
        segments.power.push(user);
      }
    }

    const result: CohortSegment[] = [];

    for (const [name, users] of Object.entries(segments)) {
      const analytics = await UserAnalytics.find({
        userId: { $in: users.map(u => u._id) },
      });

      const activeCount = analytics.filter((a: any) => {
        const lastActive = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        return Date.now() - lastActive < 7 * 24 * 60 * 60 * 1000;
      }).length;

      const avgStreak = analytics.length > 0
        ? analytics.reduce((sum: number, a: any) => sum + (a.currentStreak || 0), 0) / analytics.length
        : 0;

      result.push({
        id: `segment_${dimension}_${name}`,
        name: `${name} ${dimension.replace('_', ' ')}`,
        dimension,
        range: this.getDimensionRange(name),
        totalUsers: users.length,
        activeUsers: activeCount,
        avgRetention: users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0,
        avgEngagement: 50,
        avgStreak: Math.round(avgStreak),
        healthScore: this.calculateSegmentHealth(users.length, activeCount, avgStreak),
      });
    }

    return result;
  },

  // ─── Get user dimension value ─────────────────────────────────────────
  async getUserDimensionValue(userId: string, dimension: CohortDimension): Promise<number> {
    const analytics = await UserAnalytics.findOne({ userId }) as any;
    switch (dimension) {
      case 'onboarding_week':
        const user = await User.findById(userId) as any;
        if (!user?.createdAt) return 50;
        const daysSinceOnboarding = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        return Math.min(100, daysSinceOnboarding * 3);

      case 'trust_score':
        return analytics?.trustScore || 70;

      case 'progression_speed':
        const xp = await UserXp.findOne({ userId });
        return Math.min(100, (xp?.currentLevel || 1) * 2);

      case 'consistency_pattern':
        return analytics?.daysActive ? Math.min(100, analytics.daysActive * 2) : 30;

      case 'comeback_behavior':
        return analytics?.comebackCount ? Math.min(100, analytics.comebackCount * 10) : 20;

      case 'fatigue_pattern':
        return analytics?.fatigueLevel === 'high' ? 80 : analytics?.fatigueLevel === 'medium' ? 50 : 20;

      case 'engagement_quality':
        return 50;

      default:
        return 50;
    }
  },

  // ─── Get dimension range ───────────────────────────────────────────────
  getDimensionRange(name: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      low: { min: 0, max: 24 },
      medium: { min: 25, max: 49 },
      high: { min: 50, max: 74 },
      power: { min: 75, max: 100 },
    };
    return ranges[name] || { min: 0, max: 100 };
  },

  // ─── Calculate segment health ───────────────────────────────────────
  calculateSegmentHealth(total: number, active: number, avgStreak: number): number {
    if (total === 0) return 0;

    const retentionScore = (active / total) * 50;
    const streakScore = Math.min(50, avgStreak * 2);

    return Math.round(retentionScore + streakScore);
  },

  // ─── Get cohort evolution ────────────────────────────────────────────
  async getCohortEvolution(dimension: CohortDimension, days: number = 7): Promise<CohortEvolution[]> {
    const redis = getRedisClient();
    const evolutions: CohortEvolution[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const key = EVOLUTION_KEY_PREFIX + dimension + ':' + dateStr;

      const cached = await redis.get(key);
      if (cached) {
        evolutions.push(JSON.parse(cached));
      } else {
        const evolution = await this.computeCohortEvolution(dimension, dateStr);
        await redis.set(key, JSON.stringify(evolution), 'EX', 86400);
        evolutions.push(evolution);
      }
    }

    return evolutions;
  },

  // ─── Compute cohort evolution ─────────────────────────────────────────
  async computeCohortEvolution(dimension: CohortDimension, dateStr: string): Promise<CohortEvolution> {
    const segments = await this.computeCohortSegments(dimension);

    const trends: CohortTrend[] = segments.map(segment => ({
      segmentId: segment.id,
      period: dateStr,
      retentionChange: Math.floor(Math.random() * 10) - 5,
      engagementChange: Math.floor(Math.random() * 15) - 5,
      streakChange: Math.floor(Math.random() * 3) - 1,
    }));

    const overallHealth = segments.length > 0
      ? Math.round(segments.reduce((sum, s) => sum + s.healthScore, 0) / segments.length)
      : 50;

    return {
      cohortDate: dateStr,
      dimension,
      segments,
      trends,
      overallHealth,
    };
  },

  // ─── Get retention segmentation ───────────────────────────────────────
  async getRetentionSegmentation(): Promise<Record<string, number>> {
    const users = await User.find({}).limit(1000);
    const segments = {
      retained: 0,
      atRisk: 0,
      lapsed: 0,
      returning: 0,
    };

    for (const user of users) {
      const analytics = await UserAnalytics.findOne({ userId: user._id }) as any;
      if (!analytics) {
        segments.lapsed++;
        continue;
      }

      const lastActiveDate = analytics.lastActiveDate || analytics.lastActiveAt;
      const lastActive = lastActiveDate ? new Date(lastActiveDate).getTime() : 0;
      const daysSinceActive = Math.floor((Date.now() - lastActive) / (24 * 60 * 60 * 1000));

      if (daysSinceActive <= 1) {
        segments.retained++;
      } else if (daysSinceActive <= 7) {
        segments.atRisk++;
      } else if (daysSinceActive <= 30) {
        segments.lapsed++;
      } else {
        segments.returning++;
      }
    }

    return segments;
  },

  // ─── Analyze cohort behavior ─────────────────────────────────────────
  async analyzeCohortBehavior(dimension: CohortDimension, segmentName: string): Promise<{
    characteristics: string[];
    recommendedActions: string[];
    predictedOutcome: string;
  }> {
    const segments = await this.getCohortsByDimension(dimension);
    const segment = segments.find(s => s.name.toLowerCase().includes(segmentName.toLowerCase()));

    if (!segment) {
      return {
        characteristics: ['Unknown segment'],
        recommendedActions: [],
        predictedOutcome: 'Unknown',
      };
    }

    const characteristics: string[] = [];
    const recommendedActions: string[] = [];
    let predictedOutcome = 'Stable';

    if (segment.healthScore > 70) {
      characteristics.push('High engagement');
      predictedOutcome = 'Improving';
    } else if (segment.healthScore < 40) {
      characteristics.push('Low engagement');
      recommendedActions.push('Increase retention efforts');
      predictedOutcome = 'Declining';
    }

    if (segment.avgStreak > 14) {
      characteristics.push('Strong streak culture');
    }

    if (segment.activeUsers / segment.totalUsers < 0.5) {
      characteristics.push('High churn risk');
      recommendedActions.push('Activate comeback campaigns');
    }

    return { characteristics, recommendedActions, predictedOutcome };
  },

  // ─── Balance cohorts ───────────────────────────────────────────────────
  async balanceCohorts(dimension: CohortDimension): Promise<{
    balanced: boolean;
    actions: string[];
    expectedImprovement: number;
  }> {
    const segments = await this.getCohortsByDimension(dimension);
    const totalUsers = segments.reduce((sum, s) => sum + s.totalUsers, 0);
    const avgUsers = totalUsers / segments.length;

    const unbalanced = segments.some(s => Math.abs(s.totalUsers - avgUsers) / avgUsers > 0.5);

    if (!unbalanced) {
      return { balanced: true, actions: [], expectedImprovement: 0 };
    }

    const actions: string[] = [];
    let expectedImprovement = 0;

    const smallest = segments.reduce((min, s) => s.totalUsers < min.totalUsers ? s : min, segments[0]);
    const largest = segments.reduce((max, s) => s.totalUsers > max.totalUsers ? s : max, segments[0]);

    if (largest.healthScore < smallest.healthScore) {
      actions.push(`Reallocate resources from ${largest.name} to ${smallest.name}`);
      expectedImprovement = 10;
    }

    return { balanced: false, actions, expectedImprovement };
  },

  // ─── Get cross-dimensional analysis ───────────────────────────────────
  async getCrossDimensionalAnalysis(userId: string): Promise<Record<CohortDimension, number>> {
    const dimensions: CohortDimension[] = [
      'onboarding_week', 'trust_score', 'progression_speed', 'consistency_pattern',
      'comeback_behavior', 'fatigue_pattern', 'engagement_quality'
    ];

    const result: Record<string, number> = {};

    for (const dimension of dimensions) {
      result[dimension] = await this.getUserDimensionValue(userId, dimension);
    }

    return result as Record<CohortDimension, number>;
  },
};

export default cohortIntelligence;