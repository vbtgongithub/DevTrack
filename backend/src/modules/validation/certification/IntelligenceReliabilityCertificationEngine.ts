// src/modules/validation/certification/IntelligenceReliabilityCertificationEngine.ts
// Certifies if an intelligence system is ready for production.

import { logger } from '../../../shared/logger.js';
import type { CalibrationMetrics } from '../testing/ConfidenceValidationEngine.js';
import type { ATSValidationResult } from '../testing/ATSRealismValidationFramework.js';

export interface CertificationReport {
  modelId: string;
  certified: boolean;
  blockers: string[];
  metrics: {
    atsAccuracy: number;
    calibrationEce: number;
    retrievalRelevance: number;
    resilienceScore: number;
  };
}

export class IntelligenceReliabilityCertificationEngine {
  constructor() {
    logger.info('[CertificationEngine] Initialized');
  }

  certifyModel(
    modelId: string,
    atsResults: ATSValidationResult[],
    calibration: CalibrationMetrics,
    retrievalRelevance: number,
    resilienceScore: number
  ): CertificationReport {
    logger.info(`[CertificationEngine] Running certification for ${modelId}`);
    const blockers: string[] = [];

    const atsAvg = atsResults.reduce((a, b) => a + b.parsingAccuracy, 0) / (atsResults.length || 1);

    if (atsAvg < 0.75) blockers.push(`ATS realism average (${atsAvg.toFixed(2)}) is below 0.75`);
    if (calibration.ece > 0.1) blockers.push(`Calibration ECE (${calibration.ece.toFixed(2)}) is too high`);
    if (retrievalRelevance < 0.7) blockers.push(`Retrieval relevance (${retrievalRelevance.toFixed(2)}) is below 0.7`);
    if (resilienceScore < 0.9) blockers.push(`Runtime resilience score (${resilienceScore.toFixed(2)}) is below 0.9`);

    return {
      modelId,
      certified: blockers.length === 0,
      blockers,
      metrics: {
        atsAccuracy: atsAvg,
        calibrationEce: calibration.ece,
        retrievalRelevance,
        resilienceScore
      }
    };
  }
}
