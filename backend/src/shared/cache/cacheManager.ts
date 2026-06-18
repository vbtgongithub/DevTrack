// src/shared/cache/cacheManager.ts — Cache lifecycle management
// Phase-1 Hardening: Cache invalidation guarantees

import { getRedisClient } from '../redis/client.js';
import { logger } from '../logger.js';

const DEFAULT_TTL = 300; // 5 minutes
const STALE_TTL = 60; // 1 minute for stale data

// Cache key patterns
const CACHE_KEYS = {
  userAnalytics: (userId: string) => `cache:analytics:${userId}`,
  userStreak: (userId: string) => `cache:streak:${userId}`,
  userXp: (userId: string) => `cache:xp:${userId}`,
  dashboard: (userId: string) => `cache:dashboard:${userId}`,
  leaderboard: (type: string) => `cache:leaderboard:${type}`,
} as const;

// Cache stampede protection
const IN_FLIGHT_KEYS = new Map<string, Promise<unknown>>();

export const cacheManager = {
  // ─── Write-through invalidation ─────────────────────────────────────────
  // DB write succeeds first, then cache delete, next read repopulates

  async invalidateUserAnalytics(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip invalidation', { userId });
      return;
    }
    const key = CACHE_KEYS.userAnalytics(userId);

    await redis.del(key);
    logger.debug('[cache] Invalidated user analytics', { userId, key });
  },

  async invalidateUserStreak(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip invalidation', { userId });
      return;
    }
    const key = CACHE_KEYS.userStreak(userId);

    await redis.del(key);
    logger.debug('[cache] Invalidated user streak', { userId, key });
  },

  async invalidateUserXp(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip invalidation', { userId });
      return;
    }
    const key = CACHE_KEYS.userXp(userId);

    await redis.del(key);
    logger.debug('[cache] Invalidated user XP', { userId, key });
  },

  async invalidateDashboard(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip invalidation', { userId });
      return;
    }
    const key = CACHE_KEYS.dashboard(userId);

    await redis.del(key);
    logger.debug('[cache] Invalidated dashboard', { userId, key });
  },

  async invalidateAllUserCache(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip invalidation', { userId });
      return;
    }
    const patterns = [
      CACHE_KEYS.userAnalytics(userId),
      CACHE_KEYS.userStreak(userId),
      CACHE_KEYS.userXp(userId),
      CACHE_KEYS.dashboard(userId),
    ];

    await Promise.all(patterns.map((p) => redis.del(p)));
    logger.debug('[cache] Invalidated all user cache', { userId });
  },

  // ─── Read-through with stampede protection ─────────────────────────────
  // Prevents cache stampede (thundering herd) on cache miss

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = DEFAULT_TTL
  ): Promise<T> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, fetching directly from DB', { key });
      return await fetcher();
    }

    // Check if there's already an in-flight request for this key
    const inFlight = IN_FLIGHT_KEYS.get(key);
    if (inFlight) {
      return (await inFlight) as T;
    }

    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // Invalid JSON, fetch fresh
      }
    }

    // Create fetcher promise and store it
    const fetcherPromise = (async () => {
      try {
        const data = await fetcher();
        // Store in cache
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
        return data;
      } finally {
        IN_FLIGHT_KEYS.delete(key);
      }
    })();

    IN_FLIGHT_KEYS.set(key, fetcherPromise);

    return fetcherPromise;
  },

  // ─── Stale-while-revalidate pattern ─────────────────────────────────────
  // Return stale data immediately, refresh in background

  async getStale<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleTtl = STALE_TTL
  ): Promise<{ data: T | null; isStale: boolean }> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, fetching fresh stale data', { key });
      const data = await fetcher();
      return { data, isStale: false };
    }

    const cached = await redis.get(key);
    if (cached) {
      try {
        const data = JSON.parse(cached) as T;
        const ttl = await redis.ttl(key);

        // If TTL is very low, trigger background refresh
        if (ttl < 3 && ttl > 0) {
          // Fire and forget refresh
          this.getOrSet(key, fetcher, DEFAULT_TTL).catch((err) => {
            logger.warn('[cache] Background refresh failed', { key, error: err });
          });
        }

        return { data, isStale: ttl <= 0 };
      } catch {
        // Invalid cache, fetch fresh
      }
    }

    // No cache, fetch and cache
    const data = await this.getOrSet(key, fetcher, DEFAULT_TTL);
    return { data, isStale: false };
  },

  // ─── Cache warming ──────────────────────────────────────────────────────
  // Pre-populate cache for known users

  async warmUserCache(userId: string, data: Record<string, unknown>): Promise<void> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      logger.warn('[cache] Redis not ready, skip cache warm', { userId });
      return;
    }

    const pipeline = redis.pipeline();
    pipeline.set(CACHE_KEYS.userAnalytics(userId), JSON.stringify(data.analytics), 'EX', DEFAULT_TTL);
    pipeline.set(CACHE_KEYS.userStreak(userId), JSON.stringify(data.streak), 'EX', DEFAULT_TTL);
    pipeline.set(CACHE_KEYS.userXp(userId), JSON.stringify(data.xp), 'EX', DEFAULT_TTL);

    await pipeline.exec();
    logger.debug('[cache] Warmed user cache', { userId });
  },

  // ─── Cache statistics ───────────────────────────────────────────────────

  async getCacheStats(pattern: string): Promise<{ keys: number; memory: string }> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      return { keys: 0, memory: 'N/A' };
    }
    const keys = await redis.keys(pattern);

    return {
      keys: keys.length,
      memory: 'N/A', // Requires DEBUG OBJECT for memory estimation
    };
  },

  // ─── Health check ───────────────────────────────────────────────────────

  async healthCheck(): Promise<{ status: string; keys: number }> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      return { status: 'unhealthy', keys: 0 };
    }

    try {
      await redis.ping();
      const keys = (await redis.dbsize()) || 0;
      return { status: 'healthy', keys };
    } catch {
      return { status: 'unhealthy', keys: 0 };
    }
  },

  async cacheHealth(): Promise<any> {
    const redis = getRedisClient();
    if (redis.status !== 'ready') {
      return { status: 'unhealthy', error: 'Redis connection is not ready' };
    }
    try {
      const info = await redis.info();
      const dbSize = await redis.dbsize();
      
      const parseInfo = (str: string) => {
        const lines = str.split('\r\n');
        const parsed: Record<string, string> = {};
        for (const line of lines) {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            parsed[key] = value;
          }
        }
        return parsed;
      };

      const parsedInfo = parseInfo(info);
      const publicKeysCount = (await redis.keys('public_profile:*')).length;

      return {
        status: 'healthy',
        keys: dbSize,
        publicProfileKeys: publicKeysCount,
        memoryUsed: parsedInfo.used_memory_human,
        memoryFragmentationRatio: parsedInfo.mem_fragmentation_ratio,
        hitRate: 'N/A (Requires Redis monitoring)',
        uptime: parsedInfo.uptime_in_seconds,
        connectedClients: parsedInfo.connected_clients
      };
    } catch (e) {
      return { status: 'unhealthy', error: String(e) };
    }
  }
};

export default cacheManager;