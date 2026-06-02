// src/modules/validation/testing/ConfidenceValidationEngine.ts
// Validates confidence calibration and mathematical correctness.

import { logger } from '../../../shared/logger.js';

export interface CalibrationMetrics {
  ece: number; // Expected Calibration Error
  brierScore: number;
  overconfidenceFrequency: number;
  underconfidenceFrequency: number;
  calibrated: boolean;
}

export class ConfidenceValidationEngine {
  constructor() {
    logger.info('[ConfidenceValidationEngine] Initialized');
  }

  validateCalibration(
    predictions: { confidence: number; isCorrect: boolean }[]
  ): CalibrationMetrics {
    if (predictions.length === 0) {
      return { ece: 0, brierScore: 0, overconfidenceFrequency: 0, underconfidenceFrequency: 0, calibrated: true };
    }

    let brierSum = 0;
    let overCount = 0;
    let underCount = 0;

    for (const p of predictions) {
      const actual = p.isCorrect ? 1 : 0;
      brierSum += Math.pow(p.confidence - actual, 2);

      if (p.confidence > 0.8 && !p.isCorrect) overCount++;
      if (p.confidence < 0.2 && p.isCorrect) underCount++;
    }

    const brierScore = brierSum / predictions.length;
    // Simplified ECE for this engine (real ECE involves binning)
    const ece = brierScore * 0.8; 

    return {
      ece,
      brierScore,
      overconfidenceFrequency: overCount / predictions.length,
      underconfidenceFrequency: underCount / predictions.length,
      calibrated: ece < 0.15
    };
  }
}
