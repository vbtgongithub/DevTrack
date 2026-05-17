// src/modules/replay/snapshot.service.ts — Snapshot + Checkpoint Replay System
// Phase-B: Periodic snapshots, replay checkpoints, incremental rebuild

import { Types } from 'mongoose';
import { UserXp, UserAnalytics, UserStreakLog } from '../../db/models/index.js';
import { getRedisClient } from '../../shared/redis/client.js';
import { logger } from '../../shared/logger.js';

// Snapshot types
export interface AnalyticsSnapshot {
  id: string;
  userId: string;
  snapshotType: 'daily' | 'weekly' | 'monthly';
  snapshotDate: Date;

  // XP state
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  lifetimeStats: {
    totalProblemsSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalContests: number;
    dailyStreaks: number;
    longestStreak: number;
    totalSyncs: number;
  };

  // Streak state
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: Date | null;

  // Analytics state
  dsaSolveCount: number;
  weeklyConsistencyScore: number;

  // Metadata
  createdAt: Date;
  version: number;
}

const SNAPSHOT_KEY_PREFIX = 'snapshot:analytics';
const CHECKPOINT_KEY_PREFIX = 'checkpoint:replay';

export const snapshotService = {
  // ─── Create daily snapshot ───────────────────────────────────────────
  async createDailySnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    const userObjId = new Types.ObjectId(userId);

    const [userXp, analytics, streakLogs] = await Promise.all([
      UserXp.findOne({ userId: userObjId }),
      UserAnalytics.findOne({ userId: userObjId }),
      UserStreakLog.find({ userId: userObjId }).sort({ date: -1 }).limit(30),
    ]);

    if (!userXp) return null;

    const snapshot: AnalyticsSnapshot = {
      id: `snapshot_${userId}_${Date.now()}`,
      userId,
      snapshotType: 'daily',
      snapshotDate: new Date(),

      totalXp: userXp.totalXp,
      currentLevel: userXp.currentLevel,
      xpToNextLevel: userXp.xpToNextLevel,
      lifetimeStats: userXp.lifetimeStats || {
        totalProblemsSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
        totalContests: 0,
        dailyStreaks: 0,
        longestStreak: 0,
        totalSyncs: 0,
      },

      currentStreak: analytics?.currentStreak || 0,
      bestStreak: analytics?.bestStreak || 0,
      lastActiveDate: analytics?.lastActiveDate || null,

      dsaSolveCount: analytics?.dsaSolveCount || 0,
      weeklyConsistencyScore: analytics?.weeklyConsistencyScore || 0,

      createdAt: new Date(),
      version: 1,
    };

    // Store in Redis with 90-day TTL
    const redis = getRedisClient();
    const key = `${SNAPSHOT_KEY_PREFIX}:${userId}:daily:${snapshot.snapshotDate.toISOString().split('T')[0]}`;
    await redis.set(key, JSON.stringify(snapshot), 'EX', 90 * 24 * 60 * 60);

    // Store latest reference
    const latestKey = `${SNAPSHOT_KEY_PREFIX}:${userId}:latest`;
    await redis.set(latestKey, key, 'EX', 90 * 24 * 60 * 60);

    logger.debug('[snapshot] Daily snapshot created', { userId, key });

    return snapshot;
  },

  // ─── Get latest snapshot ─────────────────────────────────────────────
  async getLatestSnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    const redis = getRedisClient();
    const latestKey = `${SNAPSHOT_KEY_PREFIX}:${userId}:latest`;

    const key = await redis.get(latestKey);
    if (!key) return null;

    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  // ─── Create replay checkpoint ─────────────────────────────────────────
  async createCheckpoint(
    replayId: string,
    userId: string,
    checkpointType: 'start' | 'milestone' | 'end',
    progress: number,
    data: Record<string, unknown>
  ): Promise<void> {
    const redis = getRedisClient();
    const key = `${CHECKPOINT_KEY_PREFIX}:${replayId}:${checkpointType}`;

    const checkpoint = {
      replayId,
      userId,
      checkpointType,
      progress,
      data,
      createdAt: Date.now(),
    };

    await redis.set(key, JSON.stringify(checkpoint), 'EX', 7 * 24 * 60 * 60); // 7 days

    // Update checkpoint index
    const indexKey = `${CHECKPOINT_KEY_PREFIX}:${replayId}:index`;
    await redis.zadd(indexKey, progress, checkpointType);

    logger.debug('[snapshot] Checkpoint created', { replayId, checkpointType, progress });
  },

  // ─── Get checkpoint for replay ───────────────────────────────────────
  async getCheckpoint(
    replayId: string,
    checkpointType: string
  ): Promise<{ progress: number; data: Record<string, unknown> } | null> {
    const redis = getRedisClient();
    const key = `${CHECKPOINT_KEY_PREFIX}:${replayId}:${checkpointType}`;

    const data = await redis.get(key);
    if (!data) return null;

    const checkpoint = JSON.parse(data);
    return { progress: checkpoint.progress, data: checkpoint.data };
  },

  // ─── Increment replay from checkpoint ───────────────────────────────
  async incrementalReplay(
    userId: string,
    fromCheckpoint?: string
  ): Promise<{ processed: number; checkpoint: string }> {
    const redis = getRedisClient();

    // Get start point (from checkpoint or earliest unsynced activity)
    let startDate: Date;

    if (fromCheckpoint) {
      const checkpoint = await this.getCheckpoint(userId, fromCheckpoint);
      if (checkpoint) {
        startDate = new Date(checkpoint.data.lastProcessedDate as any);
      } else {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
      }
    } else {
      // Default to 30 days ago
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get unsynced activities
    const activities = await import('../../db/models/index.js').then((m) =>
      m.ActivityEvent.find({
        userId: new Types.ObjectId(userId),
        occurredAt: { $gte: startDate },
      }).sort({ occurredAt: 1 })
    );

    // Process incrementally
    let processed = 0;
    for (const activity of activities) {
      // Process each activity (simplified)
      processed++;

      // Create milestone checkpoint every 100 items
      if (processed % 100 === 0) {
        await this.createCheckpoint(
          `replay_${userId}`,
          userId,
          'milestone',
          processed,
          { lastProcessedDate: activity.occurredAt.toISOString() }
        );
      }
    }

    // Create end checkpoint
    await this.createCheckpoint(
      `replay_${userId}`,
      userId,
      'end',
      processed,
      { completedAt: new Date().toISOString() }
    );

    return { processed, checkpoint: 'end' };
  },

  // ─── Snapshot integrity validation ───────────────────────────────────
  async validateSnapshotIntegrity(snapshot: AnalyticsSnapshot): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check required fields
    if (!snapshot.userId) issues.push('Missing userId');
    if (!snapshot.snapshotDate) issues.push('Missing snapshotDate');
    if (snapshot.totalXp < 0) issues.push('Invalid totalXp');

    // Cross-check with current database state
    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(snapshot.userId) });
    if (userXp && Math.abs(userXp.totalXp - snapshot.totalXp) > 100) {
      issues.push('XP mismatch with database');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },

  // ─── Corruption rollback support ───────────────────────────────────
  async rollbackToSnapshot(userId: string, snapshotId: string): Promise<{
    success: boolean;
    rolledBack: boolean;
  }> {
    // In a real implementation, this would:
    // 1. Validate snapshot integrity
    // 2. Create backup of current state
    // 3. Restore from snapshot
    // 4. Verify restoration

    logger.warn('[snapshot] Rollback requested', { userId, snapshotId });

    return { success: false, rolledBack: false };
  },

  // ─── Partial rebuild from snapshots ─────────────────────────────────
  async partialRebuild(
    userId: string,
    components: ('xp' | 'streak' | 'analytics')[]
  ): Promise<{ success: boolean; rebuilt: string[] }> {
    const snapshot = await this.getLatestSnapshot(userId);

    if (!snapshot) {
      return { success: false, rebuilt: [] };
    }

    const rebuilt: string[] = [];
    const userObjId = new Types.ObjectId(userId);

    // Rebuild requested components
    for (const component of components) {
      switch (component) {
        case 'xp':
          await UserXp.findOneAndUpdate(
            { userId: userObjId },
            {
              $set: {
                totalXp: snapshot.totalXp,
                currentLevel: snapshot.currentLevel,
                xpToNextLevel: snapshot.xpToNextLevel,
                lifetimeStats: snapshot.lifetimeStats,
              },
            },
            { upsert: true }
          );
          rebuilt.push('xp');
          break;

        case 'streak':
          await UserAnalytics.findOneAndUpdate(
            { userId: userObjId },
            {
              $set: {
                currentStreak: snapshot.currentStreak,
                bestStreak: snapshot.bestStreak,
                lastActiveDate: snapshot.lastActiveDate,
              },
            },
            { upsert: true }
          );
          rebuilt.push('streak');
          break;

        case 'analytics':
          await UserAnalytics.findOneAndUpdate(
            { userId: userObjId },
            {
              $set: {
                totalXp: snapshot.totalXp,
                currentLevel: snapshot.currentLevel,
                dsaSolveCount: snapshot.dsaSolveCount,
                weeklyConsistencyScore: snapshot.weeklyConsistencyScore,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
          rebuilt.push('analytics');
          break;
      }
    }

    logger.info('[snapshot] Partial rebuild completed', { userId, components: rebuilt });

    return { success: true, rebuilt };
  },

  // ─── Scheduled snapshot creation for all active users ──────────────
  async createScheduledSnapshots(): Promise<{ created: number; errors: number }> {
    // Get active users (users with activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeUsers = await UserAnalytics.find({
      lastActiveDate: { $gte: sevenDaysAgo },
    }).limit(1000);

    let created = 0;
    let errors = 0;

    for (const analytics of activeUsers) {
      try {
        await this.createDailySnapshot(analytics.userId.toString());
        created++;
      } catch (err) {
        logger.error('[snapshot] Failed to create snapshot', { userId: analytics.userId, error: err });
        errors++;
      }
    }

    logger.info('[snapshot] Scheduled snapshots completed', { created, errors });

    return { created, errors };
  },
};

export default snapshotService;