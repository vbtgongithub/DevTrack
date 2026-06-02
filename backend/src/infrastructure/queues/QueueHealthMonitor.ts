// src/infrastructure/queues/QueueHealthMonitor.ts
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/index.js';

export class QueueHealthMonitor {
  private static intervalId: NodeJS.Timeout | null = null;

  static startMonitoring(intervalMs = 60000) {
    if (this.intervalId) return;
    
    logger.info('[QueueHealthMonitor] Starting health checks');
    this.intervalId = setInterval(async () => {
      try {
        const client = getRedisClient();
        if (client.status !== 'ready') {
          logger.error(`[QueueHealthMonitor] Redis connection issue detected: Status is ${client.status}`);
        } else {
          // Perform lightweight ping
          await client.ping();
        }
        
        // Memory usage check
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        if (heapUsedMB > 1024) { // Warning if using > 1GB
          logger.warn(`[QueueHealthMonitor] High memory usage detected: ${heapUsedMB} MB`);
        }
      } catch (err) {
        logger.error('[QueueHealthMonitor] Health check failed', err);
      }
    }, intervalMs);
  }

  static stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[QueueHealthMonitor] Stopped health checks');
    }
  }
}
