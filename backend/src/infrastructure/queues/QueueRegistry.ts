// src/infrastructure/queues/QueueRegistry.ts
import { Queue } from 'bullmq';
import { getRedisClient } from '../../shared/redis/index.js';
import { logger } from '../../shared/logger.js';
import { RetryPolicy } from './RetryPolicy.js';

interface QueueEntry {
  queue: Queue;
  name: string;
}

export class QueueRegistry {
  private static registry = new Map<string, QueueEntry>();

  static createQueueConfig(defaultJobOptions?: Record<string, unknown>) {
    return {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: RetryPolicy.MAX_ATTEMPTS,
        backoff: RetryPolicy.getStandardBackoff(),
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        ...defaultJobOptions,
      },
    };
  }

  static getOrCreateQueue(name: string): Queue {
    const existing = this.registry.get(name);
    if (existing) return existing.queue;

    logger.info(`[QueueRegistry] Creating queue: ${name}`);

    const queue = new Queue(name, this.createQueueConfig());
    this.registry.set(name, { queue, name });
    return queue;
  }

  static getQueue(name: string): Queue | undefined {
    return this.registry.get(name)?.queue;
  }

  static getAllQueues(): Queue[] {
    return Array.from(this.registry.values()).map((e) => e.queue);
  }

  static async closeAllQueues(): Promise<void> {
    await Promise.all(this.getAllQueues().map((q) => q.close()));
    this.registry.clear();
    logger.info('[QueueRegistry] All queues closed');
  }
}
