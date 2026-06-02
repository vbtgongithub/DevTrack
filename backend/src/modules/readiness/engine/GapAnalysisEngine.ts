import { CareerIntent } from '../../../db/models/careerIntent.model.js';
import { logger } from '../../../shared/logger.js';

export const GapAnalysisEngine = {
  async analyzeGaps(userId: string, dsaData: any, projectData: any): Promise<string[]> {
    try {
      const intent = await CareerIntent.findOne({ userId });
      if (!intent) return ['Set career intent to receive gap analysis.'];

      const gaps: string[] = [];

      if (intent.dreamRole.includes('Backend')) {
        if (!projectData?.systemDesignSignals?.hasRedis) {
          gaps.push('Strong backend execution but limited infrastructure exposure (missing Redis).');
        }
        if (!projectData?.systemDesignSignals?.hasDocker) {
          gaps.push('Missing containerization and deployment maturity.');
        }
      }

      if (dsaData?.hardProblemProgression < 20) {
        gaps.push('Excellent medium DP progression but insufficient Hard problem depth.');
      }

      logger.info('[GapAnalysisEngine] Computed gaps', { userId, gapCount: gaps.length });
      return gaps;
    } catch (error) {
      logger.error('[GapAnalysisEngine] Failed to compute gaps', { userId, error });
      return [];
    }
  }
};
