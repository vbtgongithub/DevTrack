import { IntelligenceResult, ConfidenceEnvelope } from '../types/index.js';
import { logger } from '../../shared/logger.js';

export class ConfidenceEvaluator {
  private overconfidenceCount = 0;
  private underconfidenceCount = 0;

  /**
   * Aggregates multiple confidence envelopes into a single holistic envelope.
   * Enforces verification penalties strictly.
   */
  aggregate(envelopes: ConfidenceEnvelope[], overarchingReasoning: string, containsVerificationFailure: boolean = false): ConfidenceEnvelope {
    if (envelopes.length === 0) {
      return {
        confidence: 0,
        evidenceCount: 0,
        evidenceSources: [],
        reasoning: 'No evidence provided.'
      };
    }

    const totalConfidence = envelopes.reduce((sum, env) => sum + env.confidence, 0);
    const avgConfidence = totalConfidence / envelopes.length;
    
    const totalEvidenceCount = envelopes.reduce((sum, env) => sum + env.evidenceCount, 0);
    
    const allSources = envelopes.flatMap(env => env.evidenceSources);
    const uniqueSources = [...new Set(allSources)];

    let finalConfidence = avgConfidence;

    // Strict penalization rules
    if (uniqueSources.length < 2) {
      finalConfidence = Math.min(finalConfidence, 0.6);
    }
    
    // Never overstate certainty if verification failed
    if (containsVerificationFailure) {
      finalConfidence = Math.min(finalConfidence, 0.4);
    }

    const output = {
      confidence: Math.round(finalConfidence * 100) / 100,
      evidenceCount: totalEvidenceCount,
      evidenceSources: uniqueSources,
      reasoning: containsVerificationFailure ? overarchingReasoning + ' (Penalized due to verification failures)' : overarchingReasoning
    };

    this.trackCalibration(output);
    return output;
  }

  /**
   * Determine if an output meets production trust threshold.
   */
  isTrustworthy(envelope: ConfidenceEnvelope, threshold: number = 0.65): boolean {
    return envelope.confidence >= threshold && envelope.evidenceCount > 0;
  }

  /**
   * Tracks calibration drift
   */
  private trackCalibration(envelope: ConfidenceEnvelope) {
    // If confidence is extremely high but evidence is low, we flag overconfidence
    if (envelope.confidence > 0.9 && envelope.evidenceCount < 2) {
      this.overconfidenceCount++;
      logger.warn('[Calibration] Overconfidence detected: high score with sparse evidence.');
    }
    // If confidence is low but evidence is high, flag underconfidence
    else if (envelope.confidence < 0.4 && envelope.evidenceCount > 10) {
      this.underconfidenceCount++;
      logger.warn('[Calibration] Underconfidence detected: low score despite dense evidence.');
    }
  }
}
