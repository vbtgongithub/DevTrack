// src/shared/runtime/infrastructureRegistry.ts — Centralized infrastructure state tracking
// Singleton registry that tracks the health of all infrastructure subsystems.
// Read-only snapshots exposeable by health endpoints.

import { logger } from '../logger.js';
import type { RedisHealth } from '../redis/client.js';

// ---------------------------------------------------------------------------
// Subsystem health states
// ---------------------------------------------------------------------------

export type SubsystemStatus =
  | 'unknown'
  | 'initializing'
  | 'healthy'
  | 'degraded'
  | 'stopped'
  | 'failed';

export interface SubsystemState {
  status: SubsystemStatus;
  statusSince: number; // epoch ms
  error?: string;
  details?: Record<string, unknown>;
}

export interface InfrastructureState {
  api: SubsystemState;
  mongodb: SubsystemState;
  redis: SubsystemState;
  queues: SubsystemState;
  platformSyncWorker: SubsystemState;
  xpWorker: SubsystemState;
  scheduler: SubsystemState;
  sse: SubsystemState;
  degraded: boolean;
  degradedComponents: string[];
  startedAt: number;
  requestId?: string;
}

// ---------------------------------------------------------------------------
// Internal mutable store — lives outside any React/async context
// ---------------------------------------------------------------------------

interface RuntimeStore {
  api: SubsystemState;
  mongodb: SubsystemState;
  redis: SubsystemState;
  queues: SubsystemState;
  platformSyncWorker: SubsystemState;
  xpWorker: SubsystemState;
  scheduler: SubsystemState;
  sse: SubsystemState;
  startedAt: number;
}

const store: RuntimeStore = {
  api: { status: 'unknown', statusSince: Date.now() },
  mongodb: { status: 'unknown', statusSince: Date.now() },
  redis: { status: 'unknown', statusSince: Date.now() },
  queues: { status: 'unknown', statusSince: Date.now() },
  platformSyncWorker: { status: 'unknown', statusSince: Date.now() },
  xpWorker: { status: 'unknown', statusSince: Date.now() },
  scheduler: { status: 'unknown', statusSince: Date.now() },
  sse: { status: 'unknown', statusSince: Date.now() },
  startedAt: Date.now(),
};

// ---------------------------------------------------------------------------
// State update helpers
// ---------------------------------------------------------------------------

function updateSubsystem(
  key: keyof Omit<RuntimeStore, 'startedAt'>,
  status: SubsystemStatus,
  error?: string,
  details?: Record<string, unknown>
): void {
  const prev = store[key];
  const now = Date.now();

  if (prev.status !== status) {
    store[key] = { status, statusSince: now, error, details };
    emitLifecycleEvent(key, status, prev.status);
  } else if (error !== prev.error) {
    store[key] = { ...store[key], error, details };
  }
}

function emitLifecycleEvent(
  subsystem: string,
  newStatus: SubsystemStatus,
  prevStatus: SubsystemStatus
): void {
  const eventMap: Record<string, string> = {
    redis: newStatus === 'healthy' ? 'redis_connected' :
           newStatus === 'degraded' ? 'redis_degraded' :
           newStatus === 'failed' ? 'redis_disconnected' :
           prevStatus === 'healthy' ? 'redis_disconnected' : '',

    platformSyncWorker: newStatus === 'healthy' ? 'worker_started' :
                       newStatus === 'stopped' ? 'worker_stopped' : '',

    xpWorker: newStatus === 'healthy' ? 'xp_worker_started' :
              newStatus === 'stopped' ? 'xp_worker_stopped' : '',

    scheduler: newStatus === 'healthy' ? 'scheduler_resumed' :
               newStatus === 'stopped' ? 'scheduler_paused' : '',

    sse: newStatus === 'healthy' ? 'sse_connected' :
         newStatus === 'degraded' ? 'sse_degraded' : '',
  };

  const eventName = eventMap[subsystem];
  if (eventName) {
    logger.info(`[infrastructure] ${eventName}`, {
      event: eventName,
      subsystem,
      previousStatus: prevStatus,
      currentStatus: newStatus,
    });
  }

  // Emit degraded mode event when any critical subsystem fails
  if (newStatus === 'failed' || newStatus === 'degraded') {
    const degraded = isOverallDegraded();
    if (degraded) {
      logger.warn('[infrastructure] degraded_mode_entered', {
        event: 'degraded_mode_entered',
        subsystem,
        degradedComponents: getDegradedComponents(),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export function getInfrastructureState(): InfrastructureState {
  const degraded = isOverallDegraded();
  return {
    api: store.api,
    mongodb: store.mongodb,
    redis: store.redis,
    queues: store.queues,
    platformSyncWorker: store.platformSyncWorker,
    xpWorker: store.xpWorker,
    scheduler: store.scheduler,
    sse: store.sse,
    degraded,
    degradedComponents: getDegradedComponents(),
    startedAt: store.startedAt,
  };
}

function isOverallDegraded(): boolean {
  const criticalHealthy = [
    store.api.status === 'healthy' || store.api.status === 'unknown',
    store.mongodb.status === 'healthy',
  ];

  const optionalDegraded = [
    store.redis.status === 'degraded' || store.redis.status === 'stopped' || store.redis.status === 'failed',
    store.queues.status === 'degraded' || store.queues.status === 'stopped' || store.queues.status === 'failed',
    store.platformSyncWorker.status === 'degraded' || store.platformSyncWorker.status === 'stopped',
    store.xpWorker.status === 'degraded' || store.xpWorker.status === 'stopped',
    store.scheduler.status === 'degraded' || store.scheduler.status === 'stopped',
  ];

  return !criticalHealthy.every(Boolean) || optionalDegraded.some(Boolean);
}

function getDegradedComponents(): string[] {
  const degraded: string[] = [];
  const subsystems: (keyof Omit<RuntimeStore, 'startedAt'>)[] = [
    'redis', 'queues', 'platformSyncWorker', 'xpWorker', 'scheduler', 'sse',
  ];
  for (const key of subsystems) {
    if (store[key].status === 'degraded' || store[key].status === 'failed' || store[key].status === 'stopped') {
      degraded.push(key);
    }
  }
  return degraded;
}

// ---------------------------------------------------------------------------
// Public update API
// ---------------------------------------------------------------------------

export function setApiStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('api', status, error);
}

export function setMongoStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('mongodb', status, error);
}

export function setRedisStatus(status: SubsystemStatus, error?: string, details?: Record<string, unknown>): void {
  const health: RedisHealth = {
    status: status === 'healthy' ? 'connected' : status === 'initializing' ? 'connecting' : 'disconnected',
    host: '', port: 0, lastError: error ?? null, reconnectAttempts: 0,
    ...details as Partial<RedisHealth>,
  };
  updateSubsystem('redis', status, error, { redisHealth: health });
}

export function setQueuesStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('queues', status, error);
}

export function setPlatformSyncWorkerStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('platformSyncWorker', status, error);
}

export function setXpWorkerStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('xpWorker', status, error);
}

export function setSchedulerStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('scheduler', status, error);
}

export function setSseStatus(status: SubsystemStatus, error?: string): void {
  updateSubsystem('sse', status, error);
}
