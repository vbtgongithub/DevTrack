// src/infrastructure/queues/QueueMetrics.ts
import { Queue } from 'bullmq';
import { DeadLetterJob } from '../../db/models/deadLetterJob.model.js';
import { QueueRegistry } from './QueueRegistry.js';

export interface QueueStatus {
  name: string;
  active: number;
  waiting: number;
  failed: number;
  delayed: number;
  completed: number;
  deadLetterCount: number;
}

export class QueueMetrics {
  static async getGlobalMetrics(): Promise<QueueStatus[]> {
    const queues = QueueRegistry.getAllQueues();
    const metrics: QueueStatus[] = [];

    for (const queue of queues) {
      const [active, waiting, failed, delayed, completed] = await Promise.all([
        queue.getActiveCount(),
        queue.getWaitingCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getCompletedCount()
      ]);

      const deadLetterCount = await DeadLetterJob.countDocuments({ queueName: queue.name });

      metrics.push({
        name: queue.name,
        active,
        waiting,
        failed,
        delayed,
        completed,
        deadLetterCount
      });
    }

    return metrics;
  }
}
