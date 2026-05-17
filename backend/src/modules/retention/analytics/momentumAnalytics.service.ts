// src/modules/retention/analytics/momentumAnalytics.service.ts — Momentum Analytics Engine
// Phase-C3: Precomputed behavioral analytics for retention intelligence

import { Types } from 'mongoose';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export interface MomentumReport {
  userId: string;
  momentumScore: number; // -100 to +100
  momentumTrend: 'increasing' | 'stable' | 'decreasing';
  streakResilience: number; // 0-100
  burnoutProbability: number; // 0-100
  comebackProbability: number; // 0-100
  consistencyScore: number; // 0-100
  lastComputedAt: Date;
}

export interface RetentionMetrics {
  date: string;
  d1Retention: number;
  d7Retention: number;
  d30Retention: number;
  streakPreservation: number;
  challengeParticipation: number;
  goalCompletion: number;
  comebackSuccess: number;
}

// Redis keys
const ANALYTICS_KEYS = {
  momentumScore: (userId: string) => `analytics:momentum:${userId}`,
  burnoutPrediction: (userId: string) => `analytics:burnout:${userId}`,
};

export const momentumAnalytics = {
  // ─── Calculate momentum score from weekly XP history ───────────────────────
  calculateMomentumScore(weeklyHistory: Array<{ weekStart: Date; xp: number }>): number {
    if (weeklyHistory.length < 2) return 0;

    // Get last 2 weeks vs previous 2 weeks
    const recent = weeklyHistory.slice(0, 2);
    const previous = weeklyHistory.slice(2, 4);

    const recentAvg = recent.reduce((sum, w) => sum + w.xp, 0) / Math.max(recent.length, 1);
    const previousAvg = previous.length > 0
      ? previous.reduce((sum, w) => sum + w.xp, 0) / previous.length
      : recentAvg;

    if (previousAvg === 0) return 0;

    // Calculate percentage change, scaled to -100 to +100
    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    return Math.max(-100, Math.min(100, Math.round(changePercent)));
  },

  // ─── Determine momentum trend ─────────────────────────────────────────────
  calculateMomentumTrend(momentumScore: number): 'increasing' | 'stable' | 'decreasing' {
    if (momentumScore > 10) return 'increasing';
    if (momentumScore < -10) return 'decreasing';
    return 'stable';
  },

  // ─── Calculate streak resilience (likelihood of streak preservation) ───────
  calculateStreakResilience(
    currentStreak: number,
    weeklyConsistencyScore: number,
    lastActiveDate: Date | null
  ): number {
    let resilience = 50; // Base

    // Streak length factor
    if (currentStreak >= 7) resilience += 15;
    if (currentStreak >= 14) resilience += 15;
    if (currentStreak >= 30) resilience += 10;

    // Consistency factor
    resilience += (weeklyConsistencyScore / 100) * 20;

    // Recency factor
    if (lastActiveDate) {
      const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceActive < 12) resilience += 10;
      else if (hoursSinceActive < 24) resilience += 5;
      else if (hoursSinceActive > 48) resilience -= 20;
    }

    return Math.max(0, Math.min(100, resilience));
  },

  // ─── Calculate burnout probability ────────────────────────────────────────
  calculateBurnoutProbability(
    currentStreak: number,
    avgDailyXp: number,
    daysSinceLastActive: number
  ): number {
    let probability = 0;

    // Long streak with high XP = burnout risk
    if (currentStreak >= 30 && avgDailyXp > 200) probability += 30;
    else if (currentStreak >= 14 && avgDailyXp > 300) probability += 20;

    // No rest days
    if (daysSinceLastActive > 0 && daysSinceLastActive < 1) probability += 15;

    // High daily activity
    if (avgDailyXp > 400) probability += 20;

    // Decrease probability with variety
    probability = Math.max(0, Math.min(100, probability));

    return probability;
  },

  // ─── Calculate comeback probability ───────────────────────────────────────
  calculateComebackProbability(
    daysSinceLastActive: number,
    previousStreak: number,
    bestStreak: number
  ): number {
    if (daysSinceLastActive <= 1) return 90;

    if (daysSinceLastActive > 30) return 10;

    let probability = 70 - (daysSinceLastActive * 2);

    // Prior streak history boosts comeback likelihood
    if (previousStreak >= 7) probability += 15;
    if (bestStreak >= 14) probability += 10;

    return Math.max(5, Math.min(95, probability));
  },

  // ─── Calculate consistency score ─────────────────────────────────────────
  calculateConsistencyScore(weeklyHistory: Array<{ weekStart: Date; xp: number }>): number {
    if (weeklyHistory.length === 0) return 0;

    const activeWeeks = weeklyHistory.filter((w) => w.xp > 0).length;
    return Math.round((activeWeeks / Math.min(weeklyHistory.length, 12)) * 100);
  },

  // ─── Generate full momentum report for user ───────────────────────────────
  async getMomentumReport(userId: string): Promise<MomentumReport | null> {
    const userObjId = new Types.ObjectId(userId);

    const [analytics, userXp] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }),
      UserXp.findOne({ userId: userObjId }),
    ]);

    if (!analytics) return null;

    const weeklyHistory = analytics.weeklyXPHistory ?? [];
    const daysSinceActive = analytics.lastActiveDate
      ? Math.floor((Date.now() - analytics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const momentumScore = this.calculateMomentumScore(weeklyHistory);
    const avgDailyXp = userXp?.lifetimeStats?.totalXpEarned
      ? userXp.lifetimeStats.totalXpEarned / Math.max(1, daysSinceActive || 1)
      : 0;

    return {
      userId,
      momentumScore,
      momentumTrend: this.calculateMomentumTrend(momentumScore),
      streakResilience: this.calculateStreakResilience(
        analytics.currentStreak,
        analytics.weeklyConsistencyScore,
        analytics.lastActiveDate
      ),
      burnoutProbability: this.calculateBurnoutProbability(
        analytics.currentStreak,
        avgDailyXp,
        daysSinceActive
      ),
      comebackProbability: this.calculateComebackProbability(
        daysSinceActive,
        analytics.currentStreak,
        analytics.bestStreak
      ),
      consistencyScore: this.calculateConsistencyScore(weeklyHistory),
      lastComputedAt: new Date(),
    };
  },

  // ─── Cache momentum score in Redis for fast reads ────────────────────────
  async cacheMomentumScore(userId: string, score: number): Promise<void> {
    const redis = getRedisClient();
    await redis.set(ANALYTICS_KEYS.momentumScore(userId), String(score), 'EX', 3600); // 1 hour
  },

  // ─── Get cached momentum score ───────────────────────────────────────────
  async getCachedMomentumScore(userId: string): Promise<number | null> {
    const redis = getRedisClient();
    const cached = await redis.get(ANALYTICS_KEYS.momentumScore(userId));
    return cached ? parseInt(cached, 10) : null;
  },

  // ─── Batch recompute analytics for multiple users ─────────────────────────
  async recomputeMomentumBatch(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      try {
        const report = await this.getMomentumReport(userId);
        if (report) {
          await this.cacheMomentumScore(userId, report.momentumScore);
        }
      } catch (err) {
        logger.warn('[analytics] Failed to compute momentum for user', { error: err, userId });
      }
    }

    logger.info('[analytics] Batch recompute completed', { userCount: userIds.length });
  },

  // ─── Get retention metrics for a date ─────────────────────────────────────
  async getRetentionMetrics(forDate: Date): Promise<RetentionMetrics> {
    // This would normally query the analytics database
    // For now, return placeholder structure
    const dateKey = forDate.toISOString().split('T')[0];

    return {
      date: dateKey,
      d1Retention: 0, // Would be calculated from user activity logs
      d7Retention: 0,
      d30Retention: 0,
      streakPreservation: 0,
      challengeParticipation: 0,
      goalCompletion: 0,
      comebackSuccess: 0,
    };
  },
};

export default momentumAnalytics;