import { IntelligentRecommendationEngine } from '../recommendation/IntelligentRecommendationEngine.js';
import { DynamicRoadmapExperience } from '../roadmap/DynamicRoadmapExperience.js';
import { ProgressionStateEngine } from '../progression/ProgressionStateEngine.js';
import { RoleAlignmentEngine } from '../role/RoleAlignmentEngine.js';
import { RecommendationMemory } from '../recommendation/RecommendationMemory.js';
import { logger } from '../../../shared/logger.js';

export interface NextBestActionInput {
  userId: string;
  targetRole?: string;
  maxActions?: number;
  context?: 'immediate' | 'short-term' | 'long-term';
}

export interface NextBestAction {
  actionId: string;
  userId: string;
  title: string;
  description: string;
  category: 'dsa' | 'skills' | 'projects' | 'infrastructure' | 'roadmap';
  priority: number; // 0-100
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedImpact: string;
  reasoning: string;
  dependencies: string[];
  blockers: string[];
  confidence: number; // 0-100
  evidence: string[];
  timestamp: Date;
}

class NextBestActionEngineClass {
  /**
   * Generate next best actions
   */
  async generateNextBestActions(input: NextBestActionInput): Promise<NextBestAction[]> {
    const { userId, targetRole, maxActions = 5, context = 'immediate' } = input;
    
    try {
      logger.info('[NextBestActionEngine] Generating next best actions', { userId, targetRole, context });
      
      // Get recommendations
      const recommendations = await IntelligentRecommendationEngine.generateRecommendations({
        userId,
        targetRole,
        maxRecommendations: 10,
      });
      
      // Get dynamic roadmap
      const roadmap = await DynamicRoadmapExperience.generateDynamicRoadmap({ userId, targetRole });
      
      // Get progression state
      const progressionState = await ProgressionStateEngine.analyzeProgressionState({ userId, targetRole });
      
      // Get role alignment (if target role provided)
      let roleAlignment;
      if (targetRole) {
        roleAlignment = await RoleAlignmentEngine.calculateRoleAlignment({ userId, targetRole: targetRole as any });
      }
      
      // Get active recommendations from memory
      const activeRecs = RecommendationMemory.getActiveRecommendations(userId);
      
      // Generate actions from all sources
      const actions: NextBestAction[] = [];
      
      // Convert recommendations to actions
      recommendations.forEach(rec => {
        actions.push(this.recommendationToAction(rec, roadmap, progressionState));
      });
      
      // Add roadmap blocker actions
      if (roadmap.primaryBlocker) {
        actions.push(this.blockerToAction(roadmap.primaryBlocker, roadmap));
      }
      
      // Add progression state actions
      progressionState.requirementsForNextState.slice(0, 3).forEach(req => {
        actions.push(this.requirementToAction(req, progressionState));
      });
      
      // Add role-aligned actions
      if (roleAlignment) {
        roleAlignment.roleSpecificRecommendations.slice(0, 3).forEach(rec => {
          actions.push(this.roleRecommendationToAction(rec, roleAlignment, targetRole));
        });
      }
      
      // Prioritize actions
      const prioritizedActions = this.prioritizeActions(actions, context, targetRole);
      
      // Filter out actions that are already in memory (to avoid repetition)
      const filteredActions = this.filterByMemory(prioritizedActions, activeRecs);
      
      // Return top actions
      const topActions = filteredActions.slice(0, maxActions);
      
      logger.info('[NextBestActionEngine] Next best actions generated', { 
        userId, 
        actionCount: topActions.length 
      });
      
      return topActions;
    } catch (error) {
      logger.error('[NextBestActionEngine] Failed to generate next best actions', { userId, error });
      throw error;
    }
  }

  /**
   * Convert recommendation to action
   */
  private recommendationToAction(
    rec: any,
    roadmap: any,
    progressionState: any
  ): NextBestAction {
    const urgency = this.determineUrgency(rec.priority, rec.confidence);
    const blockers = roadmap.blockers
      .filter((b: any) => b.type === rec.type || b.nodeId === rec.title.toLowerCase())
      .map((b: any) => b.nodeName);
    
    return {
      actionId: this.generateActionId(rec.recommendationId),
      userId: rec.userId,
      title: rec.title,
      description: rec.description,
      category: rec.type,
      priority: this.calculatePriority(rec.priority, rec.confidence),
      urgency,
      estimatedEffort: rec.estimatedEffort,
      expectedImpact: rec.expectedImpact,
      reasoning: rec.reasoning,
      dependencies: rec.roadmapDependencies,
      blockers,
      confidence: rec.confidence,
      evidence: rec.evidenceChain,
      timestamp: new Date(),
    };
  }

  /**
   * Convert blocker to action
   */
  private blockerToAction(blocker: any, roadmap: any): NextBestAction {
    return {
      actionId: this.generateActionId(blocker.nodeId),
      userId: roadmap.userId,
      title: `Resolve ${blocker.nodeName} blocker`,
      description: blocker.description,
      category: blocker.type === 'infrastructure-gap' ? 'infrastructure' : 
                 blocker.type === 'skill-gap' ? 'skills' : 'roadmap',
      priority: blocker.severity === 'critical' ? 95 : 
               blocker.severity === 'high' ? 80 : 60,
      urgency: blocker.severity === 'critical' ? 'immediate' : 
               blocker.severity === 'high' ? 'high' : 'medium',
      estimatedEffort: 'medium',
      expectedImpact: blocker.impact,
      reasoning: `${blocker.nodeName} is blocking roadmap progression`,
      dependencies: [],
      blockers: [],
      confidence: 90,
      evidence: blocker.evidence,
      timestamp: new Date(),
    };
  }

  /**
   * Convert requirement to action
   */
  private requirementToAction(req: any, progressionState: any): NextBestAction {
    return {
      actionId: this.generateActionId(req.requirement),
      userId: progressionState.userId,
      title: `Improve ${req.requirement}`,
      description: `Increase ${req.requirement} from ${req.currentLevel}% to ${req.requiredLevel}%`,
      category: 'skills',
      priority: req.priority === 'critical' ? 90 : 
               req.priority === 'high' ? 75 : 55,
      urgency: req.priority === 'critical' ? 'immediate' : 
               req.priority === 'high' ? 'high' : 'medium',
      estimatedEffort: req.gap > 30 ? 'high' : req.gap > 15 ? 'medium' : 'low',
      expectedImpact: `Closing this gap will advance progression state`,
      reasoning: `${req.requirement} is required for next progression state`,
      dependencies: [],
      blockers: [],
      confidence: 85,
      evidence: [`Current: ${req.currentLevel}%, Required: ${req.requiredLevel}%, Gap: ${req.gap}%`],
      timestamp: new Date(),
    };
  }

  /**
   * Convert role recommendation to action
   */
  private roleRecommendationToAction(
    rec: string,
    roleAlignment: any,
    targetRole?: string
  ): NextBestAction {
    return {
      actionId: this.generateActionId(rec),
      userId: roleAlignment.userId,
      title: rec,
      description: rec,
      category: 'skills',
      priority: 70,
      urgency: 'medium',
      estimatedEffort: 'medium',
      expectedImpact: `Aligns with ${targetRole || 'target'} role progression`,
      reasoning: `Role-aligned recommendation for ${targetRole || 'target role'}`,
      dependencies: [],
      blockers: [],
      confidence: 80,
      evidence: [`Alignment score: ${roleAlignment.alignmentScore}%`],
      timestamp: new Date(),
    };
  }

  /**
   * Prioritize actions
   */
  private prioritizeActions(
    actions: NextBestAction[],
    context: string,
    targetRole?: string
  ): NextBestAction[] {
    // Sort by priority and urgency
    const urgencyOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
    
    return actions.sort((a, b) => {
      // First sort by urgency
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then sort by priority
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by confidence
      return b.confidence - a.confidence;
    });
  }

  /**
   * Filter actions by memory (avoid repetition)
   */
  private filterByMemory(actions: NextBestAction[], activeRecs: any[]): NextBestAction[] {
    return actions.filter(action => {
      // Check if similar action exists in memory
      const similarRec = activeRecs.find(rec => 
        rec.title.toLowerCase().includes(action.title.toLowerCase()) ||
        action.title.toLowerCase().includes(rec.title.toLowerCase())
      );
      
      // If similar recommendation exists and is in cooldown, filter out
      if (similarRec) {
        const now = new Date();
        if (similarRec.cooldownUntil && similarRec.cooldownUntil > now) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Determine urgency based on priority and confidence
   */
  private determineUrgency(priority: string, confidence: number): 'immediate' | 'high' | 'medium' | 'low' {
    if (priority === 'critical' && confidence > 80) return 'immediate';
    if (priority === 'critical') return 'high';
    if (priority === 'high' && confidence > 70) return 'high';
    if (priority === 'high') return 'medium';
    return 'low';
  }

  /**
   * Calculate priority score
   */
  private calculatePriority(priority: string, confidence: number): number {
    const priorityScores = { critical: 90, high: 70, medium: 50, low: 30 };
    const baseScore = priorityScores[priority as keyof typeof priorityScores] || 50;
    
    // Adjust by confidence
    return Math.min(100, baseScore + (confidence - 50) * 0.3);
  }

  /**
   * Generate action ID
   */
  private generateActionId(identifier: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${identifier}-${timestamp}-${random}`;
  }

  /**
   * Get single next best action
   */
  async getSingleNextBestAction(input: NextBestActionInput): Promise<NextBestAction | null> {
    const actions = await this.generateNextBestActions({ ...input, maxActions: 1 });
    return actions.length > 0 ? actions[0] : null;
  }
}

export const NextBestActionEngine = new NextBestActionEngineClass();
