// src/modules/ml/hybrid/HybridRankingEngine.ts
// Fuses deterministic signals + ML ranking signals + semantic similarity
// + confidence weighting → final ranking output.
// Deterministic systems ALWAYS retain governance authority.

import { logger } from '../../../shared/logger.js';
import type { FeatureImportance, MLPrediction } from '../types.js';

interface DeterministicSignal {
  signalName: string;
  value: number;        // 0–1 normalized
  weight: number;       // importance weight
  source: string;       // which deterministic system produced this
}

interface MLRankingSignal {
  modelId: string;
  score: number;
  confidence: number;
  featureImportance: FeatureImportance[];
}

interface SemanticSignal {
  similarityScore: number;
  embeddingSource: string;
  confidence: number;
}

interface HybridRankingInput {
  itemId: string;
  deterministicSignals: DeterministicSignal[];
  mlSignals: MLRankingSignal[];
  semanticSignals: SemanticSignal[];
}

interface HybridRankingOutput {
  itemId: string;
  finalScore: number;
  deterministicComponent: number;
  mlComponent: number;
  semanticComponent: number;
  confidence: number;
  governanceStatus: 'ml_active' | 'ml_suppressed' | 'deterministic_override';
  explanation: string[];
  signalBreakdown: {
    signalName: string;
    contribution: number;
    source: 'deterministic' | 'ml' | 'semantic';
  }[];
}

interface HybridConfig {
  deterministicWeight: number;      // default 0.5
  mlWeight: number;                 // default 0.3
  semanticWeight: number;           // default 0.2
  mlConfidenceThreshold: number;    // below this, suppress ML
  mlMaxInfluence: number;           // cap ML influence (e.g., 0.4)
  deterministicOverrideThreshold: number; // if deterministic confidence > this, override ML
}

/**
 * HybridRankingEngine
 *
 * Fuses deterministic + ML + semantic signals into a final ranking.
 *
 * Architecture:
 *   Deterministic Signals + ML Ranking Signals + Semantic Similarity
 *   + Confidence Weighting → Final Ranking Output
 *
 * CRITICAL INVARIANT:
 *   Deterministic systems ALWAYS retain governance authority.
 *   ML augments ranking quality only — never controls truth.
 */
export class HybridRankingEngine {
  private config: HybridConfig;

  constructor(config?: Partial<HybridConfig>) {
    this.config = {
      deterministicWeight: config?.deterministicWeight ?? 0.5,
      mlWeight: config?.mlWeight ?? 0.3,
      semanticWeight: config?.semanticWeight ?? 0.2,
      mlConfidenceThreshold: config?.mlConfidenceThreshold ?? 0.4,
      mlMaxInfluence: config?.mlMaxInfluence ?? 0.4,
      deterministicOverrideThreshold: config?.deterministicOverrideThreshold ?? 0.9,
    };
    logger.info('[HybridRankingEngine] Initialized', { config: this.config });
  }

  /**
   * Rank a set of items using hybrid deterministic + ML ranking.
   */
  rank(inputs: HybridRankingInput[]): HybridRankingOutput[] {
    logger.info(`[HybridRankingEngine] Ranking ${inputs.length} items`);

    const outputs = inputs.map(input => this.scoreItem(input));

    // Sort by final score descending
    outputs.sort((a, b) => b.finalScore - a.finalScore);

    return outputs;
  }

  /**
   * Score a single item using hybrid signals.
   */
  scoreItem(input: HybridRankingInput): HybridRankingOutput {
    const signalBreakdown: HybridRankingOutput['signalBreakdown'] = [];
    const explanation: string[] = [];

    // 1. Compute deterministic component
    const deterministicComponent = this.computeDeterministicScore(input.deterministicSignals, signalBreakdown);

    // 2. Compute ML component (with confidence gating)
    const { mlComponent, mlConfidence, governanceStatus } = this.computeMLScore(
      input.mlSignals, deterministicComponent, signalBreakdown, explanation,
    );

    // 3. Compute semantic component
    const semanticComponent = this.computeSemanticScore(input.semanticSignals, signalBreakdown);

    // 4. Compute final score with confidence-weighted blending
    const effectiveMLWeight = this.computeEffectiveMLWeight(mlConfidence, governanceStatus);
    const effectiveSemanticWeight = this.config.semanticWeight;
    const effectiveDeterministicWeight = 1 - effectiveMLWeight - effectiveSemanticWeight;

    const finalScore =
      deterministicComponent * effectiveDeterministicWeight +
      mlComponent * effectiveMLWeight +
      semanticComponent * effectiveSemanticWeight;

    // 5. Compute overall confidence
    const confidence = this.computeOverallConfidence(
      input.deterministicSignals, mlConfidence, input.semanticSignals,
    );

    // Add explanation
    explanation.push(
      `Final score: ${finalScore.toFixed(3)} (det: ${(effectiveDeterministicWeight * 100).toFixed(0)}%, ml: ${(effectiveMLWeight * 100).toFixed(0)}%, sem: ${(effectiveSemanticWeight * 100).toFixed(0)}%)`,
    );

    return {
      itemId: input.itemId,
      finalScore,
      deterministicComponent,
      mlComponent,
      semanticComponent,
      confidence,
      governanceStatus,
      explanation,
      signalBreakdown,
    };
  }

  // ---------------------------------------------------------------------------
  // Signal computation
  // ---------------------------------------------------------------------------

  private computeDeterministicScore(
    signals: DeterministicSignal[],
    breakdown: HybridRankingOutput['signalBreakdown'],
  ): number {
    if (signals.length === 0) return 0.5;

    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0) || 1;
    let score = 0;

    for (const signal of signals) {
      const contribution = (signal.value * signal.weight) / totalWeight;
      score += contribution;
      breakdown.push({
        signalName: signal.signalName,
        contribution: contribution,
        source: 'deterministic',
      });
    }

    return Math.max(0, Math.min(1, score));
  }

  private computeMLScore(
    signals: MLRankingSignal[],
    deterministicScore: number,
    breakdown: HybridRankingOutput['signalBreakdown'],
    explanation: string[],
  ): { mlComponent: number; mlConfidence: number; governanceStatus: HybridRankingOutput['governanceStatus'] } {
    if (signals.length === 0) {
      return { mlComponent: 0, mlConfidence: 0, governanceStatus: 'deterministic_override' };
    }

    // Average ML scores weighted by confidence
    let totalConfidence = 0;
    let weightedScore = 0;

    for (const signal of signals) {
      weightedScore += signal.score * signal.confidence;
      totalConfidence += signal.confidence;
    }

    const mlComponent = totalConfidence > 0 ? weightedScore / totalConfidence : 0;
    const mlConfidence = totalConfidence / signals.length;

    // Governance checks
    let governanceStatus: HybridRankingOutput['governanceStatus'] = 'ml_active';

    // Check 1: ML confidence below threshold → suppress
    if (mlConfidence < this.config.mlConfidenceThreshold) {
      governanceStatus = 'ml_suppressed';
      explanation.push(`ML suppressed: confidence ${mlConfidence.toFixed(3)} below threshold ${this.config.mlConfidenceThreshold}`);
    }

    // Check 2: Deterministic score very high → override
    if (deterministicScore > this.config.deterministicOverrideThreshold) {
      governanceStatus = 'deterministic_override';
      explanation.push(`Deterministic override: deterministic score ${deterministicScore.toFixed(3)} exceeds threshold`);
    }

    // Add ML signals to breakdown
    for (const signal of signals) {
      breakdown.push({
        signalName: `ml:${signal.modelId}`,
        contribution: signal.score * signal.confidence / (totalConfidence || 1),
        source: 'ml',
      });
    }

    return { mlComponent, mlConfidence, governanceStatus };
  }

  private computeSemanticScore(
    signals: SemanticSignal[],
    breakdown: HybridRankingOutput['signalBreakdown'],
  ): number {
    if (signals.length === 0) return 0;

    let totalConfidence = 0;
    let weightedScore = 0;

    for (const signal of signals) {
      weightedScore += signal.similarityScore * signal.confidence;
      totalConfidence += signal.confidence;
    }

    const semanticScore = totalConfidence > 0 ? weightedScore / totalConfidence : 0;

    breakdown.push({
      signalName: 'semantic_similarity',
      contribution: semanticScore,
      source: 'semantic',
    });

    return semanticScore;
  }

  private computeEffectiveMLWeight(
    mlConfidence: number,
    governanceStatus: HybridRankingOutput['governanceStatus'],
  ): number {
    if (governanceStatus === 'deterministic_override') return 0;
    if (governanceStatus === 'ml_suppressed') return 0;

    // Scale ML weight by confidence, capped at max influence
    const confidenceScaled = this.config.mlWeight * mlConfidence;
    return Math.min(this.config.mlMaxInfluence, confidenceScaled);
  }

  private computeOverallConfidence(
    deterministicSignals: DeterministicSignal[],
    mlConfidence: number,
    semanticSignals: SemanticSignal[],
  ): number {
    const detConfidence = deterministicSignals.length > 0 ? 0.8 : 0.3; // deterministic is trusted
    const semConfidence = semanticSignals.length > 0
      ? semanticSignals.reduce((sum, s) => sum + s.confidence, 0) / semanticSignals.length
      : 0;

    return detConfidence * 0.5 + mlConfidence * 0.3 + semConfidence * 0.2;
  }
}
