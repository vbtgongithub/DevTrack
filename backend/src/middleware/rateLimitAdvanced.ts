// src/middleware/rateLimitAdvanced.ts — Advanced rate limiting with Redis backend
// Phase-1 Hardening: Rate limiting layer

import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../shared/redis/client.js';
import { logger } from '../shared/logger.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  blockDurationMs: number;
  enableBurstHandling: boolean;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

// Default configurations per endpoint type
const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  sse: {
    windowMs: 60_000, // 1 minute
    maxRequests: 5, // Allow reconnects
    keyPrefix: 'rl:sse',
    blockDurationMs: 30_000,
    enableBurstHandling: true,
  },
  streak: {
    windowMs: 60_000,
    maxRequests: 30,
    keyPrefix: 'rl:streak',
    blockDurationMs: 60_000,
    enableBurstHandling: true,
  },
  sync: {
    windowMs: 300_000, // 5 minutes
    maxRequests: 10,
    keyPrefix: 'rl:sync',
    blockDurationMs: 120_000,
    enableBurstHandling: false,
  },
  xp: {
    windowMs: 60_000,
    maxRequests: 60,
    keyPrefix: 'rl:xp',
    blockDurationMs: 30_000,
    enableBurstHandling: true,
  },
  default: {
    windowMs: 60_000,
    maxRequests: 100,
    keyPrefix: 'rl:default',
    blockDurationMs: 30_000,
    enableBurstHandling: true,
  },
};

export function createRateLimiter(endpointType: string) {
  const config = ENDPOINT_CONFIGS[endpointType] || ENDPOINT_CONFIGS.default;

  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }

    const redis = getRedisClient();
    const identifier = getIdentifier(req);
    const now = Date.now();

    // Build rate limit key
    const key = `${config.keyPrefix}:${identifier}`;
    const blockKey = `${key}:blocked`;

    // Check if currently blocked
    const isBlocked = await redis.get(blockKey);
    if (isBlocked) {
      const ttl = await redis.ttl(blockKey);
      logger.warn('[rate-limit] Request blocked', {
        endpointType,
        identifier,
        blockTtlSeconds: ttl,
      });

      res.set('Retry-After', String(Math.ceil(ttl)));
      res.status(429).json({
        success: false,
        message: 'Too many requests. You have been temporarily blocked.',
        code: 'RATE_LIMIT_BLOCKED',
        retryAfter: Math.ceil(ttl),
      });
      return;
    }

    // Increment request count
    const currentCount = await redis.incr(key);

    // Set expiry on first request
    if (currentCount === 1) {
      await redis.pexpire(key, config.windowMs);
    }

    // Calculate reset time
    const ttl = await redis.ttl(key);
    const resetAt = now + (ttl > 0 ? ttl : config.windowMs);

    // Check if over limit
    if (currentCount > config.maxRequests) {
      // Block the user
      await redis.set(blockKey, '1', 'PX', config.blockDurationMs);

      logger.warn('[rate-limit] Rate limit exceeded, blocking', {
        endpointType,
        identifier,
        currentCount,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
      });

      res.set('Retry-After', String(Math.ceil(config.blockDurationMs / 1000)));
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
      });
      return;
    }

    // Add rate limit headers
    const remaining = Math.max(0, config.maxRequests - currentCount);
    res.set('X-RateLimit-Limit', String(config.maxRequests));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    // Log burst detection if enabled
    if (config.enableBurstHandling && currentCount > config.maxRequests * 0.8) {
      logger.info('[rate-limit] High request rate detected', {
        endpointType,
        identifier,
        currentCount,
        maxRequests: config.maxRequests,
        percentUsed: Math.round((currentCount / config.maxRequests) * 100),
      });
    }

    next();
  };
}

// Get identifier from request (IP + userId if authenticated)
function getIdentifier(req: Request): string {
  // Try to get user ID if authenticated
  const user = (req as unknown as { user?: { id?: string } }).user;
  const userId = user?.id;

  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip = req.ip || (req.socket as unknown as { remoteAddress?: string })?.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

// Pre-configured rate limiters for common endpoints
export const rateLimiters = {
  sse: createRateLimiter('sse'),
  streak: createRateLimiter('streak'),
  sync: createRateLimiter('sync'),
  xp: createRateLimiter('xp'),
  default: createRateLimiter('default'),
};

// Helper to check rate limit without middleware
export async function checkRateLimit(
  endpointType: string,
  identifier: string
): Promise<RateLimitResult> {
  const config = ENDPOINT_CONFIGS[endpointType] || ENDPOINT_CONFIGS.default;
  const redis = getRedisClient();

  const key = `${config.keyPrefix}:${identifier}`;
  const blockKey = `${key}:blocked`;

  const isBlocked = await redis.get(blockKey);
  if (isBlocked) {
    const ttl = await redis.ttl(blockKey);
    return {
      success: false,
      remaining: 0,
      resetAt: Date.now() + ttl,
      retryAfterMs: ttl * 1000,
    };
  }

  const currentCount = parseInt((await redis.get(key)) || '0', 10);
  const ttl = await redis.ttl(key);

  return {
    success: currentCount < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - currentCount),
    resetAt: Date.now() + (ttl > 0 ? ttl : config.windowMs),
  };
}