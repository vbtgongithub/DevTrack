import { logger } from '../../shared/logger.js';
import { metricsTracker } from '../observability/MetricsTracker.js';

export class DriftMonitor {
  private readonly DRIFT_TOLERANCE_PERCENT = 5.0; // 5% shift allowed

  /**
   * Monitors the distribution of ATS scores against the expected baseline.
   */
  monitorATSScoringDrift(recentScores: number[], historicalBaselineMean: number) {
    if (recentScores.length < 100) return; // Need statistical significance

    const currentMean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const deviation = Math.abs(currentMean - historicalBaselineMean);
    const deviationPercent = (deviation / historicalBaselineMean) * 100;

    if (deviationPercent > this.DRIFT_TOLERANCE_PERCENT) {
      const direction = currentMean > historicalBaselineMean ? 'inflation' : 'deflation';
      logger.error(`[DriftMonitor] ATS Scoring ${direction} detected! Deviation: ${deviationPercent.toFixed(2)}%`);
      metricsTracker.recordFailure('queue', 'ats_benchmark_drift');
      
      // Persist snapshot of drift for manual review
      this.persistDriftSnapshot('ats_calibration', currentMean, historicalBaselineMean);
    }
  }

  /**
   * Persists evaluation snapshots for observability.
   */
  private persistDriftSnapshot(domain: string, currentVal: number, baselineVal: number) {
    logger.info(`[DriftMonitor] Snapshot persisted for domain: ${domain}`, { currentVal, baselineVal });
    // In production, this would save to a Time-Series DB or MongoDB `DriftSnapshots` collection
  }
}
