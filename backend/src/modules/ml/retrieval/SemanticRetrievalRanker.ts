// src/modules/ml/retrieval/SemanticRetrievalRanker.ts
// Re-ranks retrieval outputs using semantic relevance, engineering depth,
// role alignment, ATS similarity, and roadmap progression.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, RankedItem, RankingPrediction } from '../types.js';
import { RankingModelBase } from '../ranking/RankingModelBase.js';

interface RetrievalCandidate {
  id: string;
  semanticScore: number;
  lexicalScore: number;
  engineeringDepthSignal: number;
  roleAlignmentSignal: number;
  atsSimilaritySignal: number;
  roadmapProgressionSignal: number;
  infraMaturitySignal: number;
  projectAuthenticitySignal: number;
  recencySignal: number;
  evidenceStrength: number;
}

/**
 * SemanticRetrievalRanker
 *
 * Re-ranks retrieval outputs using ML-augmented scoring.
 * Combines semantic relevance with engineering quality signals
 * to produce high-signal, calibrated retrieval results.
 *
 * Features:
 * - Cross-encoder style re-ranking
 * - Signal fusion across semantic, lexical, and quality dimensions
 * - Calibrated confidence per retrieval result
 * - Explainable re-ranking decisions
 */
export class SemanticRetrievalRanker extends RankingModelBase {
  constructor() {
    super('SemanticRetrievalRanker');
    logger.info('[SemanticRetrievalRanker] Initialized');
  }

  extractFeatures(input: RetrievalCandidate): FeatureVector {
    return {
      values: [
        input.semanticScore,
        input.lexicalScore,
        input.engineeringDepthSignal,
        input.roleAlignmentSignal,
        input.atsSimilaritySignal,
        input.roadmapProgressionSignal,
        input.infraMaturitySignal,
        input.projectAuthenticitySignal,
        input.recencySignal,
        input.evidenceStrength,
        // Composite features
        input.semanticScore * input.roleAlignmentSignal,     // role-relevant semantic match
        input.lexicalScore * input.atsSimilaritySignal,      // ATS-relevant lexical match
        (input.engineeringDepthSignal + input.infraMaturitySignal) / 2, // quality signal
        input.semanticScore * input.evidenceStrength,        // evidence-backed semantic
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Re-rank a set of retrieval candidates.
   * Returns ordered results with confidence and explanation.
   */
  rerank(candidates: RetrievalCandidate[]): RankingPrediction {
    const start = Date.now();
    logger.info(`[SemanticRetrievalRanker] Re-ranking ${candidates.length} candidates`);

    const items: RankedItem[] = candidates.map(candidate => {
      const features = this.extractFeatures(candidate);
      const prediction = this.predict(features);
      const { explanation } = this.explain(features);

      return {
        id: candidate.id,
        rank: 0,
        score: prediction.score,
        confidence: prediction.confidence,
        featureImportance: prediction.featureImportance,
        explanation,
      };
    });

    // Sort by re-ranked score
    items.sort((a, b) => b.score - a.score);
    items.forEach((item, i) => { item.rank = i + 1; });

    return {
      items,
      modelId: this.modelId,
      modelVersion: this.modelVersion,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Compute retrieval quality metrics.
   */
  assessRetrievalQuality(candidates: RetrievalCandidate[]): {
    averageSemanticScore: number;
    averageConfidence: number;
    signalCoverage: number;
    calibrationEstimate: number;
  } {
    if (candidates.length === 0) {
      return { averageSemanticScore: 0, averageConfidence: 0, signalCoverage: 0, calibrationEstimate: 0 };
    }

    const reranked = this.rerank(candidates);
    const avgSemantic = candidates.reduce((s, c) => s + c.semanticScore, 0) / candidates.length;
    const avgConfidence = reranked.items.reduce((s, i) => s + i.confidence, 0) / reranked.items.length;

    // Signal coverage: how many non-zero signals per candidate
    const signalFields: (keyof RetrievalCandidate)[] = [
      'semanticScore', 'lexicalScore', 'engineeringDepthSignal',
      'roleAlignmentSignal', 'atsSimilaritySignal', 'roadmapProgressionSignal',
      'infraMaturitySignal', 'projectAuthenticitySignal', 'evidenceStrength',
    ];
    const totalSignals = candidates.length * signalFields.length;
    const nonZeroSignals = candidates.reduce((sum, c) =>
      sum + signalFields.filter(f => (c[f] as number) > 0).length, 0,
    );
    const signalCoverage = totalSignals > 0 ? nonZeroSignals / totalSignals : 0;

    return {
      averageSemanticScore: avgSemantic,
      averageConfidence: avgConfidence,
      signalCoverage,
      calibrationEstimate: avgConfidence * signalCoverage,
    };
  }

  protected getFeatureNames(): string[] {
    return [
      'semantic_score',
      'lexical_score',
      'engineering_depth',
      'role_alignment',
      'ats_similarity',
      'roadmap_progression',
      'infra_maturity',
      'project_authenticity',
      'recency',
      'evidence_strength',
      'role_semantic_interaction',
      'ats_lexical_interaction',
      'quality_composite',
      'evidence_semantic_interaction',
    ];
  }
}
