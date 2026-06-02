import { logger } from '../../shared/logger.js';

export class RetrievalLatencyMonitor {
  recordLatency(operation: string, latencyMs: number): void {
    if (latencyMs > 1000) {
      logger.warn(`[LatencyMonitor] High latency detected for ${operation}: ${latencyMs}ms`);
    } else {
      logger.info(`[LatencyMonitor] ${operation} completed in ${latencyMs}ms`);
    }
  }
}
