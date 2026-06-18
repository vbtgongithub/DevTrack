import { ReadinessDsa } from '../../../db/models/readinessDsa.model.js';
import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { ReadinessRoadmap } from '../../../db/models/readinessRoadmap.model.js';
import { EvidenceChainSystem } from '../../operations/index.js';
import { SkillGraphNormalizationLayer } from '../skillGraph/SkillGraphNormalizationLayer.js';
import { logger } from '../../../shared/logger.js';

export interface RecommendationInput {
  userId: string;
  targetRole?: string;
  maxRecommendations?: number;
}

export interface Recommendation {
  recommendationId: string;
  userId: string;
  type: 'dsa' | 'skill' | 'project' | 'infrastructure' | 'roadmap';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  confidence: number; // 0-100
  evidenceChain: string[];
  roadmapDependencies: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt: Date;
}

export interface RecommendationEvidence {
  source: string;
  type: string;
  value: number;
  threshold: number;
  gap: number;
}

class IntelligentRecommendationEngineClass {
  /**
   * Generate intelligent recommendations based on readiness gaps
   */
  async generateRecommendations(input: RecommendationInput): Promise<Recommendation[]> {
    const { userId, targetRole, maxRecommendations = 5 } = input;
    
    try {
      logger.info('[IntelligentRecommendationEngine] Generating recommendations', { userId, targetRole });
      
      // Fetch readiness data
      const [dsaData, skillsData, projectsData, roadmapData] = await Promise.all([
        ReadinessDsa.findOne({ userId }),
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
        ReadinessRoadmap.findOne({ userId }),
      ]);
      
      const recommendations: Recommendation[] = [];
      
      // Generate DSA recommendations
      if (dsaData) {
        const dsaRecs = this.generateDSARecommendations(dsaData, userId);
        recommendations.push(...dsaRecs);
      }
      
      // Generate Skills recommendations
      if (skillsData) {
        const skillRecs = this.generateSkillRecommendations(skillsData, roadmapData, userId, targetRole);
        recommendations.push(...skillRecs);
      }
      
      // Generate Project/Infrastructure recommendations
      if (projectsData) {
        const projectRecs = this.generateProjectRecommendations(projectsData, userId, targetRole);
        recommendations.push(...projectRecs);
      }
      
      // Generate Roadmap recommendations
      if (roadmapData) {
        const roadmapRecs = this.generateRoadmapRecommendations(roadmapData, userId);
        recommendations.push(...roadmapRecs);
      }
      
      // Sort by priority and confidence
      const sortedRecommendations = this.sortRecommendations(recommendations);
      
      // Return top recommendations
      const topRecommendations = sortedRecommendations.slice(0, maxRecommendations);
      
      logger.info('[IntelligentRecommendationEngine] Recommendations generated', { 
        userId, 
        count: topRecommendations.length 
      });
      
      return topRecommendations;
    } catch (error) {
      logger.error('[IntelligentRecommendationEngine] Failed to generate recommendations', { userId, error });
      throw error;
    }
  }

  /**
   * Generate DSA-specific recommendations
   */
  private generateDSARecommendations(dsaData: any, userId: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Check for weak topics
    if (dsaData.topics) {
      const weakTopics = dsaData.topics.filter((t: any) => t.masteryLevel < 50);
      
      weakTopics.forEach((topic: any) => {
        const gap = 50 - topic.masteryLevel;
        const problemCount = Math.ceil(gap / 10); // Solve ~10 problems per 10% mastery
        
        recommendations.push({
          recommendationId: this.generateRecommendationId(userId, 'dsa', topic.topicName),
          userId,
          type: 'dsa',
          title: `Improve ${topic.topicName} mastery`,
          description: `Solve ${problemCount} problems in ${topic.topicName} to improve mastery from ${topic.masteryLevel}% to 50%+`,
          reasoning: `${topic.topicName} mastery is ${topic.masteryLevel}%, below the 50% threshold for interview readiness`,
          expectedImpact: `Improving ${topic.topicName} mastery will increase overall DSA readiness by ~${gap * 0.5}%`,
          confidence: Math.min(95, 50 + gap),
          evidenceChain: [
            `Current ${topic.topicName} mastery: ${topic.masteryLevel}%`,
            `Solve consistency: ${dsaData.solveConsistency}%`,
            `Total solves: ${dsaData.totalSolves}`
          ],
          roadmapDependencies: [topic.topicName],
          priority: gap > 30 ? 'critical' : gap > 15 ? 'high' : 'medium',
          estimatedEffort: problemCount > 10 ? 'high' : problemCount > 5 ? 'medium' : 'low',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      });
    }
    
    // Check for hard problem progression
    if (dsaData.hardProblemProgression < 30) {
      recommendations.push({
        recommendationId: this.generateRecommendationId(userId, 'dsa', 'hard-problems'),
        userId,
        type: 'dsa',
        title: 'Solve more hard problems',
        description: `Focus on solving hard problems to improve progression from ${dsaData.hardProblemProgression}% to 30%+`,
        reasoning: `Hard problem progression is ${dsaData.hardProblemProgression}%, below the 30% threshold for strong DSA readiness`,
        expectedImpact: 'Improving hard problem progression will significantly boost interview readiness',
        confidence: 80,
        evidenceChain: [
          `Hard problem progression: ${dsaData.hardProblemProgression}%`,
          `Total solves: ${dsaData.totalSolves}`
        ],
        roadmapDependencies: ['hard-problems'],
        priority: 'high',
        estimatedEffort: 'high',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    return recommendations;
  }

  /**
   * Generate Skills-specific recommendations
   */
  private generateSkillRecommendations(
    skillsData: any,
    roadmapData: any,
    userId: string,
    targetRole?: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Check for missing skills from roadmap
    if (roadmapData && roadmapData.missingDependencies) {
      roadmapData.missingDependencies.forEach((dep: any) => {
        const skillNode = SkillGraphNormalizationLayer.getNode(dep.nodeId);
        if (!skillNode) return;
        
        recommendations.push({
          recommendationId: this.generateRecommendationId(userId, 'skill', dep.nodeId),
          userId,
          type: 'skill',
          title: `Implement ${skillNode.name}`,
          description: `Add ${skillNode.name} to a project to verify this skill`,
          reasoning: `${skillNode.name} is a missing dependency for your roadmap progression`,
          expectedImpact: `Verifying ${skillNode.name} will unlock ${skillNode.dependencies?.length || 0} additional skills`,
          confidence: 85,
          evidenceChain: [
            `Missing dependency: ${dep.nodeId}`,
            `Importance: ${dep.importance}`,
            `Reasoning: ${dep.reasoning}`
          ],
          roadmapDependencies: skillNode.dependencies || [],
          priority: dep.importance === 'high' ? 'critical' : dep.importance === 'medium' ? 'high' : 'medium',
          estimatedEffort: 'medium',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      });
    }
    
    // Check for low domain maturity
    if (skillsData.domains) {
      const weakDomains = skillsData.domains.filter((d: any) => d.maturity < 50);
      
      weakDomains.forEach((domain: any) => {
        const gap = 50 - domain.maturity;
        
        recommendations.push({
          recommendationId: this.generateRecommendationId(userId, 'skill', domain.name),
          userId,
          type: 'skill',
          title: `Improve ${domain.name} domain maturity`,
          description: `Build projects or add features in ${domain.name} to improve maturity from ${domain.maturity}% to 50%+`,
          reasoning: `${domain.name} domain maturity is ${domain.maturity}%, below the 50% threshold`,
          expectedImpact: `Improving ${domain.name} maturity will increase overall engineering depth by ~${gap * 0.3}%`,
          confidence: Math.min(90, 60 + gap),
          evidenceChain: [
            `Current ${domain.name} maturity: ${domain.maturity}%`,
            `Practical exposure: ${domain.practicalExposure}%`,
            `Production relevance: ${domain.productionRelevance}%`
          ],
          roadmapDependencies: [domain.name],
          priority: gap > 30 ? 'high' : 'medium',
          estimatedEffort: 'medium',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      });
    }
    
    return recommendations;
  }

  /**
   * Generate Project/Infrastructure recommendations
   */
  private generateProjectRecommendations(
    projectsData: any,
    userId: string,
    targetRole?: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Check for missing infrastructure
    const missingInfra: string[] = [];
    if (!projectsData.systemDesignSignals?.hasRedis) missingInfra.push('Redis caching');
    if (!projectsData.systemDesignSignals?.hasDocker) missingInfra.push('Docker deployment');
    if (!projectsData.systemDesignSignals?.hasBullMQ) missingInfra.push('Queue systems');
    if (!projectsData.systemDesignSignals?.hasMonitoring) missingInfra.push('Monitoring');
    
    missingInfra.forEach((infra) => {
      recommendations.push({
        recommendationId: this.generateRecommendationId(userId, 'infrastructure', infra),
        userId,
        type: 'infrastructure',
        title: `Add ${infra} to a project`,
        description: `Implement ${infra} in one of your projects to demonstrate infrastructure maturity`,
        reasoning: `${infra} is not detected in any project, limiting infrastructure sophistication`,
        expectedImpact: `Adding ${infra} will improve infrastructure sophistication by ~15-20%`,
        confidence: 85,
        evidenceChain: [
          `Infrastructure sophistication: ${projectsData.infrastructureSophistication}%`,
          `Engineering maturity: ${projectsData.engineeringMaturity}%`,
          `Missing: ${infra}`
        ],
        roadmapDependencies: [infra],
        priority: infra === 'Docker deployment' ? 'critical' : 'high',
        estimatedEffort: 'medium',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });
    
    // Check for low project credibility
    if (projectsData.projectCredibilityScore < 60) {
      recommendations.push({
        recommendationId: this.generateRecommendationId(userId, 'project', 'credibility'),
        userId,
        type: 'project',
        title: 'Improve project credibility',
        description: 'Add more commits, better documentation, or deployment to improve project credibility',
        reasoning: `Project credibility is ${projectsData.projectCredibilityScore}%, below the 60% threshold`,
        expectedImpact: 'Improving project credibility will increase overall readiness by ~10-15%',
        confidence: 75,
        evidenceChain: [
          `Project credibility: ${projectsData.projectCredibilityScore}%`,
          `Engineering maturity: ${projectsData.engineeringMaturity}%`
        ],
        roadmapDependencies: ['project-quality'],
        priority: 'medium',
        estimatedEffort: 'medium',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }
    
    return recommendations;
  }

  /**
   * Generate Roadmap-specific recommendations
   */
  private generateRoadmapRecommendations(roadmapData: any, userId: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Check for next best actions
    if (roadmapData.nextBestActions && roadmapData.nextBestActions.length > 0) {
      roadmapData.nextBestActions.slice(0, 3).forEach((action: any) => {
        recommendations.push({
          recommendationId: this.generateRecommendationId(userId, 'roadmap', action.targetNodeId),
          userId,
          type: 'roadmap',
          title: action.description,
          description: action.description,
          reasoning: `This is the next best action for your roadmap progression`,
          expectedImpact: 'Completing this action will advance your roadmap by 1-2 nodes',
          confidence: 80,
          evidenceChain: [
            `Action type: ${action.actionType}`,
            `Target: ${action.targetNodeId}`,
            `Priority: ${action.priority}`
          ],
          roadmapDependencies: [action.targetNodeId],
          priority: action.priority === 'high' ? 'high' : 'medium',
          estimatedEffort: 'medium',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      });
    }
    
    return recommendations;
  }

  /**
   * Sort recommendations by priority and confidence
   */
  private sortRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return recommendations.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by confidence (higher first)
      return b.confidence - a.confidence;
    });
  }

  /**
   * Generate unique recommendation ID
   */
  private generateRecommendationId(userId: string, type: string, identifier: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}-${type}-${identifier}-${timestamp}-${random}`;
  }
}

export const IntelligentRecommendationEngine = new IntelligentRecommendationEngineClass();
