// src/shared/jobs/maintenanceWorker.ts — Periodic maintenance worker
// Runs DLQ cleanup, prunes expired SSE resources, and performs Redis hygiene.
// Designed to run on a cron schedule via BullMQ repeatable jobs.

import { Worker, Job, Queue } from 'bullmq';
import { getRedisClient } from '../redis/index.js';
import { logger } from '../logger.js';
import { dlqService } from './dlq.service.js';
import { QueueNames, SystemMaintenanceJobData } from './types.js';

let _worker: Worker<SystemMaintenanceJobData> | null = null;
let _queue: Queue<SystemMaintenanceJobData> | null = null;

// ---------------------------------------------------------------------------
// Maintenance tasks
// ---------------------------------------------------------------------------

async function runCleanupFailedJobs(): Promise<void> {
  logger.info('[maintenance] Running DLQ cleanup');
  try {
    let totalCleaned = 0;
    // Clean DLQ entries for all known queue types
    const queues = [
      QueueNames.PLATFORM_SYNC,
      QueueNames.XP_PROCESSING,
      QueueNames.ORCHESTRATION_COMPENSATION,
      QueueNames.SYSTEM_MAINTENANCE,
    ];
    for (const q of queues) {
      try {
        const cleaned = await dlqService.cleanupDlq(q);
        totalCleaned += cleaned;
      } catch {
        // Individual queue cleanup failure is non-fatal
      }
    }
    logger.info('[maintenance] DLQ cleanup completed', { totalCleaned });
  } catch (err) {
    logger.error('[maintenance] DLQ cleanup failed', err);
  }
}

async function runPruneOldEvents(): Promise<void> {
  logger.info('[maintenance] Pruning expired SSE streams and sequences');
  const redis = getRedisClient();

  try {
    // Scan for orphaned sse:stream:* keys older than 10 minutes
    let cursor = '0';
    let pruned = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'sse:stream:*', 'COUNT', 100);
      cursor = nextCursor;
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        // If a key somehow lost its TTL, set one
        if (ttl === -1) {
          await redis.expire(key, 600); // 10 min safety net
          pruned++;
        }
      }
    } while (cursor !== '0');

    // Same for sse:seq:* keys
    cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'sse:seq:*', 'COUNT', 100);
      cursor = nextCursor;
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) {
          await redis.expire(key, 300);
          pruned++;
        }
      }
    } while (cursor !== '0');

    // Trim the global event stream
    const trimmed = await redis.xtrim('devtrack:events:stream', 'MAXLEN', '~', 50000);

    logger.info('[maintenance] Prune completed', { pruned, streamTrimmed: trimmed });
  } catch (err) {
    logger.error('[maintenance] Prune failed', err);
  }
}

async function runHealthCheck(): Promise<void> {
  logger.info('[maintenance] Running Redis health check');
  const redis = getRedisClient();

  try {
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;

    const info = await redis.info('memory');
    const usedMemoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

    logger.info('[maintenance] Health check passed', {
      redisLatencyMs: latencyMs,
      redisMemory: usedMemoryMatch?.[1]?.trim() ?? 'unknown',
    });
  } catch (err) {
    logger.error('[maintenance] Health check failed', err);
  }
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export function startMaintenanceWorker(): Worker<SystemMaintenanceJobData> {
  if (_worker) return _worker;

  const redis = getRedisClient();

  _worker = new Worker<SystemMaintenanceJobData>(
    QueueNames.SYSTEM_MAINTENANCE,
    async (job: Job<SystemMaintenanceJobData>) => {
      const { task } = job.data;
      logger.info('[maintenance] Executing maintenance task', {
        event: 'maintenance_started',
        task,
        jobId: job.id,
      });

      switch (task) {
        case 'cleanup_failed_jobs':
          await runCleanupFailedJobs();
          break;
        case 'prune_old_events':
          await runPruneOldEvents();
          break;
        case 'health_check':
          await runHealthCheck();
          break;
        default:
          logger.warn('[maintenance] Unknown task type', { task });
      }
    },
    {
      connection: redis,
      concurrency: 1, // Maintenance is sequential
    }
  );

  _worker.on('error', (err) => {
    logger.error('[maintenance] Worker error', err);
  });

  logger.info('[maintenance] Maintenance worker started');
  return _worker;
}

/**
 * Schedule recurring maintenance jobs.
 * Call once during boot to set up repeatable BullMQ jobs.
 */
export async function scheduleMaintenanceTasks(): Promise<void> {
  const redis = getRedisClient();

  _queue = new Queue<SystemMaintenanceJobData>(QueueNames.SYSTEM_MAINTENANCE, {
    connection: redis,
  });

  // DLQ cleanup every 6 hours
  await _queue.add(
    'cleanup-dlq',
    { task: 'cleanup_failed_jobs' },
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      jobId: 'maintenance-dlq-cleanup',
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 10 },
    }
  );

  // Prune SSE resources every hour
  await _queue.add(
    'prune-events',
    { task: 'prune_old_events' },
    {
      repeat: { every: 60 * 60 * 1000 },
      jobId: 'maintenance-prune-events',
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 10 },
    }
  );

  // Health check every 5 minutes
  await _queue.add(
    'health-check',
    { task: 'health_check' },
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: 'maintenance-health-check',
      removeOnComplete: { count: 3 },
      removeOnFail: { count: 5 },
    }
  );

  logger.info('[maintenance] Scheduled recurring maintenance tasks');
}

export async function stopMaintenanceWorker(): Promise<void> {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
}
