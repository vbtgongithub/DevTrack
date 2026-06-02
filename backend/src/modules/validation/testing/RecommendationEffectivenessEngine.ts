// src/modules/validation/testing/RecommendationEffectivenessEngine.ts
// Validates if recommendations actually lead to progression.

import { logger } from '../../../shared/logger.js';

export interface RecommendationEffectivenessReport {
  recommendationId: string;
  usefulnessScore: number;
  completionImpact: number;
  atsImprovementCorrelation: number;
  infraMaturityImprovement: number;
  isHarmful: boolean;
}

export class RecommendationEffectivenessEngine {
  constructor() {
    logger.info('[RecommendationEffectivenessEngine] Initialized');
  }

  evaluateEffectiveness(
    recommendationId: string,
    beforeMetrics: Record<string, number>,
    afterMetrics: Record<string, number>
  ): RecommendationEffectivenessReport {
    logger.info(`[RecommendationEffectiveness] Evaluating recommendation ${recommendationId}`);
    
    const infraImprov = (afterMetrics.infraMaturity || 0) - (beforeMetrics.infraMaturity || 0);
    const atsImprov = (afterMetrics.atsScore || 0) - (beforeMetrics.atsScore || 0);
    const usefulness = (infraImprov + atsImprov) / 2;

    return {
      recommendationId,
      usefulnessScore: Math.max(0, usefulness),
      completionImpact: usefulness * 1.5,
      atsImprovementCorrelation: atsImprov,
      infraMaturityImprovement: infraImprov,
      isHarmful: usefulness < 0 // A recommendation that regresses metrics
    };
  }
}
