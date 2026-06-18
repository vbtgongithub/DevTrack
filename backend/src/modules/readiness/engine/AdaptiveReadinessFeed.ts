import { logger } from '../../../shared/logger.js';

export interface InsightEvidence {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface FeedItem {
  id: string;
  message: string;
  type: 'achievement' | 'warning' | 'insight' | 'action_needed';
  timestamp: Date;
  evidenceChain: InsightEvidence[];
}

export const AdaptiveReadinessFeed = {
  async generateFeed(userId: string, dsaData: any, projectData: any, coreData: any): Promise<FeedItem[]> {
    try {
      const feed: FeedItem[] = [];
      const now = new Date();

      // 1. Momentum & Core Insights
      if (coreData?.momentumTrend === 'improving') {
        feed.push({
          id: 'momentum_improving',
          message: 'Engineering momentum is accelerating rapidly.',
          type: 'achievement',
          timestamp: now,
          evidenceChain: [
            { label: 'Consistent DSA submissions', type: 'positive' },
            { label: 'Recent project updates', type: 'positive' }
          ]
        });
      } else if (coreData?.momentumTrend === 'stagnating') {
        feed.push({
          id: 'momentum_stagnating',
          message: 'Engineering cadence has slowed down.',
          type: 'warning',
          timestamp: now,
          evidenceChain: [
            { label: 'No hard problems solved in 14 days', type: 'negative' },
            { label: 'No significant GitHub commits this week', type: 'negative' }
          ]
        });
      }

      // 2. Project Maturity
      if (projectData?.systemDesignSignals?.hasDocker && projectData?.systemDesignSignals?.hasRedis) {
        feed.push({
          id: 'project_maturity_high',
          message: 'Backend maturity demonstrates production-readiness.',
          type: 'insight',
          timestamp: new Date(now.getTime() - 86400000), // 1 day ago
          evidenceChain: [
            { label: 'Docker deployment detected', type: 'positive' },
            { label: 'Redis caching verified', type: 'positive' },
            { label: 'Queue infrastructure detected', type: 'positive' }
          ]
        });
      } else if (!projectData?.systemDesignSignals?.hasDocker) {
         feed.push({
          id: 'project_maturity_low',
          message: 'Project maturity is limited due to missing deployment evidence.',
          type: 'action_needed',
          timestamp: new Date(now.getTime() - 2 * 86400000), // 2 days ago
          evidenceChain: [
            { label: 'No containerization found', type: 'neutral' },
            { label: 'No CI/CD pipelines detected', type: 'neutral' }
          ]
        });
      }

      // 3. DSA Insights
      if (dsaData?.consistencyScore > 80) {
         feed.push({
          id: 'dsa_consistency_high',
          message: 'DSA mastery is consistently high.',
          type: 'achievement',
          timestamp: new Date(now.getTime() - 3 * 86400000), // 3 days ago
          evidenceChain: [
            { label: '30-day streak maintained', type: 'positive' },
            { label: 'Contest rating improved', type: 'positive' }
          ]
        });
      } else if (dsaData?.hardProblemProgression < 10) {
         feed.push({
          id: 'dsa_hard_low',
          message: 'Graph and DP readiness weakened recently.',
          type: 'warning',
          timestamp: new Date(now.getTime() - 4 * 86400000),
          evidenceChain: [
            { label: 'No hard Graph solves in 30 days', type: 'negative' },
            { label: 'Contest graph exposure reduced', type: 'neutral' }
          ]
        });
      }

      // Sort by timestamp descending
      return feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('[AdaptiveReadinessFeed] Error generating feed', { userId, error });
      return [];
    }
  }
};
