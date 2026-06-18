// src/modules/ml/ranking/ATSOptimizationRanker.ts
// ATS keyword optimization model.
// Outputs ATS compatibility weighting and keyword improvement priorities.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, MLPrediction } from '../types.js';
import { RankingModelBase } from './RankingModelBase.js';

interface ATSOptimizationInput {
  keywordMatchRatio: number;
  exactMatchCount: number;
  semanticMatchCount: number;
  missingKeywordCount: number;
  keywordDensity: number;
  sectionCompleteness: number;
  formatScore: number;
  bulletQuantification: number;
  actionVerbUsage: number;
  lengthOptimality: number;
  headerStandardization: number;
  contactInfoCompleteness: number;
  educationFormatScore: number;
  experienceFormatScore: number;
  skillsSectionScore: number;
  parsabilityScore: number;
  duplicateKeywordPenalty: number;
  keywordPlacementScore: number;
}

interface ATSOptimizationResult extends MLPrediction {
  optimizationPriorities: { area: string; priority: number; suggestion: string }[];
  estimatedATSPassRate: number;
}

/**
 * ATSOptimizationRanker
 *
 * Gradient boosted model for ATS optimization scoring.
 * Predicts ATS pass probability and generates keyword optimization priorities.
 * All outputs are explainable and confidence-bounded.
 */
export class ATSOptimizationRanker extends RankingModelBase {
  constructor() {
    super('ATSOptimizationRanker');
    logger.info(`[ATSOptimizationRanker] Initialized with model ${this.modelId}`);
  }

  extractFeatures(input: ATSOptimizationInput): FeatureVector {
    return {
      values: [
        input.keywordMatchRatio,
        input.exactMatchCount / 20,          // normalize
        input.semanticMatchCount / 20,
        Math.max(0, 1 - input.missingKeywordCount / 10), // fewer missing = better
        input.keywordDensity,
        input.sectionCompleteness,
        input.formatScore,
        input.bulletQuantification,
        input.actionVerbUsage,
        input.lengthOptimality,
        input.headerStandardization,
        input.contactInfoCompleteness,
        input.educationFormatScore,
        input.experienceFormatScore,
        input.skillsSectionScore,
        input.parsabilityScore,
        Math.max(0, 1 - input.duplicateKeywordPenalty), // penalize duplicates
        input.keywordPlacementScore,
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Score ATS optimization and generate improvement priorities.
   */
  scoreATSOptimization(input: ATSOptimizationInput): ATSOptimizationResult {
    const features = this.extractFeatures(input);
    const prediction = this.predict(features);
    const { explanation, featureContributions } = this.explain(features);

    // Generate prioritized optimization suggestions
    const priorities = this.generateOptimizationPriorities(input, featureContributions);

    // Estimate ATS pass rate from score
    const estimatedATSPassRate = Math.min(0.99, Math.max(0.01, prediction.score * 0.95 + 0.05));

    return {
      ...prediction,
      optimizationPriorities: priorities,
      estimatedATSPassRate,
    };
  }

  private generateOptimizationPriorities(
    input: ATSOptimizationInput,
    contributions: Record<string, number>,
  ): { area: string; priority: number; suggestion: string }[] {
    const priorities: { area: string; priority: number; suggestion: string }[] = [];

    if (input.missingKeywordCount > 3) {
      priorities.push({
        area: 'keyword_coverage',
        priority: 0.9,
        suggestion: `Add ${input.missingKeywordCount} missing keywords to improve match ratio`,
      });
    }

    if (input.bulletQuantification < 0.5) {
      priorities.push({
        area: 'bullet_quantification',
        priority: 0.8,
        suggestion: 'Quantify achievements in bullet points (numbers, percentages, metrics)',
      });
    }

    if (input.actionVerbUsage < 0.6) {
      priorities.push({
        area: 'action_verbs',
        priority: 0.7,
        suggestion: 'Start bullet points with strong action verbs',
      });
    }

    if (input.sectionCompleteness < 0.8) {
      priorities.push({
        area: 'section_completeness',
        priority: 0.75,
        suggestion: 'Complete all standard resume sections',
      });
    }

    if (input.formatScore < 0.7) {
      priorities.push({
        area: 'formatting',
        priority: 0.65,
        suggestion: 'Improve ATS-friendly formatting (avoid tables, images, complex layouts)',
      });
    }

    if (input.parsabilityScore < 0.8) {
      priorities.push({
        area: 'parsability',
        priority: 0.85,
        suggestion: 'Ensure resume is parsable by ATS systems (use standard fonts, simple layout)',
      });
    }

    // Sort by priority descending
    priorities.sort((a, b) => b.priority - a.priority);
    return priorities;
  }

  protected getFeatureNames(): string[] {
    return [
      'keyword_match_ratio',
      'exact_match_count',
      'semantic_match_count',
      'missing_keyword_inverse',
      'keyword_density',
      'section_completeness',
      'format_score',
      'bullet_quantification',
      'action_verb_usage',
      'length_optimality',
      'header_standardization',
      'contact_info_completeness',
      'education_format',
      'experience_format',
      'skills_section',
      'parsability',
      'duplicate_penalty_inverse',
      'keyword_placement',
    ];
  }
}
