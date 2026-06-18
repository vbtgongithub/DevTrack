import { logger } from '../../../shared/logger.js';
import { CareerIntent } from '../../../db/models/careerIntent.model.js';
import { RecommendationMemory } from '../../../db/models/recommendationMemory.model.js';

export interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'dsa' | 'project' | 'core';
  actionUrl?: string;
  why: string;
}

export const NextBestActionEngine = {
  async computeActions(userId: string, dsaData: any, projectData: any): Promise<NextBestAction[]> {
    try {
      const intent = await CareerIntent.findOne({ userId });
      const actions: NextBestAction[] = [];

      // 1. Check DSA
      if (dsaData?.hardProblemProgression < 20) {
        actions.push({
          id: 'dsa_hard_problems',
          title: 'Solve 5 Hard Graph Problems',
          description: 'Your Graph consistency is good, but hard problem exposure is limiting your readiness.',
          priority: 'high',
          category: 'dsa',
          actionUrl: '/dsa/practice?difficulty=hard&topic=graph',
          why: 'Interviews for your target tier frequently test hard graph concepts.'
        });
      } else if (dsaData?.consistencyScore < 50) {
         actions.push({
          id: 'dsa_consistency',
          title: 'Restore DSA Momentum',
          description: 'Solve 1 problem daily for the next 3 days to rebuild your streak.',
          priority: 'high',
          category: 'dsa',
          why: 'Consistency drop detected over the past week.'
        });
      }

      // 2. Check Projects based on intent
      const isBackendFocused = intent?.dreamRole?.toLowerCase().includes('backend') || intent?.dreamRole?.toLowerCase().includes('full');
      const isFrontendFocused = intent?.dreamRole?.toLowerCase().includes('frontend') || intent?.dreamRole?.toLowerCase().includes('full');

      if (isBackendFocused) {
        if (!projectData?.systemDesignSignals?.hasRedis) {
          actions.push({
            id: 'project_redis',
            title: 'Add Redis Caching',
            description: 'Implement Redis in one of your active backend projects to demonstrate infrastructure maturity.',
            priority: 'high',
            category: 'project',
            why: 'Missing infrastructure layer heavily expected for backend roles.'
          });
        }
        if (!projectData?.systemDesignSignals?.hasDocker) {
           actions.push({
            id: 'project_docker',
            title: 'Containerize Backend with Docker',
            description: 'Add a Dockerfile and docker-compose to your main API project.',
            priority: 'medium',
            category: 'project',
            why: 'Deployment maturity is currently a blocker.'
          });
        }
      }

      if (isFrontendFocused) {
        if (!projectData?.systemDesignSignals?.hasStateManagement) {
           actions.push({
            id: 'project_state',
            title: 'Implement Global State Management',
            description: 'Refactor your frontend project to use Redux, Zustand, or Context API.',
            priority: 'high',
            category: 'project',
            why: 'Complex state management is a core frontend expectation.'
          });
        }
      }

      // Filter through Recommendation Memory
      const validActions: NextBestAction[] = [];
      for (const action of actions) {
        let memory = await RecommendationMemory.findOne({ userId, recommendationId: action.id });
        if (!memory) {
          // New action, add to memory and list
          memory = await RecommendationMemory.create({
             userId,
             recommendationId: action.id,
             status: 'active'
          });
          validActions.push(action);
        } else if (memory.status === 'active') {
          // Existing active action
          memory.shownCount += 1;
          memory.lastShownAt = new Date();
          await memory.save();
          validActions.push(action);
        }
        // If completed or ignored, we don't show it immediately (could add cooldown logic here)
      }

      // Return top 3 actions
      return validActions.slice(0, 3);
    } catch (error) {
      logger.error('[NextBestActionEngine] Error computing actions', { userId, error });
      return [];
    }
  }
};
