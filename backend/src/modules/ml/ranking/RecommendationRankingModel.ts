// src/modules/ml/ranking/RecommendationRankingModel.ts
// LambdaMART-style pairwise ranking model for recommendation priority.
// Uses pairwise ranking loss semantics for ordering recommendations.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, RankedItem, RankingPrediction } from '../types.js';
import { RankingModelBase } from './RankingModelBase.js';

interface RecommendationInput {
  recommendationId: string;
  relevanceScore: number;
  urgencyScore: number;
  impactScore: number;
  readinessGap: number;
  atsImprovementPotential: number;
  progressionAlignment: number;
  prerequisiteSatisfaction: number;
  timeToCompletion: number;
  difficultyLevel: number;
  outcomeHistorySuccess: number;
  roadmapAlignment: number;
  skillGapReduction: number;
  recruiterValueAdd: number;
  placementProbabilityImpact: number;
}

/**
 * RecommendationRankingModel
 *
 * LambdaMART-style gradient boosted model for recommendation priority ranking.
 * Uses pairwise comparison semantics to order recommendations by expected impact.
 * Outputs ranked list with per-item explanations.
 */
export class RecommendationRankingModel extends RankingModelBase {
  constructor() {
    super('RecommendationRankingModel');
    logger.info(`[RecommendationRankingModel] Initialized with model ${this.modelId}`);
  }

  extractFeatures(input: RecommendationInput): FeatureVector {
    return {
      values: [
        input.relevanceScore,
        input.urgencyScore,
        input.impactScore,
        input.readinessGap,
        input.atsImprovementPotential,
        input.progressionAlignment,
        input.prerequisiteSatisfaction,
        Math.max(0, 1 - input.timeToCompletion / 100), // normalize and invert
        1 - input.difficultyLevel,                      // easier = higher initial priority
        input.outcomeHistorySuccess,
        input.roadmapAlignment,
        input.skillGapReduction,
        input.recruiterValueAdd,
        input.placementProbabilityImpact,
        // Composite features
        input.impactScore * input.urgencyScore,          // urgency-weighted impact
        input.relevanceScore * input.prerequisiteSatisfaction, // actionability
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Rank recommendations by priority.
   * Returns ordered list with per-recommendation explanations.
   */
  rankRecommendations(inputs: RecommendationInput[]): RankingPrediction {
    const start = Date.now();
    logger.info(`[RecommendationRankingModel] Ranking ${inputs.length} recommendations`);

    const scored: RankedItem[] = inputs.map((input) => {
      const features = this.extractFeatures(input);
      const prediction = this.predict(features);
      const { explanation } = this.explain(features);

      return {
        id: input.recommendationId,
        rank: 0, // assigned after sorting
        score: prediction.score,
        confidence: prediction.confidence,
        featureImportance: prediction.featureImportance,
        explanation,
      };
    });

    // Apply pairwise comparison adjustment
    this.applyPairwiseAdjustment(scored);

    // Sort by adjusted score
    scored.sort((a, b) => b.score - a.score);

    // Assign ranks
    scored.forEach((item, index) => { item.rank = index + 1; });

    return {
      items: scored,
      modelId: this.modelId,
      modelVersion: this.modelVersion,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pairwise ranking adjustment (LambdaMART-style).
   * Adjusts scores based on pairwise comparisons to improve ranking quality.
   */
  private applyPairwiseAdjustment(items: RankedItem[]): void {
    const lambda = 0.1;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const scoreDiff = items[i].score - items[j].score;
        const pairProb = this.sigmoid(scoreDiff);

        // Lambda gradient: push apart items that should be separated
        const lambdaGrad = lambda * (1 - pairProb);
        const ndcgDelta = this.computeNDCGDelta(i, j, items.length);

        items[i].score += lambdaGrad * ndcgDelta;
        items[j].score -= lambdaGrad * ndcgDelta;
      }
    }
  }

  private computeNDCGDelta(i: number, j: number, n: number): number {
    const discountI = 1 / Math.log2(i + 2);
    const discountJ = 1 / Math.log2(j + 2);
    return Math.abs(discountI - discountJ);
  }

  protected getFeatureNames(): string[] {
    return [
      'relevance',
      'urgency',
      'impact',
      'readiness_gap',
      'ats_improvement_potential',
      'progression_alignment',
      'prerequisite_satisfaction',
      'time_efficiency',
      'difficulty_inverse',
      'outcome_history',
      'roadmap_alignment',
      'skill_gap_reduction',
      'recruiter_value_add',
      'placement_probability_impact',
      'urgency_weighted_impact',
      'actionability',
    ];
  }
}
