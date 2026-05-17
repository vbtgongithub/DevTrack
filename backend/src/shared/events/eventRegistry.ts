// src/shared/events/eventRegistry.ts — Event versioning system
// All emitted events must support schema evolution

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
  version: number;
  type: EventType;
  timestamp: string;
  userId?: string;
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
  userId?: string
): BaseEvent<T> {
  return {
    version: EVENT_VERSION,
    type,
    timestamp: new Date().toISOString(),
    userId,
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

const logger = {
  warn: (message: string, meta: Record<string, unknown>) => {
    console.warn(`[events] ${message}`, meta);
  },
};

export default {
  EVENT_VERSION,
  createEvent,
  validateEvent,
  EVENT_SCHEMA_REGISTRY,
};