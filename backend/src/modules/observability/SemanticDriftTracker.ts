import { logger } from '../../shared/logger.js';

export class SemanticDriftTracker {
  trackDrift(previousScore: number, currentScore: number): void {
    const drift = Math.abs(currentScore - previousScore);
    if (drift > 0.2) {
      logger.warn(`[DriftTracker] Significant semantic drift detected: ${drift.toFixed(2)}`);
    }
  }
}
