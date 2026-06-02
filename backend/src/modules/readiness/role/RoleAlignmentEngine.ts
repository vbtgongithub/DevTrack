import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { logger } from '../../../shared/logger.js';

export type TargetRole = 
  | 'backend-engineer'
  | 'frontend-engineer'
  | 'full-stack-engineer'
  | 'ml-engineer'
  | 'systems-engineer'
  | 'product-engineer';

export interface RoleAlignmentInput {
  userId: string;
  targetRole: TargetRole;
}

export interface RoleAlignment {
  userId: string;
  targetRole: TargetRole;
  alignmentScore: number; // 0-100
  priorityAreas: PriorityArea[];
  readinessAdjustments: ReadinessAdjustment[];
  roleSpecificRecommendations: string[];
  personalizedRoadmap: RoadmapNode[];
  timestamp: Date;
}

export interface PriorityArea {
  area: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relevance: number; // 0-100
}

export interface ReadinessAdjustment {
  component: string;
  originalScore: number;
  adjustedScore: number;
  adjustmentReason: string;
  weightMultiplier: number;
}

export interface RoadmapNode {
  nodeId: string;
  name: string;
  category: string;
  currentStatus: 'verified' | 'in-progress' | 'not-started';
  priority: number;
  dependencies: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
}

class RoleAlignmentEngineClass {
  private roleConfigurations: Map<TargetRole, RoleConfiguration> = new Map();

  constructor() {
    this.initializeRoleConfigurations();
  }

  /**
   * Initialize role-specific configurations
   */
  private initializeRoleConfigurations(): void {
    // Backend Engineer configuration
    this.roleConfigurations.set('backend-engineer', {
      priorityAreas: [
        { area: 'infrastructure-maturity', weight: 1.5 },
        { area: 'queue-systems', weight: 1.4 },
        { area: 'caching', weight: 1.3 },
        { area: 'deployment', weight: 1.4 },
        { area: 'scalability', weight: 1.3 },
        { area: 'database-design', weight: 1.2 },
        { area: 'api-design', weight: 1.2 },
        { area: 'dsa', weight: 1.1 },
      ],
      dePrioritizedAreas: [
        'rendering-optimization',
        'accessibility',
        'ui-architecture',
        'state-management',
      ],
    });

    // Frontend Engineer configuration
    this.roleConfigurations.set('frontend-engineer', {
      priorityAreas: [
        { area: 'rendering-optimization', weight: 1.5 },
        { area: 'accessibility', weight: 1.4 },
        { area: 'ui-architecture', weight: 1.4 },
        { area: 'state-management', weight: 1.3 },
        { area: 'component-design', weight: 1.3 },
        { area: 'performance-optimization', weight: 1.2 },
        { area: 'typescript', weight: 1.2 },
        { area: 'testing', weight: 1.1 },
      ],
      dePrioritizedAreas: [
        'infrastructure-maturity',
        'queue-systems',
        'caching',
        'database-design',
      ],
    });

    // Full Stack Engineer configuration
    this.roleConfigurations.set('full-stack-engineer', {
      priorityAreas: [
        { area: 'infrastructure-maturity', weight: 1.3 },
        { area: 'api-design', weight: 1.3 },
        { area: 'database-design', weight: 1.2 },
        { area: 'ui-architecture', weight: 1.2 },
        { area: 'state-management', weight: 1.2 },
        { area: 'deployment', weight: 1.2 },
        { area: 'testing', weight: 1.1 },
        { area: 'dsa', weight: 1.1 },
      ],
      dePrioritizedAreas: [
        'machine-learning',
        'distributed-systems',
      ],
    });

    // ML Engineer configuration
    this.roleConfigurations.set('ml-engineer', {
      priorityAreas: [
        { area: 'machine-learning', weight: 1.5 },
        { area: 'data-processing', weight: 1.4 },
        { area: 'model-deployment', weight: 1.3 },
        { area: 'statistics', weight: 1.3 },
        { area: 'python', weight: 1.2 },
        { area: 'dsa', weight: 1.2 },
        { area: 'infrastructure-maturity', weight: 1.1 },
      ],
      dePrioritizedAreas: [
        'ui-architecture',
        'state-management',
        'accessibility',
      ],
    });

    // Systems Engineer configuration
    this.roleConfigurations.set('systems-engineer', {
      priorityAreas: [
        { area: 'infrastructure-maturity', weight: 1.5 },
        { area: 'scalability', weight: 1.5 },
        { area: 'distributed-systems', weight: 1.4 },
        { area: 'monitoring', weight: 1.4 },
        { area: 'deployment', weight: 1.3 },
        { area: 'queue-systems', weight: 1.3 },
        { area: 'caching', weight: 1.2 },
        { area: 'database-design', weight: 1.2 },
      ],
      dePrioritizedAreas: [
        'ui-architecture',
        'rendering-optimization',
        'accessibility',
      ],
    });

    // Product Engineer configuration
    this.roleConfigurations.set('product-engineer', {
      priorityAreas: [
        { area: 'product-thinking', weight: 1.4 },
        { area: 'user-experience', weight: 1.3 },
        { area: 'api-design', weight: 1.3 },
        { area: 'testing', weight: 1.2 },
        { area: 'deployment', weight: 1.2 },
        { area: 'infrastructure-maturity', weight: 1.1 },
        { area: 'ui-architecture', weight: 1.1 },
      ],
      dePrioritizedAreas: [
        'distributed-systems',
        'machine-learning',
      ],
    });
  }

  /**
   * Calculate role-aligned readiness
   */
  async calculateRoleAlignment(input: RoleAlignmentInput): Promise<RoleAlignment> {
    const { userId, targetRole } = input;
    
    try {
      logger.info('[RoleAlignmentEngine] Calculating role alignment', { userId, targetRole });
      
      // Fetch readiness data
      const [skillsData, projectsData] = await Promise.all([
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
      ]);
      
      const roleConfig = this.roleConfigurations.get(targetRole);
      if (!roleConfig) {
        throw new Error(`Unknown target role: ${targetRole}`);
      }
      
      // Calculate priority areas
      const priorityAreas = this.calculatePriorityAreas(skillsData, projectsData, roleConfig);
      
      // Calculate readiness adjustments
      const readinessAdjustments = this.calculateReadinessAdjustments(
        skillsData,
        projectsData,
        roleConfig
      );
      
      // Generate role-specific recommendations
      const roleSpecificRecommendations = this.generateRoleSpecificRecommendations(
        priorityAreas,
        targetRole
      );
      
      // Generate personalized roadmap
      const personalizedRoadmap = this.generatePersonalizedRoadmap(
        priorityAreas,
        targetRole
      );
      
      // Calculate overall alignment score
      const alignmentScore = this.calculateAlignmentScore(priorityAreas, readinessAdjustments);
      
      const alignment: RoleAlignment = {
        userId,
        targetRole,
        alignmentScore,
        priorityAreas,
        readinessAdjustments,
        roleSpecificRecommendations,
        personalizedRoadmap,
        timestamp: new Date(),
      };
      
      logger.info('[RoleAlignmentEngine] Role alignment calculated', { 
        userId, 
        targetRole,
        alignmentScore 
      });
      
      return alignment;
    } catch (error) {
      logger.error('[RoleAlignmentEngine] Failed to calculate role alignment', { userId, targetRole, error });
      throw error;
    }
  }

  /**
   * Calculate priority areas based on role configuration
   */
  private calculatePriorityAreas(
    skillsData: any,
    projectsData: any,
    roleConfig: RoleConfiguration
  ): PriorityArea[] {
    const priorityAreas: PriorityArea[] = [];
    
    roleConfig.priorityAreas.forEach(({ area, weight }) => {
      const currentScore = this.getAreaScore(area, skillsData, projectsData);
      const targetScore = 80; // Target score for all areas
      const gap = targetScore - currentScore;
      const priority = this.determinePriority(gap, weight);
      const relevance = Math.min(100, weight * 70);
      
      priorityAreas.push({
        area,
        currentScore,
        targetScore,
        gap,
        priority,
        relevance,
      });
    });
    
    // Sort by priority and relevance
    return priorityAreas.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.relevance - a.relevance;
    });
  }

  /**
   * Get score for a specific area
   */
  private getAreaScore(area: string, skillsData: any, projectsData: any): number {
    // Map area names to data sources
    const areaMappings: Record<string, () => number> = {
      'infrastructure-maturity': () => projectsData?.infrastructureSophistication || 0,
      'queue-systems': () => projectsData?.systemDesignSignals?.hasBullMQ ? 80 : 20,
      'caching': () => projectsData?.systemDesignSignals?.hasRedis ? 80 : 20,
      'deployment': () => projectsData?.deploymentEvidence || 0,
      'scalability': () => projectsData?.systemDesignSignals?.hasMonitoring ? 70 : 30,
      'database-design': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('database'))?.maturity || 0,
      'api-design': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('api'))?.maturity || 0,
      'dsa': () => skillsData?.overallEngineeringDepth || 0,
      'rendering-optimization': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('frontend'))?.maturity || 0,
      'accessibility': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('accessibility'))?.maturity || 0,
      'ui-architecture': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('ui'))?.maturity || 0,
      'state-management': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('state'))?.maturity || 0,
      'component-design': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('component'))?.maturity || 0,
      'performance-optimization': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('performance'))?.maturity || 0,
      'typescript': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('typescript'))?.maturity || 0,
      'testing': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('testing'))?.maturity || 0,
      'machine-learning': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('ml'))?.maturity || 0,
      'data-processing': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('data'))?.maturity || 0,
      'model-deployment': () => projectsData?.systemDesignSignals?.hasDocker ? 70 : 30,
      'statistics': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('stats'))?.maturity || 0,
      'python': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('python'))?.maturity || 0,
      'distributed-systems': () => projectsData?.systemDesignSignals?.hasBullMQ ? 70 : 30,
      'monitoring': () => projectsData?.systemDesignSignals?.hasMonitoring ? 80 : 20,
      'product-thinking': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('product'))?.maturity || 0,
      'user-experience': () => skillsData?.domains?.find((d: any) => d.name.toLowerCase().includes('ux'))?.maturity || 0,
    };
    
    const scoreFn = areaMappings[area];
    return scoreFn ? scoreFn() : 0;
  }

  /**
   * Determine priority based on gap and weight
   */
  private determinePriority(gap: number, weight: number): 'critical' | 'high' | 'medium' | 'low' {
    const weightedGap = gap * weight;
    if (weightedGap > 40) return 'critical';
    if (weightedGap > 25) return 'high';
    if (weightedGap > 10) return 'medium';
    return 'low';
  }

  /**
   * Calculate readiness adjustments based on role configuration
   */
  private calculateReadinessAdjustments(
    skillsData: any,
    projectsData: any,
    roleConfig: RoleConfiguration
  ): ReadinessAdjustment[] {
    const adjustments: ReadinessAdjustment[] = [];
    
    // Apply weight multipliers to priority areas
    roleConfig.priorityAreas.forEach(({ area, weight }) => {
      const originalScore = this.getAreaScore(area, skillsData, projectsData);
      const adjustedScore = Math.min(100, originalScore * weight);
      const adjustmentReason = weight > 1 
        ? `${area} is a priority for this role (weight: ${weight})`
        : `${area} has standard weight for this role`;
      
      adjustments.push({
        component: area,
        originalScore,
        adjustedScore,
        adjustmentReason,
        weightMultiplier: weight,
      });
    });
    
    // Apply de-prioritization to non-relevant areas
    roleConfig.dePrioritizedAreas.forEach(area => {
      const originalScore = this.getAreaScore(area, skillsData, projectsData);
      const adjustedScore = originalScore * 0.5; // Reduce by 50%
      const adjustmentReason = `${area} is less relevant for this role`;
      
      adjustments.push({
        component: area,
        originalScore,
        adjustedScore,
        adjustmentReason,
        weightMultiplier: 0.5,
      });
    });
    
    return adjustments;
  }

  /**
   * Generate role-specific recommendations
   */
  private generateRoleSpecificRecommendations(
    priorityAreas: PriorityArea[],
    targetRole: TargetRole
  ): string[] {
    const recommendations: string[] = [];
    const criticalAreas = priorityAreas.filter(a => a.priority === 'critical');
    const highAreas = priorityAreas.filter(a => a.priority === 'high');
    
    // Generate recommendations based on role
    switch (targetRole) {
      case 'backend-engineer':
        if (criticalAreas.some(a => a.area === 'infrastructure-maturity')) {
          recommendations.push('Add Redis caching to a backend project to demonstrate infrastructure maturity');
          recommendations.push('Implement Docker deployment for your backend services');
        }
        if (criticalAreas.some(a => a.area === 'queue-systems')) {
          recommendations.push('Integrate BullMQ or similar queue system for async job processing');
        }
        if (criticalAreas.some(a => a.area === 'deployment')) {
          recommendations.push('Deploy your backend application to a cloud platform (AWS, GCP, or Azure)');
        }
        break;
        
      case 'frontend-engineer':
        if (criticalAreas.some(a => a.area === 'rendering-optimization')) {
          recommendations.push('Implement code splitting and lazy loading in your React application');
          recommendations.push('Optimize bundle size using webpack or vite optimizations');
        }
        if (criticalAreas.some(a => a.area === 'accessibility')) {
          recommendations.push('Add ARIA labels and keyboard navigation support to your components');
          recommendations.push('Run accessibility audits using Lighthouse and fix critical issues');
        }
        if (criticalAreas.some(a => a.area === 'state-management')) {
          recommendations.push('Implement Redux, Zustand, or Context API for complex state management');
        }
        break;
        
      case 'full-stack-engineer':
        if (criticalAreas.some(a => a.area === 'infrastructure-maturity')) {
          recommendations.push('Build a full-stack application with Docker deployment and database integration');
        }
        if (criticalAreas.some(a => a.area === 'api-design')) {
          recommendations.push('Design RESTful APIs with proper error handling and documentation');
        }
        break;
        
      case 'ml-engineer':
        if (criticalAreas.some(a => a.area === 'machine-learning')) {
          recommendations.push('Build and deploy a machine learning model with training pipeline');
        }
        if (criticalAreas.some(a => a.area === 'model-deployment')) {
          recommendations.push('Deploy your ML model using Docker and expose it via API');
        }
        break;
        
      case 'systems-engineer':
        if (criticalAreas.some(a => a.area === 'distributed-systems')) {
          recommendations.push('Implement a distributed system with message queues and microservices');
        }
        if (criticalAreas.some(a => a.area === 'monitoring')) {
          recommendations.push('Add Prometheus/Grafana monitoring to your infrastructure');
        }
        break;
        
      case 'product-engineer':
        if (criticalAreas.some(a => a.area === 'product-thinking')) {
          recommendations.push('Conduct user research and iterate on product features based on feedback');
        }
        if (criticalAreas.some(a => a.area === 'api-design')) {
          recommendations.push('Design user-friendly APIs with clear documentation and examples');
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Generate personalized roadmap based on role alignment
   */
  private generatePersonalizedRoadmap(
    priorityAreas: PriorityArea[],
    targetRole: TargetRole
  ): RoadmapNode[] {
    const roadmap: RoadmapNode[] = [];
    
    // Create roadmap nodes from priority areas
    priorityAreas.forEach((area, index) => {
      roadmap.push({
        nodeId: `${targetRole}-${area.area}`,
        name: this.formatAreaName(area.area),
        category: this.categorizeArea(area.area),
        currentStatus: area.currentScore > 70 ? 'verified' : area.currentScore > 30 ? 'in-progress' : 'not-started',
        priority: index + 1,
        dependencies: index > 0 ? [roadmap[index - 1].nodeId] : [],
        estimatedEffort: area.gap > 40 ? 'high' : area.gap > 20 ? 'medium' : 'low',
      });
    });
    
    return roadmap;
  }

  /**
   * Format area name for display
   */
  private formatAreaName(area: string): string {
    return area.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  /**
   * Categorize area
   */
  private categorizeArea(area: string): string {
    if (area.includes('infrastructure') || area.includes('deployment') || area.includes('monitoring')) {
      return 'infrastructure';
    }
    if (area.includes('api') || area.includes('database') || area.includes('queue')) {
      return 'backend';
    }
    if (area.includes('ui') || area.includes('rendering') || area.includes('accessibility')) {
      return 'frontend';
    }
    if (area.includes('ml') || area.includes('data') || area.includes('statistics')) {
      return 'ml';
    }
    if (area.includes('product') || area.includes('ux')) {
      return 'product';
    }
    return 'general';
  }

  /**
   * Calculate overall alignment score
   */
  private calculateAlignmentScore(
    priorityAreas: PriorityArea[],
    readinessAdjustments: ReadinessAdjustment[]
  ): number {
    // Calculate weighted average of priority area scores
    const totalWeight = readinessAdjustments.reduce((sum, adj) => sum + adj.weightMultiplier, 0);
    const weightedScore = readinessAdjustments.reduce(
      (sum, adj) => sum + adj.adjustedScore * adj.weightMultiplier,
      0
    );
    
    return Math.round(weightedScore / totalWeight);
  }
}

interface RoleConfiguration {
  priorityAreas: { area: string; weight: number }[];
  dePrioritizedAreas: string[];
}

export const RoleAlignmentEngine = new RoleAlignmentEngineClass();
