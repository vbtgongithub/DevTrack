// src/modules/leaderboard/leaderboard.service.ts — Advanced Leaderboard Engine
// Phase-B: Production-grade leaderboard infrastructure

import { getRedisClient } from '../../shared/redis/client.js';
import { logger } from '../../shared/logger.js';
import { UserXp, UserAnalytics } from '../../db/models/index.js';

// Leaderboard key prefixes
const LEADERBOARD_KEYS = {
  global: 'leaderboard:global',
  weekly: 'leaderboard:weekly',
  monthly: 'leaderboard:monthly',
  friends: 'leaderboard:friends', // placeholder
  organization: 'leaderboard:org', // placeholder
} as const;

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  streak: number;
  trustScore: number;
}

// Trust-weighted ranking adjustments
const TRUST_WEIGHT = 0.2; // 20% trust score influence

export const leaderboardService = {
  // ─── Update user position ───────────────────────────────────────────
  async updateUserPosition(
    userId: string,
    xp: number,
    level: number,
    streak: number,
    trustScore: number
  ): Promise<void> {
    const redis = getRedisClient();
    const pipe = redis.pipeline();

    // Calculate weighted score
    const weightedScore = this.calculateWeightedScore(xp, trustScore);

    // Update all leaderboards
    pipe.zadd(LEADERBOARD_KEYS.global, weightedScore, userId);
    pipe.zadd(LEADERBOARD_KEYS.weekly, weightedScore, userId);
    pipe.zadd(LEADERBOARD_KEYS.monthly, weightedScore, userId);

    // Store user metadata for quick retrieval
    const metaKey = `leaderboard:meta:${userId}`;
    pipe.hset(metaKey, {
      xp: String(xp),
      level: String(level),
      streak: String(streak),
      trustScore: String(trustScore),
      updatedAt: String(Date.now()),
    });
    pipe.expire(metaKey, 86400 * 30); // 30 days

    await pipe.exec();

    logger.debug('[leaderboard] Position updated', { userId, xp, weightedScore });
  },

  // Calculate trust-weighted score
  calculateWeightedScore(xp: number, trustScore: number): number {
    // Normalize trust score (0-100) to (0.5-1.0) range
    const normalizedTrust = 0.5 + (trustScore / 100) * 0.5;
    return xp * normalizedTrust;
  },

  // ─── Get leaderboard rankings ────────────────────────────────────────
  async getLeaderboard(
    type: 'global' | 'weekly' | 'monthly',
    start = 0,
    end = 99,
    includeTrustScore = true
  ): Promise<LeaderboardEntry[]> {
    const redis = getRedisClient();
    const key = LEADERBOARD_KEYS[type];

    // Get top users by score
    const results = await redis.zrevrange(key, start, end, 'WITHSCORES');

    if (results.length === 0) {
      return [];
    }

    // Parse results into entries
    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const score = parseFloat(results[i + 1]);

      // Get user metadata
      const metaKey = `leaderboard:meta:${userId}`;
      const meta = await redis.hgetall(metaKey);

      // Get user profile
      const { User } = await import('../../db/models/index.js');
      const user = await User.findById(userId).select('username displayName avatarUrl');

      if (user) {
        entries.push({
          rank: start + Math.floor(i / 2) + 1,
          userId,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          xp: parseInt(meta.xp || '0', 10),
          level: parseInt(meta.level || '1', 10),
          streak: parseInt(meta.streak || '0', 10),
          trustScore: includeTrustScore ? parseFloat(meta.trustScore || '100') : 100,
        });
      }
    }

    return entries;
  },

  // ─── Get user rank ────────────────────────────────────────────────────
  async getUserRank(userId: string, type: 'global' | 'weekly' | 'monthly'): Promise<number> {
    const redis = getRedisClient();
    const key = LEADERBOARD_KEYS[type];

    const rank = await redis.zrevrank(key, userId);
    return rank !== null ? rank + 1 : 0;
  },

  // ─── Get rank with score ──────────────────────────────────────────────
  async getUserRankWithScore(
    userId: string,
    type: 'global' | 'weekly' | 'monthly'
  ): Promise<{ rank: number; score: number }> {
    const redis = getRedisClient();
    const key = LEADERBOARD_KEYS[type];

    const [rank, score] = await Promise.all([
      redis.zrevrank(key, userId),
      redis.zscore(key, userId),
    ]);

    return {
      rank: rank !== null ? rank + 1 : 0,
      score: score ? parseFloat(score) : 0,
    };
  },

  // ─── Anti-cheat filtering ──────────────────────────────────────────────
  async filterCheaters(entries: LeaderboardEntry[]): Promise<LeaderboardEntry[]> {
    const suspiciousUsers: string[] = [];

    // Check for suspicious patterns
    for (const entry of entries) {
      // Low trust score indicates potential abuse
      if (entry.trustScore < 50) {
        suspiciousUsers.push(entry.userId);
        logger.warn('[leaderboard] Suspicious user detected', {
          userId: entry.userId,
          trustScore: entry.trustScore,
        });
      }
    }

    // Return filtered entries (optionally exclude cheaters)
    return entries.map((entry) => ({
      ...entry,
      rank: entry.rank - suspiciousUsers.filter((u) => entry.userId !== u && suspiciousUsers.indexOf(u) < entries.indexOf(entry)).length,
    }));
  },

  // ─── Weekly/Monthly reset orchestration ───────────────────────────────
  async performScheduledReset(type: 'weekly' | 'monthly'): Promise<void> {
    const redis = getRedisClient();

    // Archive current leaderboard before reset
    const currentKey = type === 'weekly' ? LEADERBOARD_KEYS.weekly : LEADERBOARD_KEYS.monthly;
    const archiveKey = `leaderboard:archive:${type}:${Date.now()}`;

    // Copy current to archive
    const members = await redis.zrange(currentKey, 0, -1, 'WITHSCORES');
    if (members.length > 0) {
      for (let i = 0; i < members.length; i += 2) {
        await redis.zadd(archiveKey, parseFloat(members[i + 1]), members[i]);
      }
      await redis.expire(archiveKey, 86400 * 90); // Keep archives for 90 days
    }

    // Clear current leaderboard
    await redis.del(currentKey);

    logger.info(`[leaderboard] ${type} reset completed`, { archiveKey });
  },

  // ─── Snapshot preservation ───────────────────────────────────────────
  async createSnapshot(type: 'global' | 'weekly' | 'monthly'): Promise<void> {
    const redis = getRedisClient();
    const sourceKey = LEADERBOARD_KEYS[type];
    const snapshotKey = `leaderboard:snapshot:${type}:${Date.now()}`;

    const members = await redis.zrange(sourceKey, 0, -1, 'WITHSCORES');
    if (members.length > 0) {
      const args: (string | number)[] = [];
      for (let i = 0; i < members.length; i += 2) {
        args.push(parseFloat(members[i + 1]), members[i]);
      }
      await redis.zadd(snapshotKey, ...args as any);
      await redis.expire(snapshotKey, 86400 * 365); // Keep snapshots for 1 year

      logger.info('[leaderboard] Snapshot created', { type, snapshotKey });
    }
  },

  // ─── Historical archive access ───────────────────────────────────────
  async getHistoricalLeaderboard(
    type: 'weekly' | 'monthly',
    timestamp: number
  ): Promise<LeaderboardEntry[]> {
    const redis = getRedisClient();
    const archiveKey = `leaderboard:archive:${type}:${timestamp}`;

    const results = await redis.zrevrange(archiveKey, 0, 99, 'WITHSCORES');

    if (results.length === 0) {
      return [];
    }

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < results.length; i += 2) {
      const userId = results[i];
      const metaKey = `leaderboard:meta:${userId}`;
      const meta = await redis.hgetall(metaKey);

      entries.push({
        rank: Math.floor(i / 2) + 1,
        userId,
        username: meta.username || 'Unknown',
        displayName: meta.displayName || 'Unknown',
        avatarUrl: meta.avatarUrl || null,
        xp: parseInt(meta.xp || '0', 10),
        level: parseInt(meta.level || '1', 10),
        streak: parseInt(meta.streak || '0', 10),
        trustScore: parseFloat(meta.trustScore || '100'),
      });
    }

    return entries;
  },

  // ─── Rebuild from database ───────────────────────────────────────────
  async rebuildFromDatabase(): Promise<void> {
    logger.info('[leaderboard] Starting full rebuild from database');

    // Get all users with XP
    const users = await UserXp.find({}).sort({ totalXp: -1 }).limit(1000);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      // Get trust score (placeholder - would come from trust service)
      const trustScore = 100;

      // Get streak
      const analytics = await UserAnalytics.findOne({ userId: user.userId });
      const streak = analytics?.currentStreak || 0;

      await this.updateUserPosition(
        user.userId.toString(),
        user.totalXp,
        user.currentLevel,
        streak,
        trustScore
      );
    }

    logger.info('[leaderboard] Full rebuild completed', { userCount: users.length });
  },

  // ─── Get leaderboard around user ─────────────────────────────────────
  async getLeaderboardAroundUser(
    userId: string,
    type: 'global' | 'weekly' | 'monthly',
    range = 5
  ): Promise<LeaderboardEntry[]> {
    const redis = getRedisClient();
    const key = LEADERBOARD_KEYS[type];

    const userRank = await redis.zrevrank(key, userId);
    if (userRank === null) {
      return this.getLeaderboard(type, 0, range * 2);
    }

    const start = Math.max(0, userRank - range);
    const end = userRank + range;

    const entries = await this.getLeaderboard(type, start, end);

    // Adjust ranks to be relative to user's position
    return entries.map((entry, index) => ({
      ...entry,
      rank: start + index + 1,
    }));
  },
};

export default leaderboardService;