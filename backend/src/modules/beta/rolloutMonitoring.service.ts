// src/modules/beta/rolloutMonitoring.service.ts — Rollout Monitoring Service
// Phase-J: Controlled Beta Infrastructure - Rollout monitoring and safety checks

import mongoose from 'mongoose';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface RolloutMetrics {
  featureName: string;
  totalUsers: number;
  activeUsers: number;
  errorRate: number;
  averageSessionDuration: number;
  frictionEventRate: number;
  satisfactionScore: number;
  crashRate: number;
  performanceScore: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export interface SafetyCheckResult {
  passed: boolean;
  issues: string[];
  metrics: RolloutMetrics;
  rollbackRecommended: boolean;
}

export const rolloutMonitoring = {
  // ─── Get Rollout Metrics ────────────────────────────────────────────────
  async getRolloutMetrics(featureName: string, dateRange: { start: Date; end: Date }): Promise<RolloutMetrics> {
    const betaUsers = await BetaUser.find({ status: 'active', betaFeatures: featureName });
    const totalUsers = betaUsers.length;
    const activeUsers = betaUsers.filter(u => u.lastActiveAt && u.lastActiveAt >= dateRange.start).length;

    // Get session replays for this feature
    const sessionReplays = await SessionReplay.find({
      betaUserId: { $in: betaUsers.map(u => u._id) },
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Calculate metrics
    let totalErrors = 0;
    let totalFrictionEvents = 0;
    let totalDuration = 0;
    let satisfactionSum = 0;
    let satisfactionCount = 0;
    let crashes = 0;

    sessionReplays.forEach(replay => {
      // Count errors
      totalErrors += replay.frictionEvents.filter(f => f.type === 'error').length;

      // Count friction events
      totalFrictionEvents += replay.frictionEvents.length;

      // Sum duration
      totalDuration += replay.duration || 0;

      // Count crashes (abnormal session endings)
      if (!replay.endTime) {
        crashes++;
      }
    });

    const errorRate = sessionReplays.length > 0 ? (totalErrors / sessionReplays.length) * 100 : 0;
    const averageSessionDuration = sessionReplays.length > 0 ? totalDuration / sessionReplays.length : 0;
    const frictionEventRate = sessionReplays.length > 0 ? (totalFrictionEvents / sessionReplays.length) : 0;
    const satisfactionScore = satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 75; // Default to 75
    const crashRate = sessionReplays.length > 0 ? (crashes / sessionReplays.length) * 100 : 0;

    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(errorRate, frictionEventRate, crashRate, satisfactionScore);

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical';
    if (errorRate > 10 || crashRate > 5 || frictionEventRate > 5) {
      healthStatus = 'critical';
    } else if (errorRate > 5 || crashRate > 2 || frictionEventRate > 3) {
      healthStatus = 'warning';
    } else {
      healthStatus = 'healthy';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(errorRate, frictionEventRate, crashRate, satisfactionScore, healthStatus);

    return {
      featureName,
      totalUsers,
      activeUsers,
      errorRate,
      averageSessionDuration,
      frictionEventRate,
      satisfactionScore,
      crashRate,
      performanceScore,
      healthStatus,
      recommendations,
    };
  },

  // ─── Calculate Performance Score ─────────────────────────────────────────
  calculatePerformanceScore(errorRate: number, frictionEventRate: number, crashRate: number, satisfactionScore: number): number {
    let score = 100;
    score -= errorRate * 2;
    score -= frictionEventRate * 3;
    score -= crashRate * 5;
    score -= (100 - satisfactionScore) * 0.5;
    return Math.max(0, Math.min(100, score));
  },

  // ─── Generate Recommendations ────────────────────────────────────────────
  generateRecommendations(
    errorRate: number,
    frictionEventRate: number,
    crashRate: number,
    satisfactionScore: number,
    healthStatus: 'healthy' | 'warning' | 'critical'
  ): string[] {
    const recommendations: string[] = [];

    if (healthStatus === 'critical') {
      recommendations.push('CRITICAL: Rollout health is critical - consider immediate rollback');
    }

    if (errorRate > 5) {
      recommendations.push('High error rate detected - investigate error patterns');
    }

    if (frictionEventRate > 3) {
      recommendations.push('High friction event rate - review UX patterns');
    }

    if (crashRate > 2) {
      recommendations.push('High crash rate - investigate stability issues');
    }

    if (satisfactionScore < 60) {
      recommendations.push('Low satisfaction score - gather user feedback');
    }

    if (healthStatus === 'healthy') {
      recommendations.push('Rollout is healthy - consider increasing rollout percentage');
    }

    return recommendations;
  },

  // ─── Perform Safety Check ──────────────────────────────────────────────
  async performSafetyCheck(featureName: string): Promise<SafetyCheckResult> {
    const dateRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date(),
    };

    const metrics = await this.getRolloutMetrics(featureName, dateRange);

    const issues: string[] = [];
    let rollbackRecommended = false;

    // Safety thresholds
    if (metrics.errorRate > 15) {
      issues.push(`Error rate (${metrics.errorRate.toFixed(1)}%) exceeds safety threshold (15%)`);
      rollbackRecommended = true;
    }

    if (metrics.crashRate > 10) {
      issues.push(`Crash rate (${metrics.crashRate.toFixed(1)}%) exceeds safety threshold (10%)`);
      rollbackRecommended = true;
    }

    if (metrics.frictionEventRate > 8) {
      issues.push(`Friction event rate (${metrics.frictionEventRate.toFixed(1)}) exceeds safety threshold (8)`);
      rollbackRecommended = true;
    }

    if (metrics.satisfactionScore < 40) {
      issues.push(`Satisfaction score (${metrics.satisfactionScore.toFixed(1)}) is critically low`);
      rollbackRecommended = true;
    }

    if (metrics.performanceScore < 50) {
      issues.push(`Performance score (${metrics.performanceScore.toFixed(1)}) is below acceptable threshold`);
    }

    const passed = issues.length === 0;

    return {
      passed,
      issues,
      metrics,
      rollbackRecommended,
    };
  },

  // ─── Get Cohort Comparison ─────────────────────────────────────────────
  async getCohortComparison(featureName: string): Promise<Array<{
    cohortId: string;
    cohortName: string;
    userCount: number;
    averageSessionDuration: number;
    frictionEventRate: number;
    satisfactionScore: number;
  }>> {
    const betaUsers = await BetaUser.find({ status: 'active', betaFeatures: featureName });

    // Group by cohort
    const cohortGroups = new Map<string, mongoose.Types.ObjectId[]>();
    betaUsers.forEach(u => {
      if (!cohortGroups.has(u.cohortId)) {
        cohortGroups.set(u.cohortId, []);
      }
      cohortGroups.get(u.cohortId)!.push(u._id);
    });

    const comparison: Array<{
      cohortId: string;
      cohortName: string;
      userCount: number;
      averageSessionDuration: number;
      frictionEventRate: number;
      satisfactionScore: number;
    }> = [];

    for (const [cohortId, userIds] of cohortGroups) {
      const sessionReplays = await SessionReplay.find({
        betaUserId: { $in: userIds },
      });

      let totalDuration = 0;
      let totalFriction = 0;

      sessionReplays.forEach(r => {
        if (r.duration) totalDuration += r.duration;
        totalFriction += r.frictionEvents.length;
      });

      const averageSessionDuration = sessionReplays.length > 0 ? totalDuration / sessionReplays.length : 0;
      const frictionEventRate = sessionReplays.length > 0 ? totalFriction / sessionReplays.length : 0;
      const satisfactionScore = 75; // Placeholder

      comparison.push({
        cohortId,
        cohortName: cohortId, // Would fetch from BetaCohort
        userCount: userIds.length,
        averageSessionDuration,
        frictionEventRate,
        satisfactionScore,
      });
    }

    return comparison;
  },

  // ─── Monitor Rollout Health ───────────────────────────────────────────
  async monitorRolloutHealth(featureName: string): Promise<{
    isHealthy: boolean;
    trend: 'improving' | 'stable' | 'degrading';
    alerts: string[];
  }> {
    const redis = getRedisClient();
    const healthKey = `rollout_health:${featureName}`;

    // Get current metrics
    const currentMetrics = await this.getRolloutMetrics(featureName, {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    // Get previous metrics (from 24-48 hours ago)
    const previousMetrics = await this.getRolloutMetrics(featureName, {
      start: new Date(Date.now() - 48 * 60 * 60 * 1000),
      end: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    // Determine trend
    let trend: 'improving' | 'stable' | 'degrading';
    const scoreDelta = currentMetrics.performanceScore - previousMetrics.performanceScore;

    if (scoreDelta > 5) {
      trend = 'improving';
    } else if (scoreDelta < -5) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    // Generate alerts
    const alerts: string[] = [];

    if (currentMetrics.healthStatus === 'critical') {
      alerts.push('CRITICAL: Rollout health is critical');
    }

    if (trend === 'degrading') {
      alerts.push('WARNING: Performance is degrading over time');
    }

    if (currentMetrics.errorRate > previousMetrics.errorRate * 1.5) {
      alerts.push('WARNING: Error rate is increasing significantly');
    }

    const isHealthy = currentMetrics.healthStatus === 'healthy' && trend !== 'degrading';

    // Store current health in Redis
    await redis.setex(healthKey, 3600, JSON.stringify({
      isHealthy,
      trend,
      performanceScore: currentMetrics.performanceScore,
      timestamp: new Date(),
    }));

    return {
      isHealthy,
      trend,
      alerts,
    };
  },
};

export default rolloutMonitoring;
