// src/shared/jobs/dlq.service.ts — True Dead Letter Queue Architecture
// Phase-B: Production Evolution Layer

import { Queue, Job } from 'bullmq';
import { getRedisClient } from '../redis/client.js';
import { logger } from '../logger.js';
import { QueueNames } from './types.js';

// DLQ job persistence schema
export interface DlqEntry {
  id: string;
  originalQueue: string;
  originalJobId: string;
  jobData: Record<string, unknown>;
  failureReason: string;
  failureStack?: string;
  attemptCount: number;
  maxAttempts: number;
  failedAt: Date;
  categorizedAs: FailureCategory;
  recoverable: boolean;
  lastRetryAt?: Date;
  customMetadata?: Record<string, unknown>;
}

export type FailureCategory =
  | 'transient'        // Network, temp failures - auto-retry
  | 'validation'       // Invalid payload - requires fix
  | 'dependency'       // External service down - backoff
  | 'data_corruption' // Bad data, requires intervention
  | 'quarantine'       // Poison job - manual review
  | 'timeout';        // Took too long - may retry

// DLQ Manager for each queue type
class DlqManager {
  private dlq: Queue;
  private parentQueue: string;
  private maxRetainDays = 7;

  constructor(parentQueue: string) {
    this.parentQueue = parentQueue;
    this.dlq = new Queue(`${parentQueue}:dlq`, {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000, age: 86400 * 3 }, // 3 days
        removeOnFail: { count: 5000, age: 86400 * 7 },    // 7 days
      },
    });
  }

  async addFailedJob(
    originalJob: Job,
    failureReason: string,
    attemptCount: number,
    maxAttempts: number
  ): Promise<DlqEntry> {
    const categorized = this.categorizeFailure(failureReason, attemptCount, maxAttempts);
    const recoverable = this.isRecoverable(categorized);

    const entry: DlqEntry = {
      id: `${originalJob.id}-${Date.now()}`,
      originalQueue: this.parentQueue,
      originalJobId: originalJob.id || 'unknown',
      jobData: originalJob.data,
      failureReason,
      failureStack: (originalJob as unknown as { failedReason?: string }).failedReason,
      attemptCount,
      maxAttempts,
      failedAt: new Date(),
      categorizedAs: categorized,
      recoverable,
      customMetadata: {
        priority: originalJob.priority,
        timestamp: originalJob.timestamp,
      },
    };

    await this.dlq.add('dead-letter', entry, {
      jobId: entry.id,
    });

    logger.warn('[dlq] Job moved to DLQ', {
      queue: this.parentQueue,
      jobId: originalJob.id,
      category: categorized,
      recoverable,
      attempts: attemptCount,
    });

    return entry;
  }

  async replayJob(dlqEntryId: string): Promise<void> {
    const job = await this.dlq.getJob(dlqEntryId);
    if (!job) {
      throw new Error('DLQ job not found');
    }

    const data = job.data as DlqEntry;

    // Import parent queue and add job
    const { getOrCreateQueue } = await import('./queueFactory.js');
    const parentQueue = getOrCreateQueue(data.originalQueue);

    await parentQueue.add('replay', data.jobData);

    // Mark as replayed
    await job.updateData({
      ...data,
      lastRetryAt: new Date(),
    });

    logger.info('[dlq] Job replayed', {
      dlqEntryId,
      originalQueue: data.originalQueue,
    });
  }

  async getDlqMetrics(): Promise<{
    total: number;
    byCategory: Record<FailureCategory, number>;
    recoverable: number;
    oldestEntry: Date | null;
  }> {
    const counts = await this.dlq.getJobCounts();

    // Get all failed jobs to categorize
    const failedJobs = await this.dlq.getFailed(0, 100);

    const byCategory: Record<FailureCategory, number> = {
      transient: 0,
      validation: 0,
      dependency: 0,
      data_corruption: 0,
      quarantine: 0,
      timeout: 0,
    };

    let recoverable = 0;
    let oldest: Date | null = null;

    for (const job of failedJobs) {
      const data = job.data as DlqEntry;
      byCategory[data.categorizedAs]++;
      if (data.recoverable) recoverable++;
      if (!oldest || data.failedAt < oldest) {
        oldest = data.failedAt;
      }
    }

    return {
      total: counts.failed || 0,
      byCategory,
      recoverable,
      oldestEntry: oldest,
    };
  }

  private categorizeFailure(
    failureReason: string,
    attemptCount: number,
    maxAttempts: number
  ): FailureCategory {
    const reason = failureReason.toLowerCase();

    // Validation errors
    if (reason.includes('validation') || reason.includes('invalid') || reason.includes('schema')) {
      return 'validation';
    }

    // Timeout
    if (reason.includes('timeout') || reason.includes('timed out')) {
      return 'timeout';
    }

    // Dependency failures
    if (reason.includes('connection') || reason.includes('econnrefused') || reason.includes('enosys')) {
      return 'dependency';
    }

    // Data corruption
    if (reason.includes('corrupt') || reason.includes('parse') || reason.includes('cast')) {
      return 'data_corruption';
    }

    // Check for poison job (max retries exhausted)
    if (attemptCount >= maxAttempts) {
      return 'quarantine';
    }

    // Default to transient
    return 'transient';
  }

  private isRecoverable(category: FailureCategory): boolean {
    return ['transient', 'dependency', 'timeout'].includes(category);
  }

  async close(): Promise<void> {
    await this.dlq.close();
  }
}

// DLQ registry
const dlqManagers = new Map<string, DlqManager>();

export function getDlqManager(queueName: string): DlqManager {
  const existing = dlqManagers.get(queueName);
  if (existing) return existing;

  const manager = new DlqManager(queueName);
  dlqManagers.set(queueName, manager);
  return manager;
}

// Global DLQ operations
export const dlqService = {
  // Move job to appropriate DLQ
  async quarantineJob(
    parentQueue: string,
    job: Job,
    failureReason: string,
    attemptCount: number,
    maxAttempts: number
  ): Promise<DlqEntry> {
    const manager = getDlqManager(parentQueue);
    return manager.addFailedJob(job, failureReason, attemptCount, maxAttempts);
  },

  // Replay from DLQ
  async replayFromDlq(queueName: string, dlqJobId: string): Promise<void> {
    const manager = getDlqManager(queueName);
    await manager.replayJob(dlqJobId);
  },

  // Bulk replay with throttling
  async bulkReplay(queueName: string, limit = 10): Promise<{ succeeded: number; failed: number }> {
    const manager = getDlqManager(queueName);
    const metrics = await manager.getDlqMetrics();

    // Get only recoverable jobs
    const dlq = new Queue(`${queueName}:dlq`, { connection: getRedisClient() });
    const jobs = await dlq.getFailed(0, limit);

    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      const data = job.data as DlqEntry;
      if (data.recoverable) {
        try {
          await manager.replayJob(job.id || '');
          succeeded++;
        } catch {
          failed++;
        }
      }
    }

    return { succeeded, failed };
  },

  // Get all DLQ metrics
  async getAllDlqMetrics(): Promise<Record<string, Awaited<ReturnType<DlqManager['getDlqMetrics']>>>> {
    const queues = [QueueNames.XP_PROCESSING, QueueNames.STREAK_RECALC, QueueNames.ANALYTICS_SYNC, QueueNames.NOTIFICATIONS];

    const metrics: Record<string, Awaited<ReturnType<DlqManager['getDlqMetrics']>>> = {};

    for (const queue of queues) {
      const manager = getDlqManager(queue);
      metrics[queue] = await manager.getDlqMetrics();
    }

    return metrics;
  },

  // Cleanup old DLQ entries
  async cleanupDlq(queueName: string, olderThanDays = 7): Promise<number> {
    const manager = getDlqManager(queueName);
    const dlq = new Queue(`${queueName}:dlq`, { connection: getRedisClient() });

    const jobs = await dlq.getFailed(0, 1000);
    let cleaned = 0;
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    for (const job of jobs) {
      const data = job.data as DlqEntry;
      if (data.failedAt.getTime() < cutoff) {
        await job.remove();
        cleaned++;
      }
    }

    logger.info('[dlq] Cleanup completed', { queue: queueName, cleaned });
    return cleaned;
  },
};

export default dlqService;