import { logger } from '../../../shared/logger.js';
import { CareerIntent } from '../../../db/models/careerIntent.model.js';

export interface RoleAlignment {
  role: string;
  matchScore: number; // 0-100
  strongAreas: string[];
  weakAreas: string[];
}

export const RoleAlignmentEngine = {
  async evaluateAlignment(userId: string, dsaData: any, projectData: any): Promise<RoleAlignment> {
    try {
      const intent = await CareerIntent.findOne({ userId });
      const targetRole = intent?.dreamRole || 'Software Engineer';
      
      const alignment: RoleAlignment = {
        role: targetRole,
        matchScore: 0,
        strongAreas: [],
        weakAreas: []
      };

      const isBackend = targetRole.toLowerCase().includes('backend') || targetRole.toLowerCase().includes('full');
      const isFrontend = targetRole.toLowerCase().includes('frontend') || targetRole.toLowerCase().includes('full');

      let score = 50; // Base score

      if (isBackend) {
        if (projectData?.systemDesignSignals?.hasRedis) {
          score += 15;
          alignment.strongAreas.push('Caching Infrastructure (Redis)');
        } else {
          alignment.weakAreas.push('Missing caching infrastructure');
        }

        if (projectData?.systemDesignSignals?.hasDocker) {
          score += 15;
          alignment.strongAreas.push('Containerization (Docker)');
        } else {
          alignment.weakAreas.push('Missing container deployment');
        }
      }

      if (isFrontend) {
        if (projectData?.systemDesignSignals?.hasStateManagement) {
          score += 20;
          alignment.strongAreas.push('State Management Architecture');
        } else {
          alignment.weakAreas.push('Missing global state management');
        }
        
        if (projectData?.systemDesignSignals?.hasResponsiveDesign) {
          score += 10;
          alignment.strongAreas.push('Responsive UI');
        }
      }

      // General DSA expectations
      if (dsaData?.overallScore > 70) {
        score += 20;
        alignment.strongAreas.push('Strong Algorithmic Foundation');
      } else {
        alignment.weakAreas.push('Algorithmic problem-solving needs improvement');
      }

      alignment.matchScore = Math.min(Math.max(score, 0), 100);

      return alignment;
    } catch (error) {
      logger.error('[RoleAlignmentEngine] Error evaluating alignment', { userId, error });
      return {
        role: 'Unknown',
        matchScore: 0,
        strongAreas: [],
        weakAreas: []
      };
    }
  }
};
