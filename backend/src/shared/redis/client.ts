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
      }
    : {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        // BullMQ requires this to be null for blocking connections.
        maxRetriesPerRequest: null,
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
    const parsed = new URL(redisUrl);
    _client = new Redis({
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      ...redisConfig as Record<string, unknown>,
    });
  } else {
    _client = new Redis(redisConfig as Record<string, unknown>);
  }

  _client.on('connect', () => {
    logger.info('[redis] Connected', {
      event: 'redis_connected',
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    });
    _connecting = false;
  });

  _client.on('ready', () => {
    logger.info('[redis] Ready', {
      event: 'redis_ready',
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    });
  });

  _client.on('error', (err: Error) => {
    logger.error('[redis] Error', err, {
      event: 'redis_error',
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
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