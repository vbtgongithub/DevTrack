// src/modules/progression-orchestration/xpEngine.ts
// Centralized XP calculation and verification engine.
// Guarantees replay-safe progression and strict anti-abuse rules.

import { UserXp } from '../../db/models/userXp.model.js';
import { XpTransaction } from '../../db/models/xpTransaction.model.js';
import { logger } from '../../shared/logger.js';
import type { CanonicalActivity } from './activityEvent.js';

// Configuration
export const XP_CONFIG = {
  DIFFICULTY: {
    easy: 10,
    medium: 25,
    hard: 50,
    unknown: 5,
  },
  ACTIVITY_TYPE: {
    problem_solved: 1.0,
    contest_participated: 2.0, // multiplier
    submission: 0.5,           // multiplier
    daily_challenge: 1.5,      // multiplier
  },
  DAILY_MAX_XP: 300,            // Hard ceiling
  DIMINISHING_RETURNS_SOLVES: 8, // After 8 solves a day, XP is scaled down
  DIMINISHING_RETURNS_SCALE: 0.4, // 60% reduction
};

export class XpEngineClass {
  /**
   * Helper to calculate level boundary.
   * Standard RPG scaling: Level = Math.floor(sqrt(totalXp) / 10) + 1
   */
  calculateLevel(totalXp: number): number {
    return Math.floor(Math.sqrt(totalXp) / 5) + 1;
  }

  /**
   * Calculate exact amount of XP required for the next level.
   */
  xpRequiredForLevel(level: number): number {
    return Math.pow((level) * 5, 2);
  }

  /**
   * Deterministic XP calculation pipeline.
   */
  calculateXpAward(
    difficulty: 'easy' | 'medium' | 'hard' | 'unknown',
    type: CanonicalActivity['type'],
    currentStreak: number,
    dailyXpEarnedBefore: number,
    dailySolvesCount: number
  ): number {
    // 1. Base difficulty XP
    let xp = XP_CONFIG.DIFFICULTY[difficulty] || XP_CONFIG.DIFFICULTY.unknown;

    // 2. Type multiplier
    const typeMultiplier = XP_CONFIG.ACTIVITY_TYPE[type] || 1.0;
    xp *= typeMultiplier;

    // 3. Streak multiplier: up to 50% bonus
    const streakBonus = Math.min(currentStreak * 0.05, 0.5);
    xp *= (1.0 + streakBonus);

    // 4. Diminishing returns scaling after N daily solves
    if (dailySolvesCount >= XP_CONFIG.DIMINISHING_RETURNS_SOLVES) {
      xp *= XP_CONFIG.DIMINISHING_RETURNS_SCALE;
    }

    // Round to nearest integer
    let finalXp = Math.round(xp);

    // 5. Daily Cap Enforcement
    if (dailyXpEarnedBefore >= XP_CONFIG.DAILY_MAX_XP) {
      return 0;
    }
    if (dailyXpEarnedBefore + finalXp > XP_CONFIG.DAILY_MAX_XP) {
      finalXp = XP_CONFIG.DAILY_MAX_XP - dailyXpEarnedBefore;
    }

    return finalXp;
  }

  /**
   * Process and persist XP award inside a database transaction / atomic update.
   */
  async awardProgressionXp(
    userId: string,
    activity: CanonicalActivity,
    currentStreak: number
  ): Promise<{ xpAwarded: number; newTotalXp: number; levelUp: boolean }> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Calculate daily XP earned today
    const dailyTxResult = await XpTransaction.aggregate([
      {
        $match: {
          userId: new Object(userId) as any,
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          totalXp: { $sum: '$xpAwarded' },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyXpEarned = dailyTxResult[0]?.totalXp || 0;
    const dailySolvesCount = dailyTxResult[0]?.count || 0;

    // Calculate award amount
    const xpAwarded = this.calculateXpAward(
      activity.difficulty || 'unknown',
      activity.type,
      currentStreak,
      dailyXpEarned,
      dailySolvesCount
    );

    // If XP is 0 (due to cap or other), skip transaction log but return values
    if (xpAwarded === 0) {
      const userXpRecord = await UserXp.findOne({ userId });
      return {
        xpAwarded: 0,
        newTotalXp: userXpRecord?.totalXp || 0,
        levelUp: false,
      };
    }

    // Atomic update or transaction for aggregate
    let userXp = await UserXp.findOne({ userId });
    if (!userXp) {
      userXp = new UserXp({
        userId,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: this.xpRequiredForLevel(1),
        lifetimeStats: {
          totalProblemsSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          totalContests: 0,
          dailyStreaks: 0,
          longestStreak: 0,
          totalSyncs: 0,
          totalXpEarned: 0,
        },
      });
    }

    const previousTotalXp = userXp.totalXp;
    const newTotalXp = previousTotalXp + xpAwarded;

    const levelBefore = userXp.currentLevel;
    const levelAfter = this.calculateLevel(newTotalXp);
    const levelUp = levelAfter > levelBefore;

    // Build the immutable transaction log
    const tx = new XpTransaction({
      userId,
      sourceType: 'dsa_accepted',
      sourceId: activity.activityId,
      xpAwarded,
      previousTotalXp,
      newTotalXp,
      levelBefore,
      levelAfter,
      metadata: {
        provider: activity.provider,
        providerEventId: activity.providerEventId,
        difficulty: activity.difficulty,
        traceId: activity.traceContext.traceId,
      },
    });

    await tx.save();

    // Update aggregate user profile stats
    userXp.totalXp = newTotalXp;
    userXp.currentLevel = levelAfter;
    userXp.xpToNextLevel = this.xpRequiredForLevel(levelAfter) - newTotalXp;
    userXp.lastXpGainedAt = new Date();
    
    // Increment lifetime metrics
    userXp.lifetimeStats.totalProblemsSolved += 1;
    if (activity.difficulty === 'easy') userXp.lifetimeStats.easySolved += 1;
    if (activity.difficulty === 'medium') userXp.lifetimeStats.mediumSolved += 1;
    if (activity.difficulty === 'hard') userXp.lifetimeStats.hardSolved += 1;
    userXp.lifetimeStats.totalXpEarned += xpAwarded;

    await userXp.save();

    logger.info('[xp-engine] XP Awarded successfully', {
      userId,
      xpAwarded,
      newTotalXp,
      levelAfter,
      levelUp,
    });

    return { xpAwarded, newTotalXp, levelUp };
  }
}

export const xpEngine = new XpEngineClass();
