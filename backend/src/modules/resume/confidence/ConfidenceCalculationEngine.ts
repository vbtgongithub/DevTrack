import { logger } from '../../../shared/logger.js';
import { EvidenceCoverageCalculator } from './EvidenceCoverageCalculator.js';
import { SemanticConfidenceScorer } from './SemanticConfidenceScorer.js';
import { FreshnessConfidenceCalculator } from './FreshnessConfidenceCalculator.js';

export class ConfidenceCalculationEngine {
  private coverageCalc = new EvidenceCoverageCalculator();
  private semanticScorer = new SemanticConfidenceScorer();
  private freshnessCalc = new FreshnessConfidenceCalculator();

  calculateOverallConfidence(
    evidenceCount: number, 
    semanticSimilarity: number, 
    lastUpdated: Date
  ): number {
    const coverage = this.coverageCalc.calculateCoverage(evidenceCount);
    const semantic = this.semanticScorer.score(semanticSimilarity);
    const freshness = this.freshnessCalc.calculate(lastUpdated);

    // Weighted average
    const score = (coverage * 0.4) + (semantic * 0.4) + (freshness * 0.2);
    logger.info(`[ConfidenceEngine] Calculated confidence: ${score.toFixed(2)}`);
    return score;
  }
}
