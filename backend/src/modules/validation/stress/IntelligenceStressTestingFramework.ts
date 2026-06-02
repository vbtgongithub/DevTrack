// src/modules/validation/stress/IntelligenceStressTestingFramework.ts
// Framework for stress testing individual intelligence components.

import { logger } from '../../../shared/logger.js';
import type { StressTestConfig, MetricSnapshot } from '../types.js';

export class IntelligenceStressTestingFramework {
  constructor() {
    logger.info('[StressTestingFramework] Initialized');
  }

  async stressTestComponent(
    componentName: string,
    config: StressTestConfig,
    testFn: () => Promise<void>
  ): Promise<MetricSnapshot[]> {
    logger.info(`[StressTestingFramework] Starting stress test for ${componentName}`, { ...config } as Record<string, unknown>);
    const snapshots: MetricSnapshot[] = [];
    const startTime = Date.now();
    const endTime = startTime + config.durationSeconds * 1000;
    
    // Simulate load based on config
    let errors = 0;
    let totalRequests = 0;
    const latencies: number[] = [];

    while (Date.now() < endTime) {
      const batchStartTime = Date.now();
      const promises = [];
      const batchSize = Math.floor(config.targetRps / 10); // Check 10 times a sec
      
      for (let i = 0; i < batchSize; i++) {
        promises.push(
          testFn()
            .then(() => {
              latencies.push(Date.now() - batchStartTime);
            })
            .catch(() => {
              errors++;
            })
        );
        totalRequests++;
      }
      
      await Promise.allSettled(promises);
      
      if (Date.now() % 1000 < 100) {
        snapshots.push(this.captureSnapshot(latencies, errors, totalRequests));
      }
      
      // Wait to match rate limit
      const elapsed = Date.now() - batchStartTime;
      if (elapsed < 100) {
        await new Promise(resolve => setTimeout(resolve, 100 - elapsed));
      }
    }

    logger.info(`[StressTestingFramework] Stress test completed for ${componentName}`);
    return snapshots;
  }

  private captureSnapshot(latencies: number[], errors: number, total: number): MetricSnapshot {
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

    return {
      timestamp: new Date().toISOString(),
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      errorRate: total > 0 ? errors / total : 0,
      throughputRps: total, // Simplified for this snapshot
      queueDepth: 0
    };
  }
}
