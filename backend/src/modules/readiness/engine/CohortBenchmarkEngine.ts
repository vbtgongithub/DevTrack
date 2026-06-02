import { ReadinessBenchmarks } from '../../../db/models/readinessBenchmarks.model.js';
import { logger } from '../../../shared/logger.js';

export const CohortBenchmarkEngine = {
  async computeBenchmarks(userId: string, targetRole: string, currentScore: number): Promise<void> {
    try {
      // Mocked benchmarking logic
      // In reality, this queries aggregated cohort percentiles pre-computed nightly
      const cohortName = targetRole.includes('Backend') ? 'Backend Aspirants' : 
                         targetRole.includes('Frontend') ? 'Frontend Aspirants' : 'General Engineering';

      const cohortSegments = [
        {
          cohortId: `cohort_${cohortName.toLowerCase().replace(' ', '_')}`,
          cohortName,
          percentileRanking: Math.min(100, Math.floor(currentScore * 1.2)),
          sampleSize: 12450, // Ensures confidence > 0
          confidenceLevel: 'high' as const,
          freshnessTimestamp: new Date(),
          relativeComparisons: [
            {
              metricName: 'DSA Consistency',
              userValue: 80,
              cohortAverage: 65,
              status: 'above' as const
            },
            {
              metricName: 'Project Sophistication',
              userValue: 40,
              cohortAverage: 50,
              status: 'below' as const
            }
          ]
        }
      ];

      await ReadinessBenchmarks.findOneAndUpdate(
        { userId },
        { cohortSegments },
        { upsert: true, new: true }
      );

      logger.info('[CohortBenchmarkEngine] Generated cohort benchmarks', { userId, cohortName });
    } catch (error) {
      logger.error('[CohortBenchmarkEngine] Failed to compute benchmarks', { userId, error });
      throw error;
    }
  }
};
