import { IntelligenceResult, EvaluationContract } from '../types/index.js';
import { logger } from '../../shared/logger.js';

export class IntelligenceEvaluator {
  private readonly EVAL_VERSION = 'v1';

  /**
   * Evaluates ranking consistency across a batch of candidates
   */
  evaluateRankingConsistency(batchResults: any[], expectedDistribution: any): EvaluationContract {
    const failure_modes: string[] = [];
    
    // In production, compare current batch percentiles against expected bell curve
    let consistencyScore = 0.92; // Mock computation
    
    if (batchResults.length < 50) {
      failure_modes.push('sample_size_too_small_for_statistical_significance');
      consistencyScore -= 0.2;
    }

    return {
      score: consistencyScore,
      confidence: batchResults.length > 100 ? 0.95 : 0.70,
      sample_size: batchResults.length,
      failure_modes,
      evaluation_version: this.EVAL_VERSION
    };
  }

  /**
   * Evaluates semantic retrieval precision
   */
  evaluateRetrievalPrecision(retrievedSet: any[], groundTruth: any[]): EvaluationContract {
    const failure_modes: string[] = [];
    
    const relevantRetrieved = retrievedSet.filter(r => groundTruth.includes(r.id));
    const precision = retrievedSet.length > 0 ? relevantRetrieved.length / retrievedSet.length : 0;

    if (precision < 0.6) {
      failure_modes.push('high_semantic_drift_detected');
    }

    return {
      score: precision,
      confidence: groundTruth.length > 10 ? 0.88 : 0.50,
      sample_size: retrievedSet.length,
      failure_modes,
      evaluation_version: this.EVAL_VERSION
    };
  }

  /**
   * Evaluates ATS calibration stability
   */
  evaluateCalibrationStability(currentScores: number[], historicalMean: number): EvaluationContract {
    const failure_modes: string[] = [];
    
    const currentMean = currentScores.reduce((a, b) => a + b, 0) / currentScores.length;
    const deviation = Math.abs(currentMean - historicalMean);
    
    const stabilityScore = Math.max(0, 1 - (deviation / 100));

    if (deviation > 5) {
      failure_modes.push('calibration_mean_drift_exceeds_threshold');
    }

    return {
      score: stabilityScore,
      confidence: currentScores.length > 500 ? 0.99 : 0.80,
      sample_size: currentScores.length,
      failure_modes,
      evaluation_version: this.EVAL_VERSION
    };
  }

  /**
   * Evaluates the causal impact of recommendations or interventions.
   */
  evaluateInterventionImpact(interventions: any[], outcomes: any[]): EvaluationContract {
    const failure_modes: string[] = [];
    let positiveOutcomes = 0;

    interventions.forEach((intervention, idx) => {
      // Simplistic causal correlation
      if (outcomes[idx] && outcomes[idx].competitivenessDelta > 0) {
        positiveOutcomes++;
      }
    });

    const impactScore = interventions.length > 0 ? positiveOutcomes / interventions.length : 0;
    
    if (impactScore < 0.2) {
      failure_modes.push('low_intervention_efficacy');
    }

    return {
      score: impactScore,
      confidence: interventions.length > 50 ? 0.90 : 0.40,
      sample_size: interventions.length,
      failure_modes,
      evaluation_version: this.EVAL_VERSION
    };
  }
}
