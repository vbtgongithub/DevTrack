// src/shared/redis/client.ts — Centralized Redis singleton via ioredis
// Manages connection lifecycle, reconnection, and health visibility.

import Redis from 'ioredis';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

let _client: Redis | null = null;
let _connecting = false;

export interface RedisHealth {
  status: 'disconnected' | 'connecting' | 'connected';
  host: string;
  port: number;
  lastError: string | null;
  reconnectAttempts: number;
}

export function getRedisClient(): Redis {
  // If REDIS_URL is not set, return a mock client that doesn't connect
  if (!env.REDIS_URL) {
    logger.warn('[redis] REDIS_URL not set - returning null client (Redis features disabled)');
    // Return a mock Redis instance that won't try to connect
    const mockClient = new Redis({
      host: 'localhost',
      port: 6379,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null, // Disable retries
    });
    // Prevent it from ever connecting
    mockClient.connect = () => Promise.reject(new Error('Redis disabled - REDIS_URL not set'));
    return mockClient;
  }

  if (_client && (_client.status === 'ready' || _client.status === 'connecting' || _client.status === 'wait')) {
    return _client;
  }

  if (_connecting) {
    // Already initializing — return whatever client exists, or create a non-connecting stub
    if (_client) return _client;
  }

  _connecting = true;

  const redisUrl = env.REDIS_URL;
  const redisConfig = redisUrl
    ? {
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
      }
    : {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy(times: number) {
          const delay = Math.min(times * 100, 3000);
          logger.warn('[redis] Reconnecting', { attempt: times, delayMs: delay });
          return delay;
        },
        reconnectOnError(err: Error) {
          const target = 'READONLY';
          return err.message.includes(target);
        },
      };

  if (redisUrl) {
    // Pass the full URL string to ioredis so it automatically handles the 'rediss://' TLS configuration
    _client = new Redis(redisUrl, {
      ...(redisConfig as Record<string, unknown>),
      family: 0, // Use IPv4/IPv6 dual-stack resolution, helpful in Docker
    });
  } else {
    _client = new Redis(redisConfig as Record<string, unknown>);
  }

  _client.on('connect', () => {
    logger.info('[redis] Connected', {
      event: 'redis_connected',
      host: _client?.options?.host || 'unknown',
      port: _client?.options?.port || 6379,
    });
    _connecting = false;
  });

  _client.on('ready', () => {
    logger.info('[redis] Ready', {
      event: 'redis_ready',
      host: _client?.options?.host || 'unknown',
      port: _client?.options?.port || 6379,
    });
  });

  _client.on('error', (err: Error) => {
    logger.error('[redis] Error', err, {
      event: 'redis_error',
      host: _client?.options?.host || 'unknown',
      port: _client?.options?.port || 6379,
    });
    _connecting = false;
  });

  _client.on('close', () => {
    logger.warn('[redis] Connection closed', { event: 'redis_closed' });
  });

  _client.on('reconnecting', () => {
    logger.info('[redis] Reconnecting', { event: 'redis_reconnecting' });
  });

  // Attempt connection (non-blocking)
  void _client.connect().catch((err) => {
    logger.warn('[redis] Initial connect failed (will retry)', {
      error: err instanceof Error ? err.message : String(err),
    });
    _connecting = false;
  });

  return _client;
}

export async function disconnectRedis(): Promise<void> {
  if (!_client) return;
  await _client.quit();
  _client = null;
  logger.info('[redis] Disconnected', { event: 'redis_disconnected' });
}

export function getRedisHealth(): RedisHealth {
  if (!_client) return { status: 'disconnected', host: env.REDIS_HOST, port: env.REDIS_PORT, lastError: null, reconnectAttempts: 0 };
  const statusMap: Record<string, 'connected' | 'connecting' | 'disconnected'> = {
    ready: 'connected',
    wait: 'connecting',
    close: 'disconnected',
    end: 'disconnected',
  };
  return {
    status: statusMap[_client.status] ?? 'disconnected',
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    lastError: null,
    reconnectAttempts: 0,
  };
}