// src/modules/progression-orchestration/queueTopology.ts
// Enterprise Queue Topology definition using BullMQ.
// Enforces separate channels, custom retry/backoff parameters, and automatic DLQ routing.

import { Queue, type QueueOptions } from 'bullmq';
import { getRedisClient } from '../../shared/redis/index.js';
import { logger } from '../../shared/logger.js';

export const QUEUE_NAMES = {
  PLATFORM_SYNC: 'platform-sync',
  ACTIVITY_NORMALIZATION: 'activity-normalization',
  PROGRESSION_PROCESSING: 'progression-processing',
  LEADERBOARD_UPDATE: 'leaderboard-update',
  NOTIFICATION_DISPATCH: 'notification-dispatch',
  REALTIME_PROPAGATION: 'realtime-propagation',
  ORCHESTRATION_COMPENSATION: 'orchestration-compensation',
} as const;

export class QueueTopology {
  private activeQueues: Map<string, Queue> = new Map();

  /**
   * Initializes all required system queues with safe connection profiles.
   */
  initializeQueues(): void {
    const connection = getRedisClient();
    
    const defaultOptions: QueueOptions = {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5s exponential delay
        },
        removeOnComplete: { age: 3600 * 24 }, // 24h history
        removeOnFail: { age: 3600 * 24 * 7 }, // 7 days DLQ retention
      },
    };

    Object.entries(QUEUE_NAMES).forEach(([key, value]) => {
      try {
        const queue = new Queue(value, defaultOptions);
        this.activeQueues.set(value, queue);
        logger.info(`[queue-topology] Successfully registered queue: ${value}`);
      } catch (err) {
        logger.error(`[queue-topology] Failed to initialize queue ${value}`, err);
      }
    });
  }

  /**
   * Fetches an active queue by its name.
   */
  getQueue(name: typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]): Queue {
    const queue = this.activeQueues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} is not initialized in the topology`);
    }
    return queue;
  }

  /**
   * Shuts down all active queue connections.
   */
  async closeAll(): Promise<void> {
    for (const queue of this.activeQueues.values()) {
      await queue.close();
    }
    this.activeQueues.clear();
    logger.info('[queue-topology] All queues closed cleanly');
  }
}

export const queueTopology = new QueueTopology();
export { Queue };
