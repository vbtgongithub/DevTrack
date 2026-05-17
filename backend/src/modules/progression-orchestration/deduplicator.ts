// src/modules/progression-orchestration/deduplicator.ts
// Redis-backed deduplication layer. Ensures all activity is ingested exactly once.
// Prevents duplicate XP awards, double streak increments, and replay inflation attacks.

import { getRedisClient } from '../../shared/redis/index.js';
import { logger } from '../../shared/logger.js';
import type { CanonicalActivity } from './activityEvent.js';

const DEDUPE_KEY_PREFIX = 'devtrack:dedupe:activity';
const CHECKPOINT_KEY_PREFIX = 'devtrack:checkpoint:orchestration';
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30-day deduplication window

export class IngestionDeduplicator {
  /**
   * Generates a unique, deterministic deduplication key for an activity.
   */
  getDedupeKey(provider: string, userId: string, providerEventId: string): string {
    return `${DEDUPE_KEY_PREFIX}:${provider}:${userId}:${providerEventId}`;
  }

  /**
   * Attempts to acquire deduplication lock.
   * Returns true if this is the first time we see the event, false otherwise.
   */
  async isUniqueAndRegister(activity: CanonicalActivity, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<boolean> {
    const redis = getRedisClient();
    const key = this.getDedupeKey(activity.provider, activity.userId, activity.providerEventId);
    
    // Set NX (Not Exists) with a TTL
    const acquired = await redis.set(
      key,
      JSON.stringify({
        activityId: activity.activityId,
        ingestedAt: activity.audit.ingestedAt,
        traceId: activity.traceContext.traceId,
      }),
      'EX',
      ttlSeconds,
      'NX'
    );

    const isNew = acquired === 'OK';
    if (!isNew) {
      logger.info('[deduplicator] Duplicate activity detected and blocked', {
        provider: activity.provider,
        providerEventId: activity.providerEventId,
        userId: activity.userId,
        traceId: activity.traceContext.traceId,
      });
    }
    return isNew;
  }

  /**
   * Check if a specific step in the progression saga has been checkpointed.
   * Prevents re-running parts of the progression pipeline in case of worker crashes.
   */
  async isStepCheckpointed(activityId: string, stepName: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `${CHECKPOINT_KEY_PREFIX}:${activityId}:${stepName}`;
    const value = await redis.get(key);
    return value !== null;
  }

  /**
   * Checkpoints a step in the orchestration flow.
   */
  async checkpointStep(activityId: string, stepName: string, payload: Record<string, unknown>, ttlSeconds = 7 * 24 * 60 * 60): Promise<void> {
    const redis = getRedisClient();
    const key = `${CHECKPOINT_KEY_PREFIX}:${activityId}:${stepName}`;
    await redis.set(key, JSON.stringify({ ...payload, timestamp: Date.now() }), 'EX', ttlSeconds);
  }

  /**
   * Retrieve a previous step's checkpoint data (useful for rolling back or completing state).
   */
  async getStepCheckpoint(activityId: string, stepName: string): Promise<Record<string, unknown> | null> {
    const redis = getRedisClient();
    const key = `${CHECKPOINT_KEY_PREFIX}:${activityId}:${stepName}`;
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

export const deduplicator = new IngestionDeduplicator();
