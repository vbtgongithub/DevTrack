// src/modules/ml/recommendation/RecommendationLearningEngine.ts
// Trains on recommendation outcomes to improve relevance, prioritization,
// and progression sequencing. Outcome-aware recommendations.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, MLPrediction, TrainingSample } from '../types.js';
import { RankingModelBase } from '../ranking/RankingModelBase.js';

interface RecommendationOutcome {
  recommendationId: string;
  type: 'readiness' | 'ats' | 'progression' | 'roadmap' | 'placement';
  accepted: boolean;
  completedAt: string | null;
  impactScore: number;        // 0–1 measured improvement
  timeToCompletionDays: number;
  userSatisfaction: number;   // 0–1
}

interface LearningInput {
  readinessImprovement: number;
  atsImprovement: number;
  progressionSuccess: number;
  roadmapCompletion: number;
  placementOutcome: number;
  acceptanceRate: number;
  completionRate: number;
  averageTimeToCompletion: number;
  userSatisfaction: number;
  relevanceScore: number;
  prerequisiteSatisfied: number;
  difficultyAppropriateness: number;
  sequencingOptimality: number;
  priorOutcomeSuccessRate: number;
  contextualRelevance: number;
}

interface LearningInsight {
  pattern: string;
  significance: number;
  recommendation: string;
}

/**
 * RecommendationLearningEngine
 *
 * Learns from recommendation outcomes to improve future recommendations.
 * Trains models on:
 * - recommendation acceptance/completion
 * - readiness improvements
 * - ATS improvements
 * - progression success
 * - roadmap completion
 * - placement outcomes
 *
 * Improves: relevance, prioritization, and progression sequencing.
 * All recommendations remain outcome-aware.
 */
export class RecommendationLearningEngine extends RankingModelBase {
  private outcomeHistory: RecommendationOutcome[] = [];
  private insights: LearningInsight[] = [];
  private lastTrainingTimestamp: string | null = null;

  constructor() {
    super('RecommendationLearningEngine');
    logger.info('[RecommendationLearningEngine] Initialized');
  }

  /**
   * Record an outcome for a recommendation.
   */
  recordOutcome(outcome: RecommendationOutcome): void {
    this.outcomeHistory.push(outcome);
    logger.info(`[RecommendationLearningEngine] Recorded outcome for ${outcome.recommendationId}: impact=${outcome.impactScore}`);

    // Auto-retrain when enough new data
    if (this.outcomeHistory.length % 50 === 0) {
      this.retrain();
    }
  }

  /**
   * Predict recommendation quality (expected impact) for a new recommendation.
   */
  predictRecommendationQuality(input: LearningInput): MLPrediction & { expectedImpact: number; sequencingScore: number } {
    const features = this.extractFeatures(input);
    const prediction = this.predict(features);

    return {
      ...prediction,
      expectedImpact: prediction.score,
      sequencingScore: input.sequencingOptimality * prediction.confidence,
    };
  }

  /**
   * Get learned insights about recommendation effectiveness.
   */
  getInsights(): LearningInsight[] {
    return this.insights;
  }

  /**
   * Retrain the model using accumulated outcomes.
   */
  retrain(): void {
    if (this.outcomeHistory.length < 10) {
      logger.info('[RecommendationLearningEngine] Not enough data to retrain');
      return;
    }

    logger.info(`[RecommendationLearningEngine] Retraining with ${this.outcomeHistory.length} outcomes`);

    // Convert outcomes to training samples
    const samples: { features: number[]; label: number }[] = this.outcomeHistory.map(outcome => ({
      features: [
        outcome.impactScore,
        outcome.accepted ? 1 : 0,
        outcome.completedAt ? 1 : 0,
        Math.max(0, 1 - outcome.timeToCompletionDays / 30),
        outcome.userSatisfaction,
        outcome.type === 'readiness' ? 1 : 0,
        outcome.type === 'ats' ? 1 : 0,
        outcome.type === 'progression' ? 1 : 0,
        outcome.type === 'roadmap' ? 1 : 0,
        outcome.type === 'placement' ? 1 : 0,
        // Padding to match feature count
        outcome.impactScore * outcome.userSatisfaction,
        outcome.accepted && outcome.completedAt ? 1 : 0,
        Math.min(1, outcome.impactScore * 1.5),
        outcome.accepted ? outcome.userSatisfaction : 0,
        outcome.impactScore > 0.5 ? 1 : 0,
      ],
      label: outcome.impactScore,
    }));

    this.train(samples, { numTrees: 30, maxDepth: 3, learningRate: 0.1 });
    this.lastTrainingTimestamp = new Date().toISOString();

    // Generate insights from trained model
    this.generateInsights();

    logger.info('[RecommendationLearningEngine] Retraining complete');
  }

  extractFeatures(input: LearningInput): FeatureVector {
    return {
      values: [
        input.readinessImprovement,
        input.atsImprovement,
        input.progressionSuccess,
        input.roadmapCompletion,
        input.placementOutcome,
        input.acceptanceRate,
        input.completionRate,
        Math.max(0, 1 - input.averageTimeToCompletion / 30),
        input.userSatisfaction,
        input.relevanceScore,
        input.prerequisiteSatisfied,
        input.difficultyAppropriateness,
        input.sequencingOptimality,
        input.priorOutcomeSuccessRate,
        input.contextualRelevance,
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Get recommendation statistics.
   */
  getStatistics(): {
    totalOutcomes: number;
    acceptanceRate: number;
    completionRate: number;
    averageImpact: number;
    averageSatisfaction: number;
    lastTraining: string | null;
  } {
    const total = this.outcomeHistory.length;
    if (total === 0) {
      return {
        totalOutcomes: 0, acceptanceRate: 0, completionRate: 0,
        averageImpact: 0, averageSatisfaction: 0, lastTraining: null,
      };
    }

    return {
      totalOutcomes: total,
      acceptanceRate: this.outcomeHistory.filter(o => o.accepted).length / total,
      completionRate: this.outcomeHistory.filter(o => o.completedAt).length / total,
      averageImpact: this.outcomeHistory.reduce((s, o) => s + o.impactScore, 0) / total,
      averageSatisfaction: this.outcomeHistory.reduce((s, o) => s + o.userSatisfaction, 0) / total,
      lastTraining: this.lastTrainingTimestamp,
    };
  }

  private generateInsights(): void {
    const importance = this.getFeatureImportance();
    this.insights = [];

    // Top drivers
    const sorted = [...importance].sort((a, b) => b.importance - a.importance);
    for (const fi of sorted.slice(0, 5)) {
      if (fi.importance > 0.1) {
        this.insights.push({
          pattern: `${fi.featureName} is a strong predictor of recommendation success`,
          significance: fi.importance,
          recommendation: `Prioritize recommendations with high ${fi.featureName}`,
        });
      }
    }
  }

  protected getFeatureNames(): string[] {
    return [
      'readiness_improvement',
      'ats_improvement',
      'progression_success',
      'roadmap_completion',
      'placement_outcome',
      'acceptance_rate',
      'completion_rate',
      'time_efficiency',
      'user_satisfaction',
      'relevance_score',
      'prerequisite_satisfied',
      'difficulty_appropriateness',
      'sequencing_optimality',
      'prior_outcome_success_rate',
      'contextual_relevance',
    ];
  }
}
