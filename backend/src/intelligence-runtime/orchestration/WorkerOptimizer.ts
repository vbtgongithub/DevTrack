import { logger } from '../../shared/logger.js';
import { metricsTracker } from '../observability/MetricsTracker.js';

export class WorkerOptimizer {
  private activeJobs = 0;
  private readonly MAX_CONCURRENCY = 50;

  /**
   * Applies queue backpressure by delaying job acceptance if concurrency limits are reached.
   */
  async applyBackpressure(): Promise<void> {
    if (this.activeJobs >= this.MAX_CONCURRENCY) {
      metricsTracker.recordFailure('queue', 'backpressure_limit_reached');
      logger.warn(`[WorkerOptimizer] High concurrency (${this.activeJobs}). Applying backpressure...`);
      // Simulate exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Adaptive batching for embedding pipeline
   */
  batchItems<T>(items: T[], batchSize: number = 10): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  trackJobStart() {
    this.activeJobs++;
  }

  trackJobEnd() {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
  }
}
