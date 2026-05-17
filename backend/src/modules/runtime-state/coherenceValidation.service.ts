// src/modules/runtime-state/coherenceValidation.service.ts — Runtime Coherence Validation
// Phase 7: Validates that runtime state is consistent with source systems

import mongoose from 'mongoose';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface CoherenceReport {
  userId: string;
  timestamp: Date;
  valid: boolean;
  checks: CoherenceCheck[];
  driftDetected: boolean;
  resolutionAdvice?: string;
}

export interface CoherenceCheck {
  field: string;
  runtimeValue: unknown;
  sourceValue: unknown;
  match: boolean;
  source: string;
}

const VALIDATION_CACHE_TTL = 300; // 5 minutes

export const coherenceValidation = {
  /**
   * Validate runtime state against source systems
   * Returns a report of any drift detected
   */
  async validate(userId: string): Promise<CoherenceReport> {
    const redis = getRedisClient();
    const cacheKey = `coherence:validation:${userId}`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const checks: CoherenceCheck[] = [];
    const { UnifiedRuntimeState } = await import('../../db/models/unifiedRuntimeState.model.js');
    const { UserAnalytics, UserXp } = await import('../../db/models/index.js');

    const runtimeState = await UnifiedRuntimeState.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!runtimeState) {
      const report: CoherenceReport = {
        userId,
        timestamp: new Date(),
        valid: false,
        checks: [],
        driftDetected: true,
        resolutionAdvice: 'No runtime state found. Trigger full rebuild via POST /api/runtime-state/rebuild.',
      };
      return report;
    }

    // Check XP against UserAnalytics
    const analytics = await UserAnalytics.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (analytics) {
      checks.push({
        field: 'streak',
        runtimeValue: runtimeState.streak,
        sourceValue: analytics.currentStreak,
        match: runtimeState.streak === (analytics.currentStreak ?? 0),
        source: 'UserAnalytics',
      });

      checks.push({
        field: 'longestStreak',
        runtimeValue: runtimeState.longestStreak,
        sourceValue: analytics.bestStreak,
        match: runtimeState.longestStreak === (analytics.bestStreak ?? 0),
        source: 'UserAnalytics',
      });
    }

    // Check XP against UserXp
    const userXp = await UserXp.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (userXp) {
      checks.push({
        field: 'xp',
        runtimeValue: runtimeState.xp,
        sourceValue: (userXp as Record<string, unknown>).totalXp,
        match: runtimeState.xp === ((userXp as Record<string, unknown>).totalXp ?? 0),
        source: 'UserXp',
      });

      checks.push({
        field: 'level',
        runtimeValue: runtimeState.level,
        sourceValue: (userXp as Record<string, unknown>).currentLevel,
        match: runtimeState.level === ((userXp as Record<string, unknown>).currentLevel ?? 1),
        source: 'UserXp',
      });
    }

    const driftDetected = checks.some((c) => !c.match);
    const report: CoherenceReport = {
      userId,
      timestamp: new Date(),
      valid: !driftDetected,
      checks,
      driftDetected,
      resolutionAdvice: driftDetected
        ? 'Drift detected. Consider triggering a full rebuild via POST /api/runtime-state/rebuild.'
        : undefined,
    };

    // Cache the report
    await redis.set(cacheKey, JSON.stringify(report), 'EX', VALIDATION_CACHE_TTL);

    if (driftDetected) {
      logger.warn('[coherence] Drift detected in runtime state', {
        userId,
        driftFields: checks.filter((c) => !c.match).map((c) => c.field),
      });
    }

    return report;
  },

  /**
   * Validate all active users' runtime states
   * Returns summary statistics
   */
  async validateAll(limit = 100): Promise<{
    totalChecked: number;
    totalValid: number;
    totalDrifted: number;
    driftedUsers: string[];
  }> {
    const { UnifiedRuntimeState } = await import('../../db/models/unifiedRuntimeState.model.js');
    const states = await UnifiedRuntimeState.find({})
      .select('userId')
      .limit(limit)
      .lean();

    let totalValid = 0;
    let totalDrifted = 0;
    const driftedUsers: string[] = [];

    for (const state of states) {
      try {
        const report = await this.validate(state.userId.toString());
        if (report.valid) {
          totalValid++;
        } else {
          totalDrifted++;
          driftedUsers.push(state.userId.toString());
        }
      } catch (error) {
        logger.error('[coherence] Validation failed for user', {
          userId: state.userId.toString(),
          error,
        });
        totalDrifted++;
        driftedUsers.push(state.userId.toString());
      }
    }

    return {
      totalChecked: states.length,
      totalValid,
      totalDrifted,
      driftedUsers,
    };
  },

  /**
   * Clear validation cache for a user
   */
  async invalidateCache(userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`coherence:validation:${userId}`);
  },
};

export default coherenceValidation;
