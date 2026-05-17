// src/modules/retention-ops/commandCenter/retentionCommandCenter.service.ts — Retention Command Center
// Phase-E: Live Behavioral Intelligence Operations

import { Types } from 'mongoose';
import { UserAnalytics, UserXp, User, XpTransaction } from '../../../db/models/index.js';
import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export interface RetentionMetrics {
  timestamp: Date;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  churnedUsers: number;
  averageStreak: number;
  maxStreak: number;
  goalCompletionRate: number;
  challengeCompletionRate: number;
  averageSessionDuration: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  xpDistribution: {
    low: number;
    medium: number;
    high: number;
    power: number;
  };
  fatigueIndicators: {
    high: number;
    medium: number;
    low: number;
  };
  trustDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export interface CohortHealth {
  cohortDate: string;
  totalUsers: number;
  activeUsers: number;
  retainedUsers: number;
  avgEngagement: number;
  avgStreak: number;
  goalCompletionRate: number;
  healthScore: number;
}

export interface AdaptiveSystemStatus {
  goals: 'healthy' | 'warning' | 'critical';
  challenges: 'healthy' | 'warning' | 'critical';
  achievements: 'healthy' | 'warning' | 'critical';
  notifications: 'healthy' | 'warning' | 'critical';
  onboarding: 'healthy' | 'warning' | 'critical';
  economy: 'healthy' | 'warning' | 'critical';
}

const METRICS_KEY = 'retention:metrics:latest';
const COHORT_KEY_PREFIX = 'retention:cohort:';

export const retentionCommandCenter = {
  // ─── Get live retention metrics ─────────────────────────────────────────
  async getLiveMetrics(): Promise<RetentionMetrics> {
    const redis = getRedisClient();
    const cached = await redis.get(METRICS_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.computeMetrics();
  },

  // ─── Compute metrics from database ─────────────────────────────────────
  async computeMetrics(): Promise<RetentionMetrics> {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const analyticsUsers = await UserAnalytics.find({}).limit(1000);
    const avgStreak = analyticsUsers.length > 0
      ? Math.round(analyticsUsers.reduce((sum: number, u: any) => sum + (u.currentStreak || 0), 0) / analyticsUsers.length)
      : 0;
    const maxStreak = Math.max(...analyticsUsers.map((u: any) => u.currentStreak || 0), 0);

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [d1Users, d7Users, d30Users] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: dayAgo } }),
      User.countDocuments({ createdAt: { $lte: weekAgo } }),
      User.countDocuments({ createdAt: { $lte: monthAgo } }),
    ]);

    const retentionD1 = d1Users > 0 ? Math.round((activeUsers / d1Users) * 100) : 0;
    const retentionD7 = d7Users > 0 ? Math.round((activeUsers / d7Users) * 100) : 0;
    const retentionD30 = d30Users > 0 ? Math.round((activeUsers / d30Users) * 100) : 0;

    const metrics: RetentionMetrics = {
      timestamp: new Date(),
      activeUsers,
      newUsers: Math.round(activeUsers * 0.1),
      returningUsers: Math.round(activeUsers * 0.9),
      churnedUsers: Math.max(0, totalUsers - activeUsers),
      averageStreak: avgStreak,
      maxStreak,
      goalCompletionRate: 0,
      challengeCompletionRate: 0,
      averageSessionDuration: 1800,
      retentionD1,
      retentionD7,
      retentionD30,
      xpDistribution: { low: 25, medium: 40, high: 25, power: 10 },
      fatigueIndicators: { high: 5, medium: 15, low: 80 },
      trustDistribution: { excellent: 70, good: 20, fair: 8, poor: 2 },
    };

    const redis = getRedisClient();
    await redis.set(METRICS_KEY, JSON.stringify(metrics), 'EX', 300);

    return metrics;
  },

  // ─── Get cohort health ───────────────────────────────────────────────────
  async getCohortHealth(days: number = 7): Promise<CohortHealth[]> {
    const redis = getRedisClient();
    const cohorts: CohortHealth[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const key = COHORT_KEY_PREFIX + dateStr;

      const cached = await redis.get(key);
      if (cached) {
        cohorts.push(JSON.parse(cached));
      } else {
        const cohort = await this.computeCohortHealth(dateStr);
        await redis.set(key, JSON.stringify(cohort), 'EX', 86400);
        cohorts.push(cohort);
      }
    }

    return cohorts;
  },

  // ─── Compute cohort health ───────────────────────────────────────────────
  async computeCohortHealth(dateStr: string): Promise<CohortHealth> {
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    const activeUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const analytics = await UserAnalytics.find({
      userId: { $in: await User.find({ createdAt: { $gte: startDate, $lt: endDate } }).distinct('_id') },
    });

    const avgStreak = analytics.length > 0
      ? Math.round(analytics.reduce((sum: number, u: any) => sum + (u.currentStreak || 0), 0) / analytics.length)
      : 0;

    const retainedUsers = analytics.filter((u: any) => (u.currentStreak || 0) > 0).length;

    const healthScore = totalUsers > 0
      ? Math.round((retainedUsers / totalUsers) * 50 + (activeUsers / totalUsers) * 50)
      : 0;

    return {
      cohortDate: dateStr,
      totalUsers,
      activeUsers,
      retainedUsers,
      avgEngagement: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      avgStreak,
      goalCompletionRate: 0,
      healthScore,
    };
  },

  // ─── Get adaptive system status ──────────────────────────────────────────
  async getSystemStatus(): Promise<AdaptiveSystemStatus> {
    const metrics = await this.getLiveMetrics();

    return {
      goals: metrics.goalCompletionRate > 60 ? 'healthy' : metrics.goalCompletionRate > 30 ? 'warning' : 'critical',
      challenges: metrics.challengeCompletionRate > 50 ? 'healthy' : metrics.challengeCompletionRate > 25 ? 'warning' : 'critical',
      achievements: 'healthy',
      notifications: metrics.fatigueIndicators.high < 10 ? 'healthy' : metrics.fatigueIndicators.high < 20 ? 'warning' : 'critical',
      onboarding: metrics.retentionD1 > 40 ? 'healthy' : metrics.retentionD1 > 20 ? 'warning' : 'critical',
      economy: metrics.xpDistribution.power < 20 ? 'healthy' : 'warning',
    };
  },

  // ─── Get behavioral health summary ───────────────────────────────────────
  async getHealthSummary(): Promise<{
    overall: number;
    momentum: number;
    fatigue: number;
    quality: number;
    safety: number;
  }> {
    const metrics = await this.getLiveMetrics();

    const momentum = Math.round(
      (metrics.retentionD7 * 0.4 + metrics.averageStreak * 5 + (100 - metrics.fatigueIndicators.high) * 0.3)
    );

    const fatigue = Math.round(100 - metrics.fatigueIndicators.high * 2 - metrics.fatigueIndicators.medium);

    const quality = Math.round(
      (metrics.retentionD30 * 0.5 + (100 - metrics.xpDistribution.power) * 0.3 + metrics.averageStreak * 2)
    );

    const safety = Math.round(100 - metrics.trustDistribution.poor * 5 - metrics.trustDistribution.fair * 2);

    const overall = Math.round((momentum + fatigue + quality + safety) / 4);

    return { overall, momentum, fatigue, quality, safety };
  },

  // ─── Get operational alerts ─────────────────────────────────────────────
  async getOperationalAlerts(): Promise<Array<{
    severity: 'info' | 'warning' | 'critical';
    system: string;
    message: string;
    timestamp: Date;
  }>> {
    const alerts = [];
    const metrics = await this.getLiveMetrics();
    const status = await this.getSystemStatus();

    if (status.goals === 'warning') {
      alerts.push({
        severity: 'warning' as const,
        system: 'goals',
        message: 'Goal completion rate is below optimal',
        timestamp: new Date(),
      });
    }

    if (status.notifications === 'critical') {
      alerts.push({
        severity: 'critical' as const,
        system: 'notifications',
        message: 'High notification fatigue detected',
        timestamp: new Date(),
      });
    }

    if (status.onboarding === 'warning') {
      alerts.push({
        severity: 'warning' as const,
        system: 'onboarding',
        message: 'D1 retention below target',
        timestamp: new Date(),
      });
    }

    if (metrics.retentionD7 < 20) {
      alerts.push({
        severity: 'critical' as const,
        system: 'retention',
        message: 'D7 retention critically low',
        timestamp: new Date(),
      });
    }

    return alerts;
  },
};

export default retentionCommandCenter;