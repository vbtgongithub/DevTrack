// src/infrastructure/queues/RetryPolicy.ts
import { BackoffOptions } from 'bullmq';

export class RetryPolicy {
  /**
   * Standard exponential backoff with custom delays.
   * Attempt 1 -> 5s
   * Attempt 2 -> 15s
   * Attempt 3 -> 45s
   * Attempt 4 -> 120s
   */
  static getStandardBackoff(): BackoffOptions {
    return {
      type: 'exponential',
      delay: 5000,
    };
  }
  
  static getCustomBackoffLogic() {
    // BullMQ supports custom backoff strategies registered globally on the worker
    return async (attemptsMade: number, type: any, err: any, job: any): Promise<number> => {
      const baseDelay = [5000, 15000, 45000, 120000];
      const index = Math.min(attemptsMade - 1, baseDelay.length - 1);
      const delay = baseDelay[Math.max(0, index)];
      
      // Add jitter +/- 20%
      const jitter = delay * 0.2;
      const randomizedJitter = (Math.random() * (jitter * 2)) - jitter;
      return Math.round(delay + randomizedJitter);
    };
  }

  static readonly MAX_ATTEMPTS = 4;
}
