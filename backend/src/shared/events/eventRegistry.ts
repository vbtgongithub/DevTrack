// src/shared/events/eventRegistry.ts — Event versioning and central in-memory subscription bus
// All emitted events support schema evolution, Redis Streams replication, and replay capabilities

import { logger } from '../logger.js';
import { getRedisClient } from '../redis/index.js';

export const EVENT_VERSION = 1;

export type EventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'new_submission'
  | 'xp_updated'
  | 'level_up'
  | 'streak_milestone'
  | 'badge_earned'
  | 'heartbeat';

// Base event structure
export interface BaseEvent<T = unknown> {
  id?: string;
  version: number;
  type: EventType;
  timestamp: string;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  payload: T;
}

// Event payload schemas
export interface SyncStartedPayload {
  platform: string;
  requestId?: string;
}

export interface SyncCompletedPayload {
  platform: string;
  stats: {
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    rating?: number;
    totalContests?: number;
    ingested?: number;
    successCount?: number;
    failedCount?: number;
  };
  requestId?: string;
}

export interface SyncFailedPayload {
  platform: string;
  error: string;
  requestId?: string;
}

export interface NewSubmissionPayload {
  platform: string;
  problemId: string;
  status: string;
  difficulty?: string;
  requestId?: string;
}

export interface XpUpdatedPayload {
  totalXp: number;
  gainedXp: number;
  currentLevel: number;
  nextLevelXp: number;
  sourceType?: string;
}

export interface LevelUpPayload {
  newLevel: number;
  totalXp: number;
  previousLevel: number;
}

export interface StreakMilestonePayload {
  streakDays: number;
  streakType: 'dsa' | 'github' | 'unified';
  previousBest: number;
}

export interface BadgeEarnedPayload {
  badgeId: string;
  badgeName: string;
  badgeCategory: string;
}

export interface HeartbeatPayload {
  serverTime: string;
}

// Event factory functions
export function createEvent<T>(
  type: EventType,
  payload: T,
  userId?: string,
  correlationId?: string
): BaseEvent<T> {
  const crypto = require('crypto');
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  return {
    id,
    version: EVENT_VERSION,
    type,
    timestamp: new Date().toISOString(),
    userId,
    correlationId: correlationId || id,
    causationId: id,
    payload,
  };
}

// Event validator with backward compatibility
export function validateEvent<T>(event: unknown, type: EventType): BaseEvent<T> | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const e = event as Record<string, unknown>;

  // Version check (supports older versions with migration)
  const version = e.version as number | undefined;
  if (version === undefined || version > EVENT_VERSION) {
    logger.warn('[events] Unsupported event version', { type, version });
    return null;
  }

  // Migrate older versions if needed
  if (version < EVENT_VERSION) {
    return migrateEvent(e as unknown as BaseEvent<T>, version);
  }

  // Type validation
  if (e.type !== type) {
    return null;
  }

  // Payload validation
  if (!e.payload || typeof e.payload !== 'object') {
    return null;
  }

  return event as BaseEvent<T>;
}

// Event migration strategy for backward compatibility
function migrateEvent<T>(event: BaseEvent<T>, fromVersion: number): BaseEvent<T> {
  // Migration from v0 to v1: add version field if missing
  if (fromVersion === 0) {
    return {
      ...event,
      version: 1,
    };
  }

  return event;
}

// Event schema registry for documentation
export const EVENT_SCHEMA_REGISTRY: Record<EventType, {
  version: number;
  description: string;
  payloadSchema: string;
}> = {
  sync_started: {
    version: 1,
    description: 'Platform sync operation started',
    payloadSchema: '{ platform: string, requestId?: string }',
  },
  sync_completed: {
    version: 1,
    description: 'Platform sync operation completed',
    payloadSchema: '{ platform: string, stats: { ... } }',
  },
  sync_failed: {
    version: 1,
    description: 'Platform sync operation failed',
    payloadSchema: '{ platform: string, error: string }',
  },
  new_submission: {
    version: 1,
    description: 'New submission received from platform',
    payloadSchema: '{ platform: string, problemId: string, status: string }',
  },
  xp_updated: {
    version: 1,
    description: 'User XP has been updated',
    payloadSchema: '{ totalXp: number, gainedXp: number, currentLevel: number, nextLevelXp: number }',
  },
  level_up: {
    version: 1,
    description: 'User leveled up',
    payloadSchema: '{ newLevel: number, totalXp: number, previousLevel: number }',
  },
  streak_milestone: {
    version: 1,
    description: 'User achieved streak milestone',
    payloadSchema: '{ streakDays: number, streakType: string, previousBest: number }',
  },
  badge_earned: {
    version: 1,
    description: 'User earned a badge',
    payloadSchema: '{ badgeId: string, badgeName: string, badgeCategory: string }',
  },
  heartbeat: {
    version: 1,
    description: 'Server heartbeat for connection keep-alive',
    payloadSchema: '{ serverTime: string }',
  },
};

// ---------------------------------------------------------------------------
// EventRegistry: Centralized PubSub and Persistent Store (Redis Streams)
// ---------------------------------------------------------------------------

export type EventCallback<T extends EventType = EventType, P = any> = (
  event: BaseEvent<P>
) => Promise<void> | void;

class EventRegistryClass {
  private handlers = new Map<string, Set<EventCallback>>();

  // Register a subscriber for a given event type
  subscribe<T extends EventType>(type: T, callback: EventCallback<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(callback);

    logger.debug('[event-registry] Subscribed to event type', { type });

    return () => {
      const typeHandlers = this.handlers.get(type);
      if (typeHandlers) {
        typeHandlers.delete(callback);
        if (typeHandlers.size === 0) {
          this.handlers.delete(type);
        }
      }
      logger.debug('[event-registry] Unsubscribed from event type', { type });
    };
  }

  // Publish an event to registered callbacks and Redis Streams for persistence
  async publish<T extends EventType>(event: BaseEvent<T>): Promise<void> {
    const { id, type, version, userId, correlationId } = event;

    logger.info('[event-registry] Publishing event', {
      eventId: id,
      type,
      version,
      userId,
      correlationId,
    });

    // Append to Redis Streams for system auditing and replay reliability
    try {
      const redis = getRedisClient();
      await redis.xadd(
        'devtrack:events:stream',
        '*',
        'id', id || '',
        'type', type,
        'version', String(version),
        'userId', userId || '',
        'correlationId', correlationId || '',
        'timestamp', event.timestamp,
        'payload', JSON.stringify(event.payload)
      );
      // Retain the last 100k events to bound Redis memory growth
      await redis.xtrim('devtrack:events:stream', 'MAXLEN', '~', 100000);
    } catch (redisErr) {
      logger.error('[event-registry] Failed to append event to Redis stream', redisErr, { eventId: id });
    }

    // Trigger registered subscribers
    const callbacks = this.handlers.get(type);
    if (callbacks && callbacks.size > 0) {
      for (const callback of callbacks) {
        try {
          await callback(event);
        } catch (err) {
          logger.error('[event-registry] Subscriber execution failed', err, {
            eventId: id,
            type,
            userId,
          });
        }
      }
    }
  }

  // Replay events starting from a specific timeframe
  async replayEvents(
    since: Date,
    onEvent: (event: BaseEvent) => Promise<void>
  ): Promise<number> {
    const redis = getRedisClient();
    const startTimeMs = since.getTime();
    logger.info('[event-registry] Replaying events from stream', { since: since.toISOString() });

    let count = 0;
    const results = await redis.xrange('devtrack:events:stream', String(startTimeMs), '+');

    for (const entry of results) {
      try {
        const fields = entry[1];
        let id = '';
        let type = '' as EventType;
        let version = 1;
        let userId = '';
        let correlationId = '';
        let timestamp = '';
        let payload = {};

        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          const val = fields[i + 1];
          if (key === 'id') id = val;
          else if (key === 'type') type = val as EventType;
          else if (key === 'version') version = parseInt(val, 10);
          else if (key === 'userId') userId = val;
          else if (key === 'correlationId') correlationId = val;
          else if (key === 'timestamp') timestamp = val;
          else if (key === 'payload') payload = JSON.parse(val);
        }

        const envelope: BaseEvent = {
          id,
          version,
          type,
          timestamp,
          userId: userId || undefined,
          correlationId: correlationId || undefined,
          causationId: id,
          payload,
        };

        await onEvent(envelope);
        count++;
      } catch (err) {
        logger.error('[event-registry] Failed parsing event entry during replay', err);
      }
    }

    logger.info('[event-registry] Event replay finished', { count });
    return count;
  }
}

export const eventRegistry = new EventRegistryClass();

export default {
  EVENT_VERSION,
  createEvent,
  validateEvent,
  EVENT_SCHEMA_REGISTRY,
  eventRegistry,
};