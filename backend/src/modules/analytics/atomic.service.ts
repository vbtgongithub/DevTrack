// src/modules/analytics/atomic.service.ts — Atomic UserAnalytics update patterns
// Phase-1 Hardening: Concurrency-safe analytics updates

import { Types } from 'mongoose';
import { UserAnalytics, type IUserAnalytics } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import cacheManager from '../../shared/cache/cacheManager.js';

// Version field for optimistic concurrency
interface AnalyticsVersion {
  version: number;
  lastUpdatedAt: Date;
}

export const atomicAnalytics = {
  // ─── Atomic XP update ───────────────────────────────────────────────────
  // Uses $inc for non-blocking concurrent updates

  async updateXpAtomically(
    userId: string,
    xpToAdd: number,
    newLevel?: number
  ): Promise<IUserAnalytics> {
    const userObjId = new Types.ObjectId(userId);

    const setFields: Record<string, unknown> = { updatedAt: new Date() };
    if (newLevel !== undefined) {
      setFields.currentLevel = newLevel;
    }

    const result = await UserAnalytics.findOneAndUpdate(
      { userId: userObjId },
      {
        $inc: { totalXp: xpToAdd },
        $set: setFields,
      },
      { new: true, upsert: true }
    );

    // Invalidate cache after atomic update
    await cacheManager.invalidateUserAnalytics(userId);
    await cacheManager.invalidateUserXp(userId);

    logger.debug('[analytics] Atomic XP update', { userId, xpToAdd, newLevel });
    return result;
  },

  // ─── Atomic streak update ───────────────────────────────────────────────
  // Uses $max to safely update best streak without race conditions

  async updateStreakAtomically(
    userId: string,
    currentStreak: number,
    lastActiveDate: Date
  ): Promise<IUserAnalytics> {
    const userObjId = new Types.ObjectId(userId);

    const result = await UserAnalytics.findOneAndUpdate(
      { userId: userObjId },
      {
        $set: {
          currentStreak,
          lastActiveDate,
          currentStreakType: 'unified',
          updatedAt: new Date(),
        },
        $max: {
          bestStreak: currentStreak,
        },
      },
      { new: true, upsert: true }
    );

    // Invalidate streak cache
    await cacheManager.invalidateUserStreak(userId);

    logger.debug('[analytics] Atomic streak update', { userId, currentStreak });
    return result;
  },

  // ─── Atomic solve count update ───────────────────────────────────────────

  async incrementSolveCount(userId: string): Promise<IUserAnalytics> {
    const userObjId = new Types.ObjectId(userId);

    const result = await UserAnalytics.findOneAndUpdate(
      { userId: userObjId },
      {
        $inc: { dsaSolveCount: 1 },
        $set: { updatedAt: new Date() },
      },
      { new: true, upsert: true }
    );

    await cacheManager.invalidateUserAnalytics(userId);

    return result;
  },

  // ─── Optimistic concurrency update ─────────────────────────────────────
  // Uses version field to detect concurrent modifications

  async updateWithOptimisticLock(
    userId: string,
    expectedVersion: number,
    updates: Record<string, unknown>
  ): Promise<{ success: boolean; document?: IUserAnalytics; conflict?: boolean }> {
    const userObjId = new Types.ObjectId(userId);

    // Add version check to update
    const updateWithVersion = {
      ...updates,
      $inc: { ...(updates.$inc as Record<string, unknown>), version: 1 },
    };

    const result = await UserAnalytics.findOneAndUpdate(
      {
        userId: userObjId,
        version: expectedVersion,
      },
      {
        ...updateWithVersion,
        $set: {
          ...(updates.$set as Record<string, unknown>),
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      // Check if it's a version conflict or document doesn't exist
      const existing = await UserAnalytics.findOne({ userId: userObjId });

      if (existing) {
        logger.warn('[analytics] Optimistic lock conflict', {
          userId,
          expectedVersion,
        });
        return { success: false, conflict: true };
      }

      // Document doesn't exist, create it
      return { success: false, conflict: false };
    }

    await cacheManager.invalidateUserAnalytics(userId);

    return { success: true, document: result };
  },

  // ─── Bulk atomic updates for analytics rebuild ─────────────────────────

  async bulkUpsertAnalytics(
    analyticsData: Array<{
      userId: string;
      totalXp: number;
      currentLevel: number;
      currentStreak: number;
      bestStreak: number;
      dsaSolveCount: number;
      weeklyConsistencyScore: number;
    }>
  ): Promise<{ modified: number; upserted: number }> {
    let modified = 0;
    let upserted = 0;

    for (const data of analyticsData) {
      const result = await UserAnalytics.updateOne(
        { userId: new Types.ObjectId(data.userId) },
        {
          $set: {
            totalXp: data.totalXp,
            currentLevel: data.currentLevel,
            currentStreak: data.currentStreak,
            bestStreak: data.bestStreak,
            dsaSolveCount: data.dsaSolveCount,
            weeklyConsistencyScore: data.weeklyConsistencyScore,
            updatedAt: new Date(),
            computedAt: new Date(),
          },
          $setOnInsert: {
            userId: new Types.ObjectId(data.userId),
            currentStreakType: 'unified',
            lastActiveDate: null,
            streakFreezeUntil: null,
            weeklyXPHistory: [],
            placementReadinessScore: 0,
          },
        },
        { upsert: true }
      );

      if (result.upsertedId) {
        upserted++;
      } else if (result.modifiedCount) {
        modified++;
      }
    }

    logger.info('[analytics] Bulk analytics upsert', { modified, upserted });

    return { modified, upserted };
  },

  // ─── Get analytics with versioning for concurrency ───────────────────

  async getAnalyticsWithVersion(userId: string): Promise<IUserAnalytics | null> {
    return UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
  },

  // ─── Atomic weekly score update ────────────────────────────────────────

  async updateWeeklyConsistencyScore(userId: string): Promise<IUserAnalytics | null> {
    const userObjId = new Types.ObjectId(userId);

    const analytics = await UserAnalytics.findOne({ userId: userObjId });

    if (!analytics) {
      return null;
    }

    // Calculate active weeks from history
    const activeWeeks = (analytics.weeklyXPHistory || []).filter(
      (w) => w.xp > 0
    ).length;
    const score = Math.round((activeWeeks / 12) * 100);

    const result = await UserAnalytics.findOneAndUpdate(
      { userId: userObjId },
      {
        $set: {
          weeklyConsistencyScore: score,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    await cacheManager.invalidateUserAnalytics(userId);

    return result;
  },
};

export default atomicAnalytics;