// src/modules/anti-fraud/trustScore.ts — Trust Score + Adaptive Abuse Economics
// Phase-B: Dynamic trust scoring and reputation engine

import { Types } from 'mongoose';
import { User, UserXp, XpTransaction, ActivityEvent, UserAnalytics } from '../../db/models/index.js';
import { getRedisClient } from '../../shared/redis/client.js';
import { logger } from '../../shared/logger.js';

export interface TrustScoreResult {
  score: number;              // 0-100
  factors: TrustFactor[];
  confidence: number;        // How confident we are in this score
  flags: string[];           // Potential issues to review
  riskLevel: 'low' | 'medium' | 'high';
}

interface TrustFactor {
  name: string;
  contribution: number;     // Positive or negative
  weight: number;
  reason: string;
}

// Factor weights
const FACTOR_WEIGHTS = {
  accountAge: 0.15,
  solveDiversity: 0.20,
  difficultyEntropy: 0.15,
  commitQuality: 0.10,
  activityConsistency: 0.15,
  spamHistory: 0.15,
  replayAnomalies: 0.10,
};

export const trustScoreEngine = {
  // ─── Calculate trust score for a user ─────────────────────────────────
  async calculateTrustScore(userId: string): Promise<TrustScoreResult> {
    const userObjId = new Types.ObjectId(userId);
    const factors: TrustFactor[] = [];
    let totalScore = 50; // Start with neutral base

    // Get all user data
    const [user, userXp, analytics] = await Promise.all([
      User.findById(userId),
      UserXp.findOne({ userId: userObjId }),
      UserAnalytics.findOne({ userId: userObjId }),
    ]);

    if (!user) {
      return {
        score: 0,
        factors: [],
        confidence: 0,
        flags: ['User not found'],
        riskLevel: 'high',
      };
    }

    // Factor 1: Account age (older = more trusted)
    const accountAgeDays = Math.floor(
      (Date.now() - (user as any).createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const ageScore = Math.min(100, (accountAgeDays / 365) * 100); // Max at 1 year
    factors.push({
      name: 'account_age',
      contribution: ageScore * FACTOR_WEIGHTS.accountAge,
      weight: FACTOR_WEIGHTS.accountAge,
      reason: `Account ${accountAgeDays} days old`,
    });
    totalScore += ageScore * FACTOR_WEIGHTS.accountAge;

    // Factor 2: Solve diversity (variety of problems solved)
    if (userXp?.lifetimeStats) {
      const { easySolved = 0, mediumSolved = 0, hardSolved = 0 } = userXp.lifetimeStats;
      const total = easySolved + mediumSolved + hardSolved;

      if (total > 0) {
        // Shannon entropy for difficulty distribution
        const proportions = [easySolved / total, mediumSolved / total, hardSolved / total];
        const entropy = proportions
          .filter((p) => p > 0)
          .reduce((sum, p) => sum - p * Math.log2(p), 0);
        const normalizedEntropy = entropy / Math.log2(3); // Normalize to 0-1

        // High entropy = good (solves variety of difficulties)
        const diversityScore = normalizedEntropy * 100;

        factors.push({
          name: 'solve_diversity',
          contribution: diversityScore * FACTOR_WEIGHTS.solveDiversity,
          weight: FACTOR_WEIGHTS.solveDiversity,
          reason: `Difficulty entropy: ${normalizedEntropy.toFixed(2)}`,
        });
        totalScore += diversityScore * FACTOR_WEIGHTS.solveDiversity;
      }
    }

    // Factor 3: Activity consistency
    const consistencyScore = analytics?.weeklyConsistencyScore || 0;
    factors.push({
      name: 'activity_consistency',
      contribution: consistencyScore * FACTOR_WEIGHTS.activityConsistency,
      weight: FACTOR_WEIGHTS.activityConsistency,
      reason: `Weekly consistency: ${consistencyScore}%`,
    });
    totalScore += consistencyScore * FACTOR_WEIGHTS.activityConsistency;

    // Factor 4: Streak consistency (active streaks = trusted)
    const currentStreak = analytics?.currentStreak || 0;
    const streakScore = Math.min(100, currentStreak * 5);
    factors.push({
      name: 'streak_consistency',
      contribution: streakScore * 0.1, // Lower weight for streak
      weight: 0.1,
      reason: `Current streak: ${currentStreak} days`,
    });
    totalScore += streakScore * 0.1;

    // Factor 5: Check for abuse patterns from Redis
    const abuseFlags = await this.checkAbusePatterns(userId);

    // Factor 6: Check transaction velocity
    const velocityScore = await this.checkTransactionVelocity(userId);
    factors.push({
      name: 'transaction_velocity',
      contribution: velocityScore * FACTOR_WEIGHTS.spamHistory,
      weight: FACTOR_WEIGHTS.spamHistory,
      reason: velocityScore > 0 ? 'High transaction velocity detected' : 'Normal transaction pattern',
    });
    totalScore += velocityScore * FACTOR_WEIGHTS.spamHistory;

    // Calculate confidence based on available data
    const dataAvailability = [
      !!userXp?.lifetimeStats,
      !!analytics,
      accountAgeDays > 7,
    ].filter(Boolean).length / 3;

    const confidence = Math.min(100, dataAvailability * 100);

    // Determine risk level
    const flags = abuseFlags.map((f) => f.description);
    const riskLevel = this.determineRiskLevel(totalScore, flags);

    // Clamp final score
    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    // Cache the score
    await this.cacheTrustScore(userId, finalScore);

    logger.debug('[trust] Score calculated', { userId, score: finalScore, riskLevel });

    return {
      score: finalScore,
      factors,
      confidence,
      flags,
      riskLevel,
    };
  },

  // ─── Check abuse patterns from Redis ─────────────────────────────────
  async checkAbusePatterns(userId: string): Promise<{ type: string; description: string }[]> {
    const redis = getRedisClient();
    const flags: { type: string; description: string }[] = [];

    // Check daily XP cap violations (tracked in anti-fraud)
    const xpCapKey = `xp:daily:${userId}:*`;
    const xpKeys = await redis.keys(xpCapKey);

    for (const key of xpKeys) {
      const xp = parseInt((await redis.get(key)) || '0', 10);
      if (xp > 500) { // Daily cap
        flags.push({ type: 'xp_cap_violation', description: 'Exceeded daily XP cap' });
      }
    }

    // Check velocity
    const velocityKey = `velocity:${userId}`;
    const velocity = parseInt((await redis.get(velocityKey)) || '0', 10);
    if (velocity > 100) {
      flags.push({ type: 'high_velocity', description: 'Unusual activity velocity' });
    }

    return flags;
  },

  // ─── Check transaction velocity ───────────────────────────────────────
  async checkTransactionVelocity(userId: string): Promise<number> {
    const userObjId = new Types.ObjectId(userId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await XpTransaction.countDocuments({
      userId: userObjId,
      createdAt: { $gte: oneDayAgo },
    });

    // Normal transactions per day: 0-50
    // Suspicious: 50-100
    // Very suspicious: 100+
    if (count > 100) return -40;
    if (count > 50) return -20;
    return 10; // Normal
  },

  // ─── Determine risk level ───────────────────────────────────────────
  determineRiskLevel(score: number, flags: string[]): 'low' | 'medium' | 'high' {
    if (score < 40 || flags.length >= 2) return 'high';
    if (score < 60 || flags.length >= 1) return 'medium';
    return 'low';
  },

  // ─── Cache trust score ───────────────────────────────────────────────
  async cacheTrustScore(userId: string, score: number): Promise<void> {
    const redis = getRedisClient();
    const key = `trust:score:${userId}`;
    await redis.set(key, score, 'EX', 3600); // 1 hour cache
  },

  // ─── Get cached score (fast path) ─────────────────────────────────────
  async getCachedTrustScore(userId: string): Promise<number | null> {
    const redis = getRedisClient();
    const key = `trust:score:${userId}`;
    const cached = await redis.get(key);
    return cached ? parseInt(cached, 10) : null;
  },

  // ─── Adaptive XP multiplier based on trust ───────────────────────────
  calculateAdaptiveMultiplier(trustScore: number): number {
    // Trust 90-100: 1.0x (full XP)
    // Trust 70-89: 0.9x
    // Trust 50-69: 0.7x
    // Trust 30-49: 0.5x
    // Trust <30: 0.25x

    if (trustScore >= 90) return 1.0;
    if (trustScore >= 70) return 0.9;
    if (trustScore >= 50) return 0.7;
    if (trustScore >= 30) return 0.5;
    return 0.25;
  },

  // ─── Shadow ban check ─────────────────────────────────────────────────
  async isShadowBanned(userId: string): Promise<boolean> {
    const result = await this.calculateTrustScore(userId);
    return result.riskLevel === 'high' && result.score < 30;
  },

  // ─── Bulk score calculation for leaderboard filtering ───────────────
  async getTrustScoresForUsers(userIds: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    for (const userId of userIds) {
      const cached = await this.getCachedTrustScore(userId);
      if (cached !== null) {
        scores.set(userId, cached);
      } else {
        const result = await this.calculateTrustScore(userId);
        scores.set(userId, result.score);
      }
    }

    return scores;
  },
};

export default trustScoreEngine;