import { logger } from '../../../shared/logger.js';
import { ReadinessCore } from '../../../db/models/readinessCore.model.js';

export const ReadinessMomentumEngine = {
  async computeMomentum(userId: string, dsaData: any, projectData: any): Promise<'improving' | 'stagnating' | 'declining'> {
    try {
      // In a real system, this would query historical data (e.g., daily activity snapshots).
      // For now, we compute based on current activity signals.
      let positiveSignals = 0;
      let negativeSignals = 0;

      if (dsaData?.recentSubmissionsCount && dsaData.recentSubmissionsCount > 5) {
        positiveSignals++;
      } else {
        negativeSignals++;
      }

      if (dsaData?.consistencyScore > 70) {
        positiveSignals++;
      } else if (dsaData?.consistencyScore < 40) {
        negativeSignals++;
      }

      if (projectData?.recentCommitsCount && projectData.recentCommitsCount > 10) {
        positiveSignals++;
      } else {
        negativeSignals++;
      }

      let newMomentum: 'improving' | 'stagnating' | 'declining' = 'stagnating';

      if (positiveSignals > negativeSignals && positiveSignals >= 2) {
        newMomentum = 'improving';
      } else if (negativeSignals > positiveSignals) {
        newMomentum = 'declining';
      }

      // Update core
      await ReadinessCore.updateOne({ userId }, { momentumTrend: newMomentum });

      return newMomentum;
    } catch (error) {
      logger.error('[ReadinessMomentumEngine] Error computing momentum', { userId, error });
      return 'stagnating';
    }
  }
};
