import { logger } from '../../shared/logger.js';

export class MetricsTracker {
  private metrics: Record<string, number> = {};

  /**
   * Tracks latency of a specific operation
   */
  async trackLatency<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.recordMetric(`${operationName}_latency_ms`, duration);
      return result;
    } catch (error) {
      this.recordMetric(`${operationName}_failures`, 1);
      throw error;
    }
  }

  /**
   * Increments a throughput counter
   */
  incrementThroughput(queueName: string) {
    this.recordMetric(`${queueName}_throughput`, 1);
  }

  /**
   * Records failure for monitoring
   */
  recordFailure(source: 'worker' | 'embedding' | 'gemini' | 'queue', reason: string) {
    this.recordMetric(`${source}_crashes`, 1);
    logger.error(`[MetricsTracker] Failure in ${source}: ${reason}`);
  }

  private recordMetric(key: string, value: number) {
    if (!this.metrics[key]) {
      this.metrics[key] = 0;
    }
    this.metrics[key] += value;
    
    // In production this batches up and sends to an APM tool
    // For DevTrack, we use lightweight logging
    if (key.includes('failure') || key.includes('crash') || key.includes('drift') || key.includes('degradation')) {
      logger.warn(`[Metrics] ${key} = ${this.metrics[key]}`);
    } else if (this.metrics[key] % 100 === 0) {
      logger.info(`[Metrics] ${key} aggregate = ${this.metrics[key]}`);
    }
  }

  /**
   * Tracks outcome observability and alerts on degradation.
   */
  recordOutcomeDrift(domain: 'recommendation' | 'coaching' | 'trajectory' | 'intervention', severity: 'minor' | 'major') {
    this.recordMetric(`${domain}_effectiveness_drift`, severity === 'major' ? 5 : 1);
    
    if (severity === 'major') {
      logger.error(`[MetricsTracker] Major outcome drift detected in domain: ${domain}. Check causal chains.`);
    }
  }

  /**
   * Tracks dataset health metrics
   */
  recordDatasetHealth(datasetId: string, metrics: { duplicates: number; invalidRows: number; embeddingIntegrity: number }) {
    this.recordMetric(`dataset_${datasetId}_duplicates`, metrics.duplicates);
    this.recordMetric(`dataset_${datasetId}_invalid_rows`, metrics.invalidRows);
    
    if (metrics.invalidRows > 100) {
      logger.warn(`[MetricsTracker] Dataset ${datasetId} is showing high invalid row count: ${metrics.invalidRows}`);
    }
    if (metrics.embeddingIntegrity < 0.9) {
      logger.error(`[MetricsTracker] Dataset ${datasetId} embedding integrity dropped below 90%: ${metrics.embeddingIntegrity}`);
    }
  }
  
  /**
   * Expose snapshot for lightweight dashboards
   */
  getSnapshot() {
    return { ...this.metrics, timestamp: new Date().toISOString() };
  }
}

export const metricsTracker = new MetricsTracker();
