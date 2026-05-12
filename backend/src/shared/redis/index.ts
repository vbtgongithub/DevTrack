// src/shared/redis/index.ts — Redis module barrel
export { getRedisClient, disconnectRedis, getRedisHealth } from './client.js';
export type { RedisHealth } from './client.js';