// src/modules/ml/calibration/MLConfidenceCalibrationEngine.ts
// Wraps all ML outputs with calibrated confidence using Platt scaling
// and isotonic regression. No overconfident outputs allowed.

import { logger } from '../../../shared/logger.js';
import type { CalibrationResult, CalibrationConfig, MLPrediction } from '../types.js';

interface CalibrationData {
  predictedProbability: number;
  actualOutcome: number;  // 0 or 1
}

/**
 * MLConfidenceCalibrationEngine
 *
 * Ensures every ML output exposes:
 * - Calibrated confidence
 * - Uncertainty
 * - Semantic certainty
 * - Evidence coverage
 * - Retrieval stability
 *
 * Calibration methods:
 * - Platt scaling (logistic regression on model outputs)
 * - Isotonic regression (monotone piecewise calibration)
 * - Temperature scaling (single parameter softmax temperature)
 *
 * CRITICAL: No overconfident ML outputs allowed.
 */
export class MLConfidenceCalibrationEngine {
  private config: CalibrationConfig;

  // Platt scaling parameters: P(y=1|s) = 1/(1 + exp(A*s + B))
  private plattA: number = -1;
  private plattB: number = 0;

  // Isotonic regression bins
  private isotonicBins: { lower: number; upper: number; calibrated: number }[] = [];

  // Temperature scaling
  private temperature: number = 1.0;

  // Calibration history for monitoring
  private calibrationHistory: CalibrationData[] = [];

  // Maximum allowed confidence (prevent overconfidence)
  private maxConfidence: number = 0.95;
  private minConfidence: number = 0.05;

  constructor(config?: Partial<CalibrationConfig>) {
    this.config = {
      method: config?.method ?? 'platt_scaling',
      binCount: config?.binCount ?? 20,
      minSamples: config?.minSamples ?? 50,
    };
    this.initializeIsotonicBins();
    logger.info('[MLConfidenceCalibration] Initialized', { method: this.config.method });
  }

  /**
   * Calibrate a raw ML prediction.
   */
  calibrate(prediction: MLPrediction): MLPrediction {
    const calibration = this.calibrateScore(prediction.score);

    return {
      ...prediction,
      score: calibration.calibratedConfidence,
      confidence: this.clampConfidence(calibration.calibratedConfidence),
      uncertainty: 1 - calibration.calibratedConfidence,
      semanticCertainty: this.computeSemanticCertainty(prediction),
      evidenceCoverage: prediction.evidenceCoverage,
      retrievalStability: prediction.retrievalStability,
    };
  }

  /**
   * Calibrate a raw score using the configured method.
   */
  calibrateScore(rawScore: number): CalibrationResult {
    let calibrated: number;
    let calibrationError: number;

    switch (this.config.method) {
      case 'platt_scaling':
        calibrated = this.plattScale(rawScore);
        calibrationError = this.computeCalibrationError(rawScore, calibrated);
        break;
      case 'isotonic_regression':
        calibrated = this.isotonicCalibrate(rawScore);
        calibrationError = this.computeCalibrationError(rawScore, calibrated);
        break;
      case 'temperature_scaling':
        calibrated = this.temperatureScale(rawScore);
        calibrationError = this.computeCalibrationError(rawScore, calibrated);
        break;
      default:
        calibrated = rawScore;
        calibrationError = 0;
    }

    return {
      rawScore,
      calibratedConfidence: this.clampConfidence(calibrated),
      calibrationMethod: this.config.method,
      calibrationError,
    };
  }

  /**
   * Record calibration data for model monitoring.
   */
  recordCalibrationData(predicted: number, actual: number): void {
    this.calibrationHistory.push({ predictedProbability: predicted, actualOutcome: actual });

    // Refit calibration parameters when enough data
    if (this.calibrationHistory.length % this.config.minSamples === 0) {
      this.refitCalibration();
    }
  }

  /**
   * Compute Expected Calibration Error (ECE).
   */
  computeECE(): number {
    if (this.calibrationHistory.length < 10) return 0;

    const bins = this.config.binCount;
    const binCounts = new Array(bins).fill(0);
    const binConfidences = new Array(bins).fill(0);
    const binAccuracies = new Array(bins).fill(0);

    for (const point of this.calibrationHistory) {
      const binIndex = Math.min(bins - 1, Math.floor(point.predictedProbability * bins));
      binCounts[binIndex]++;
      binConfidences[binIndex] += point.predictedProbability;
      binAccuracies[binIndex] += point.actualOutcome;
    }

    let ece = 0;
    const total = this.calibrationHistory.length;

    for (let i = 0; i < bins; i++) {
      if (binCounts[i] === 0) continue;
      const avgConfidence = binConfidences[i] / binCounts[i];
      const avgAccuracy = binAccuracies[i] / binCounts[i];
      ece += (binCounts[i] / total) * Math.abs(avgAccuracy - avgConfidence);
    }

    return ece;
  }

  /**
   * Get calibration statistics.
   */
  getStatistics(): {
    method: string;
    ece: number;
    totalSamples: number;
    plattParams: { a: number; b: number };
    temperature: number;
    maxConfidence: number;
  } {
    return {
      method: this.config.method,
      ece: this.computeECE(),
      totalSamples: this.calibrationHistory.length,
      plattParams: { a: this.plattA, b: this.plattB },
      temperature: this.temperature,
      maxConfidence: this.maxConfidence,
    };
  }

  // ---------------------------------------------------------------------------
  // Calibration methods
  // ---------------------------------------------------------------------------

  private plattScale(score: number): number {
    // Platt scaling: sigmoid(A*s + B)
    return 1 / (1 + Math.exp(this.plattA * score + this.plattB));
  }

  private isotonicCalibrate(score: number): number {
    // Find the bin containing the score
    for (const bin of this.isotonicBins) {
      if (score >= bin.lower && score < bin.upper) {
        return bin.calibrated;
      }
    }
    // Edge case: return score clamped
    return this.clampConfidence(score);
  }

  private temperatureScale(score: number): number {
    // Temperature scaling: softmax with temperature
    const logit = Math.log(score / (1 - Math.max(score, 1e-10)));
    const scaledLogit = logit / this.temperature;
    return 1 / (1 + Math.exp(-scaledLogit));
  }

  private refitCalibration(): void {
    logger.info(`[MLConfidenceCalibration] Refitting with ${this.calibrationHistory.length} samples`);

    switch (this.config.method) {
      case 'platt_scaling':
        this.fitPlattScaling();
        break;
      case 'isotonic_regression':
        this.fitIsotonicRegression();
        break;
      case 'temperature_scaling':
        this.fitTemperatureScaling();
        break;
    }
  }

  private fitPlattScaling(): void {
    // Simplified Platt scaling: gradient descent on A, B
    let A = this.plattA;
    let B = this.plattB;
    const lr = 0.01;

    for (let iter = 0; iter < 100; iter++) {
      let gradA = 0;
      let gradB = 0;

      for (const point of this.calibrationHistory) {
        const pred = 1 / (1 + Math.exp(A * point.predictedProbability + B));
        const error = pred - point.actualOutcome;
        gradA += error * point.predictedProbability;
        gradB += error;
      }

      A -= lr * gradA / this.calibrationHistory.length;
      B -= lr * gradB / this.calibrationHistory.length;
    }

    this.plattA = A;
    this.plattB = B;
  }

  private fitIsotonicRegression(): void {
    // Pool adjacent violators (PAV) algorithm
    const sorted = [...this.calibrationHistory]
      .sort((a, b) => a.predictedProbability - b.predictedProbability);

    const bins = this.config.binCount;
    const binSize = Math.max(1, Math.floor(sorted.length / bins));

    this.isotonicBins = [];
    for (let i = 0; i < bins; i++) {
      const start = i * binSize;
      const end = Math.min(sorted.length, (i + 1) * binSize);
      const binData = sorted.slice(start, end);

      if (binData.length === 0) continue;

      const avgPred = binData.reduce((s, p) => s + p.predictedProbability, 0) / binData.length;
      const avgActual = binData.reduce((s, p) => s + p.actualOutcome, 0) / binData.length;

      this.isotonicBins.push({
        lower: binData[0].predictedProbability,
        upper: binData[binData.length - 1].predictedProbability + 0.001,
        calibrated: avgActual,
      });
    }

    // Ensure monotonicity (PAV)
    for (let i = 1; i < this.isotonicBins.length; i++) {
      if (this.isotonicBins[i].calibrated < this.isotonicBins[i - 1].calibrated) {
        const avg = (this.isotonicBins[i].calibrated + this.isotonicBins[i - 1].calibrated) / 2;
        this.isotonicBins[i].calibrated = avg;
        this.isotonicBins[i - 1].calibrated = avg;
      }
    }
  }

  private fitTemperatureScaling(): void {
    // Simple line search for optimal temperature
    let bestTemp = 1.0;
    let bestLoss = Infinity;

    for (let t = 0.1; t <= 5.0; t += 0.1) {
      let loss = 0;
      for (const point of this.calibrationHistory) {
        const logit = Math.log(point.predictedProbability / (1 - Math.max(point.predictedProbability, 1e-10)));
        const pred = 1 / (1 + Math.exp(-logit / t));
        loss += -(point.actualOutcome * Math.log(pred + 1e-10) + (1 - point.actualOutcome) * Math.log(1 - pred + 1e-10));
      }
      if (loss < bestLoss) {
        bestLoss = loss;
        bestTemp = t;
      }
    }

    this.temperature = bestTemp;
  }

  private initializeIsotonicBins(): void {
    const bins = this.config.binCount;
    this.isotonicBins = Array.from({ length: bins }, (_, i) => ({
      lower: i / bins,
      upper: (i + 1) / bins,
      calibrated: (i + 0.5) / bins,
    }));
  }

  private computeSemanticCertainty(prediction: MLPrediction): number {
    // Combine confidence with evidence coverage
    return prediction.confidence * 0.6 + prediction.evidenceCoverage * 0.4;
  }

  private computeCalibrationError(raw: number, calibrated: number): number {
    return Math.abs(raw - calibrated);
  }

  private clampConfidence(confidence: number): number {
    return Math.max(this.minConfidence, Math.min(this.maxConfidence, confidence));
  }
}
