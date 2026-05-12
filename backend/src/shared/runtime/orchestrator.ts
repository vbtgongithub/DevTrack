// src/shared/runtime/orchestrator.ts — Boot orchestrator (entry point for index.ts)
// Wires multi-phase startup + graceful shutdown into a single callable.

import type { Express } from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from '../../db/connection.js';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';
import { eventBus } from '../sse/index.js';
import { getRedisClient, disconnectRedis, getRedisHealth } from '../redis/index.js';
import { getOrCreateQueue, closeAllQueues, QueueNames } from '../jobs/index.js';
import {
  startPlatformSyncWorker,
  stopPlatformSyncWorker,
  getWorkerStatus,
} from '../jobs/workers.js';
import { startXpWorker, stopXpWorker, getXpWorkerStatus } from '../jobs/xpWorker.js';
import {
  startSyncScheduler,
  stopSyncScheduler,
} from '../syncScheduler.js';
import {
  setApiStatus,
  setMongoStatus,
  setRedisStatus,
  setQueuesStatus,
  setPlatformSyncWorkerStatus,
  setXpWorkerStatus,
  setSchedulerStatus,
  setSseStatus,
} from './infrastructureRegistry.js';

export interface StartupResult {
  success: boolean;
  degraded: boolean;
  warnings: string[];
  phases: {
    mongodb: boolean;
    redis: boolean;
    queues: boolean;
    platformSyncWorker: boolean;
    xpWorker: boolean;
    scheduler: boolean;
  };
}

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function bootMongo(): Promise<boolean> {
  setMongoStatus('initializing');
  try {
    await connectDatabase();
    setMongoStatus('healthy');
    logger.info('[startup] MongoDB connected', { event: 'mongodb_connected' });
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setMongoStatus('failed', msg);
    logger.error('[startup] MongoDB connection failed', err as Error);
    return false;
  }
}

async function bootRedis(): Promise<boolean> {
  setRedisStatus('initializing');
  try {
    const client = getRedisClient();
    await new Promise<void>((resolve) => {
      if (client.status === 'ready' || client.status === 'connecting' || client.status === 'wait') {
        resolve();
      } else {
        client.once('ready', () => resolve());
        client.once('error', () => resolve());
        setTimeout(resolve, 3000);
      }
    });
    const health = getRedisHealth();
    if (health.status === 'connected') {
      setRedisStatus('healthy');
      logger.info('[startup] Redis connected', { event: 'redis_connected' });
      return true;
    }
    setRedisStatus('degraded', 'Redis not ready');
    logger.warn('[startup] Redis unavailable — operating in degraded mode', { event: 'redis_degraded', status: health.status });
    return false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setRedisStatus('degraded', err instanceof Error ? err.message : String(err));
    logger.warn('[startup] Redis bootstrap failed — continuing without queues', { event: 'redis_degraded', error: msg });
    return false;
  }
}

async function bootQueues(redisOk: boolean): Promise<boolean> {
  if (!redisOk) {
    setQueuesStatus('degraded', 'Redis unavailable');
    return false;
  }
  setQueuesStatus('initializing');
  try {
    for (const name of [QueueNames.PLATFORM_SYNC, QueueNames.REALTIME_EVENTS, QueueNames.XP_PROCESSING, QueueNames.SYSTEM_MAINTENANCE]) {
      getOrCreateQueue(name);
    }
    setQueuesStatus('healthy');
    logger.info('[startup] Queues initialized', { event: 'queues_initialized' });
    return true;
  } catch (err) {
    setQueuesStatus('failed', err instanceof Error ? err.message : String(err));
    logger.error('[startup] Queue bootstrap failed', err as Error);
    return false;
  }
}

function bootWorkers(redisOk: boolean): { platformSync: boolean; xp: boolean } {
  let platformSync = false;
  let xp = false;

  if (!redisOk) {
    setPlatformSyncWorkerStatus('degraded', 'Redis unavailable');
    setXpWorkerStatus('degraded', 'Redis unavailable');
    return { platformSync, xp };
  }

  try {
    startPlatformSyncWorker();
    setPlatformSyncWorkerStatus('healthy');
    platformSync = true;
    logger.info('[startup] Platform sync worker started', { event: 'worker_started' });
  } catch (err) {
    setPlatformSyncWorkerStatus('failed', err instanceof Error ? err.message : String(err));
    logger.error('[startup] Platform sync worker failed', err as Error);
  }

  try {
    startXpWorker();
    setXpWorkerStatus('healthy');
    xp = true;
    logger.info('[startup] XP worker started', { event: 'xp_worker_started' });
  } catch (err) {
    setXpWorkerStatus('failed', err instanceof Error ? err.message : String(err));
    logger.error('[startup] XP worker failed', err as Error);
  }

  return { platformSync, xp };
}

function bootScheduler(queuesOk: boolean): boolean {
  if (!queuesOk) {
    setSchedulerStatus('degraded', 'Queues unavailable');
    logger.warn('[startup] Scheduler paused — queues not available', { event: 'scheduler_paused', reason: 'queues_unavailable' });
    return false;
  }
  try {
    startSyncScheduler();
    setSchedulerStatus('healthy');
    logger.info('[startup] Scheduler started', { event: 'scheduler_resumed' });
    return true;
  } catch (err) {
    setSchedulerStatus('failed', err instanceof Error ? err.message : String(err));
    logger.error('[startup] Scheduler failed to start', err as Error);
    return false;
  }
}

export async function startup(app: Express): Promise<StartupResult> {
  setApiStatus('initializing');
  const warnings: string[] = [];

  const mongoOk = await bootMongo();
  if (!mongoOk) {
    setApiStatus('failed', 'MongoDB required');
    return { success: false, phases: { mongodb: false, redis: false, queues: false, platformSyncWorker: false, xpWorker: false, scheduler: false }, degraded: true, warnings: ['MongoDB required — cannot start'] };
  }

  const redisOk = await bootRedis();
  if (!redisOk) warnings.push('Redis unavailable — BullMQ workers disabled');

  const queuesOk = await bootQueues(redisOk);
  if (!queuesOk && redisOk) warnings.push('Queue initialization failed');

  const workers = bootWorkers(redisOk);
  if (!workers.platformSync) warnings.push('Platform sync worker not started');
  if (!workers.xp) warnings.push('XP worker not started');

  const schedulerOk = bootScheduler(queuesOk);
  if (!schedulerOk) warnings.push('Scheduler paused');

  setSseStatus('healthy');
  setApiStatus('healthy');

  if (warnings.length > 0) {
    logger.warn('[startup] Operating in degraded mode', { event: 'degraded_mode_entered', warnings });
  }

  return {
    success: true,
    phases: { mongodb: mongoOk, redis: redisOk, queues: queuesOk, platformSyncWorker: workers.platformSync, xpWorker: workers.xp, scheduler: schedulerOk },
    degraded: warnings.length > 0,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Shutdown
// ---------------------------------------------------------------------------

export async function shutdown(): Promise<void> {
  logger.info('[shutdown] Initiating graceful shutdown');

  stopSyncScheduler();
  setSchedulerStatus('stopped');

  await stopPlatformSyncWorker();
  setPlatformSyncWorkerStatus('stopped');

  await stopXpWorker();
  setXpWorkerStatus('stopped');

  await closeAllQueues();
  setQueuesStatus('stopped');

  await disconnectRedis();
  setRedisStatus('stopped');

  eventBus.shutdown?.();
  setSseStatus('stopped');

  setApiStatus('stopped');
  logger.info('[shutdown] Graceful shutdown complete', { event: 'shutdown_complete' });
}

// ---------------------------------------------------------------------------
// Combined orchestrator object (index.ts surface)
// ---------------------------------------------------------------------------

export const orchestrator = { startup, shutdown };
