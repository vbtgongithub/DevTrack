import { ReadinessSkills } from '../../../db/models/readinessSkills.model.js';
import { ReadinessProjects } from '../../../db/models/readinessProjects.model.js';
import { ReadinessRoadmap } from '../../../db/models/readinessRoadmap.model.js';
import { logger } from '../../../shared/logger.js';

export type ProgressionState = 
  | 'early-foundation'
  | 'foundation-expansion'
  | 'infrastructure-building'
  | 'production-engineering'
  | 'scalability-maturity'
  | 'interview-readiness'
  | 'advanced-mastery';

export interface ProgressionStateInput {
  userId: string;
  targetRole?: string;
}

export interface ProgressionStateAnalysis {
  userId: string;
  currentState: ProgressionState;
  previousState?: ProgressionState;
  stateTransition?: {
    from: ProgressionState;
    to: ProgressionState;
    timestamp: Date;
  };
  stateMetrics: StateMetrics;
  readinessForNextState: number; // 0-100
  requirementsForNextState: StateRequirement[];
  recommendedActions: string[];
  estimatedTimeToNextState: string;
  timestamp: Date;
}

export interface StateMetrics {
  overallScore: number;
  dsaScore: number;
  skillsScore: number;
  projectsScore: number;
  infrastructureScore: number;
  roadmapProgress: number;
  consistencyScore: number;
}

export interface StateRequirement {
  requirement: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium';
}

class ProgressionStateEngineClass {
  private stateDefinitions: Map<ProgressionState, StateDefinition> = new Map();
  private userStateHistory: Map<string, ProgressionState[]> = new Map();

  constructor() {
    this.initializeStateDefinitions();
  }

  /**
   * Initialize state definitions
   */
  private initializeStateDefinitions(): void {
    this.stateDefinitions.set('early-foundation', {
      name: 'Early Backend Foundation',
      description: 'Building fundamental programming and problem-solving skills',
      criteria: {
        overallScore: 0,
        dsaScore: 0,
        skillsScore: 0,
        projectsScore: 0,
        infrastructureScore: 0,
        roadmapProgress: 0,
      },
      nextStates: ['foundation-expansion'],
      focusAreas: ['dsa', 'basic-skills', 'simple-projects'],
    });

    this.stateDefinitions.set('foundation-expansion', {
      name: 'Foundation Expansion',
      description: 'Expanding technical skills and building more complex projects',
      criteria: {
        overallScore: 40,
        dsaScore: 35,
        skillsScore: 40,
        projectsScore: 35,
        infrastructureScore: 20,
        roadmapProgress: 20,
      },
      nextStates: ['infrastructure-building'],
      focusAreas: ['dsa', 'intermediate-skills', 'multi-component-projects'],
    });

    this.stateDefinitions.set('infrastructure-building', {
      name: 'Infrastructure Building',
      description: 'Learning and implementing infrastructure patterns',
      criteria: {
        overallScore: 55,
        dsaScore: 45,
        skillsScore: 55,
        projectsScore: 50,
        infrastructureScore: 40,
        roadmapProgress: 35,
      },
      nextStates: ['production-engineering'],
      focusAreas: ['caching', 'queues', 'databases', 'deployment'],
    });

    this.stateDefinitions.set('production-engineering', {
      name: 'Production Engineering',
      description: 'Building production-ready applications with monitoring',
      criteria: {
        overallScore: 70,
        dsaScore: 55,
        skillsScore: 70,
        projectsScore: 65,
        infrastructureScore: 60,
        roadmapProgress: 50,
      },
      nextStates: ['scalability-maturity'],
      focusAreas: ['monitoring', 'scaling', 'optimization', 'testing'],
    });

    this.stateDefinitions.set('scalability-maturity', {
      name: 'Scalability Maturity',
      description: 'Designing and implementing scalable systems',
      criteria: {
        overallScore: 80,
        dsaScore: 65,
        skillsScore: 80,
        projectsScore: 75,
        infrastructureScore: 75,
        roadmapProgress: 65,
      },
      nextStates: ['interview-readiness'],
      focusAreas: ['distributed-systems', 'architecture', 'performance'],
    });

    this.stateDefinitions.set('interview-readiness', {
      name: 'Interview Readiness Stabilization',
      description: 'Preparing for and succeeding in technical interviews',
      criteria: {
        overallScore: 85,
        dsaScore: 75,
        skillsScore: 85,
        projectsScore: 80,
        infrastructureScore: 80,
        roadmapProgress: 75,
      },
      nextStates: ['advanced-mastery'],
      focusAreas: ['dsa-interview-prep', 'system-design', 'behavioral'],
    });

    this.stateDefinitions.set('advanced-mastery', {
      name: 'Advanced Mastery',
      description: 'Deep expertise in multiple engineering domains',
      criteria: {
        overallScore: 90,
        dsaScore: 80,
        skillsScore: 90,
        projectsScore: 85,
        infrastructureScore: 85,
        roadmapProgress: 85,
      },
      nextStates: [],
      focusAreas: ['specialization', 'leadership', 'innovation'],
    });
  }

  /**
   * Analyze user's progression state
   */
  async analyzeProgressionState(input: ProgressionStateInput): Promise<ProgressionStateAnalysis> {
    const { userId, targetRole } = input;
    
    try {
      logger.info('[ProgressionStateEngine] Analyzing progression state', { userId, targetRole });
      
      // Fetch readiness data
      const [skillsData, projectsData, roadmapData] = await Promise.all([
        ReadinessSkills.findOne({ userId }),
        ReadinessProjects.findOne({ userId }),
        ReadinessRoadmap.findOne({ userId }),
      ]);
      
      // Calculate state metrics
      const stateMetrics = this.calculateStateMetrics(skillsData, projectsData, roadmapData);
      
      // Determine current state
      const currentState = this.determineCurrentState(stateMetrics);
      
      // Get previous state
      const userHistory = this.userStateHistory.get(userId) || [];
      const previousState = userHistory[userHistory.length - 1];
      
      // Check for state transition
      let stateTransition;
      if (previousState && previousState !== currentState) {
        stateTransition = {
          from: previousState,
          to: currentState,
          timestamp: new Date(),
        };
      }
      
      // Update state history
      userHistory.push(currentState);
      this.userStateHistory.set(userId, userHistory);
      
      // Calculate readiness for next state
      const readinessForNextState = this.calculateReadinessForNextState(currentState, stateMetrics);
      
      // Get requirements for next state
      const requirementsForNextState = this.getRequirementsForNextState(currentState, stateMetrics);
      
      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(currentState, requirementsForNextState, targetRole);
      
      // Estimate time to next state
      const estimatedTimeToNextState = this.estimateTimeToNextState(readinessForNextState);
      
      const analysis: ProgressionStateAnalysis = {
        userId,
        currentState,
        previousState,
        stateTransition,
        stateMetrics,
        readinessForNextState,
        requirementsForNextState,
        recommendedActions,
        estimatedTimeToNextState,
        timestamp: new Date(),
      };
      
      logger.info('[ProgressionStateEngine] Progression state analyzed', { 
        userId, 
        currentState,
        readinessForNextState 
      });
      
      return analysis;
    } catch (error) {
      logger.error('[ProgressionStateEngine] Failed to analyze progression state', { userId, error });
      throw error;
    }
  }

  /**
   * Calculate state metrics
   */
  private calculateStateMetrics(skillsData: any, projectsData: any, roadmapData: any): StateMetrics {
    const dsaScore = skillsData?.overallEngineeringDepth || 0;
    const skillsScore = skillsData?.overallEngineeringDepth || 0;
    const projectsScore = projectsData?.engineeringMaturity || 0;
    const infrastructureScore = projectsData?.infrastructureSophistication || 0;
    const roadmapProgress = roadmapData ? (roadmapData.verifiedNodes.length / (roadmapData.verifiedNodes.length + roadmapData.missingDependencies.length)) * 100 : 0;
    
    const overallScore = (dsaScore + skillsScore + projectsScore + infrastructureScore) / 4;
    const consistencyScore = Math.min(100, (dsaScore + skillsScore + projectsScore + infrastructureScore) / 4);
    
    return {
      overallScore: Math.round(overallScore),
      dsaScore: Math.round(dsaScore),
      skillsScore: Math.round(skillsScore),
      projectsScore: Math.round(projectsScore),
      infrastructureScore: Math.round(infrastructureScore),
      roadmapProgress: Math.round(roadmapProgress),
      consistencyScore: Math.round(consistencyScore),
    };
  }

  /**
   * Determine current state based on metrics
   */
  private determineCurrentState(metrics: StateMetrics): ProgressionState {
    const states: ProgressionState[] = [
      'early-foundation',
      'foundation-expansion',
      'infrastructure-building',
      'production-engineering',
      'scalability-maturity',
      'interview-readiness',
      'advanced-mastery',
    ];
    
    // Find the highest state that the user meets criteria for
    for (let i = states.length - 1; i >= 0; i--) {
      const state = states[i];
      const definition = this.stateDefinitions.get(state);
      if (!definition) continue;
      
      if (this.meetsCriteria(metrics, definition.criteria)) {
        return state;
      }
    }
    
    return 'early-foundation';
  }

  /**
   * Check if metrics meet criteria
   */
  private meetsCriteria(metrics: StateMetrics, criteria: any): boolean {
    return (
      metrics.overallScore >= criteria.overallScore &&
      metrics.dsaScore >= criteria.dsaScore &&
      metrics.skillsScore >= criteria.skillsScore &&
      metrics.projectsScore >= criteria.projectsScore &&
      metrics.infrastructureScore >= criteria.infrastructureScore &&
      metrics.roadmapProgress >= criteria.roadmapProgress
    );
  }

  /**
   * Calculate readiness for next state
   */
  private calculateReadinessForNextState(currentState: ProgressionState, metrics: StateMetrics): number {
    const currentDefinition = this.stateDefinitions.get(currentState);
    if (!currentDefinition || currentDefinition.nextStates.length === 0) {
      return 100; // Already at highest state
    }
    
    const nextState = currentDefinition.nextStates[0];
    const nextDefinition = this.stateDefinitions.get(nextState);
    if (!nextDefinition) return 50;
    
    // Calculate how close metrics are to next state criteria
    const criteria = nextDefinition.criteria;
    const scores = [
      { current: metrics.overallScore, required: criteria.overallScore },
      { current: metrics.dsaScore, required: criteria.dsaScore },
      { current: metrics.skillsScore, required: criteria.skillsScore },
      { current: metrics.projectsScore, required: criteria.projectsScore },
      { current: metrics.infrastructureScore, required: criteria.infrastructureScore },
      { current: metrics.roadmapProgress, required: criteria.roadmapProgress },
    ];
    
    const readinessScores = scores.map(s => {
      if (s.required === 0) return 100;
      const progress = (s.current / s.required) * 100;
      return Math.min(100, progress);
    });
    
    return Math.round(readinessScores.reduce((sum, s) => sum + s, 0) / readinessScores.length);
  }

  /**
   * Get requirements for next state
   */
  private getRequirementsForNextState(currentState: ProgressionState, metrics: StateMetrics): StateRequirement[] {
    const currentDefinition = this.stateDefinitions.get(currentState);
    if (!currentDefinition || currentDefinition.nextStates.length === 0) {
      return [];
    }
    
    const nextState = currentDefinition.nextStates[0];
    const nextDefinition = this.stateDefinitions.get(nextState);
    if (!nextDefinition) return [];
    
    const criteria = nextDefinition.criteria;
    const requirements: StateRequirement[] = [];
    
    if (metrics.overallScore < criteria.overallScore) {
      requirements.push({
        requirement: 'Overall readiness score',
        currentLevel: metrics.overallScore,
        requiredLevel: criteria.overallScore,
        gap: criteria.overallScore - metrics.overallScore,
        priority: 'critical',
      });
    }
    
    if (metrics.dsaScore < criteria.dsaScore) {
      requirements.push({
        requirement: 'DSA proficiency',
        currentLevel: metrics.dsaScore,
        requiredLevel: criteria.dsaScore,
        gap: criteria.dsaScore - metrics.dsaScore,
        priority: metrics.dsaScore < criteria.dsaScore * 0.7 ? 'critical' : 'high',
      });
    }
    
    if (metrics.skillsScore < criteria.skillsScore) {
      requirements.push({
        requirement: 'Skills domain maturity',
        currentLevel: metrics.skillsScore,
        requiredLevel: criteria.skillsScore,
        gap: criteria.skillsScore - metrics.skillsScore,
        priority: 'high',
      });
    }
    
    if (metrics.projectsScore < criteria.projectsScore) {
      requirements.push({
        requirement: 'Project engineering maturity',
        currentLevel: metrics.projectsScore,
        requiredLevel: criteria.projectsScore,
        gap: criteria.projectsScore - metrics.projectsScore,
        priority: 'high',
      });
    }
    
    if (metrics.infrastructureScore < criteria.infrastructureScore) {
      requirements.push({
        requirement: 'Infrastructure sophistication',
        currentLevel: metrics.infrastructureScore,
        requiredLevel: criteria.infrastructureScore,
        gap: criteria.infrastructureScore - metrics.infrastructureScore,
        priority: metrics.infrastructureScore < criteria.infrastructureScore * 0.5 ? 'critical' : 'high',
      });
    }
    
    if (metrics.roadmapProgress < criteria.roadmapProgress) {
      requirements.push({
        requirement: 'Roadmap verification progress',
        currentLevel: metrics.roadmapProgress,
        requiredLevel: criteria.roadmapProgress,
        gap: criteria.roadmapProgress - metrics.roadmapProgress,
        priority: 'medium',
      });
    }
    
    return requirements;
  }

  /**
   * Generate recommended actions based on state and requirements
   */
  private generateRecommendedActions(
    currentState: ProgressionState,
    requirements: StateRequirement[],
    targetRole?: string
  ): string[] {
    const actions: string[] = [];
    const currentDefinition = this.stateDefinitions.get(currentState);
    if (!currentDefinition) return actions;
    
    // Add focus area actions
    currentDefinition.focusAreas.forEach(area => {
      actions.push(this.generateActionForFocusArea(area, targetRole));
    });
    
    // Add requirement-specific actions
    requirements.forEach(req => {
      actions.push(this.generateActionForRequirement(req));
    });
    
    return actions;
  }

  /**
   * Generate action for focus area
   */
  private generateActionForFocusArea(area: string, targetRole?: string): string {
    const actionMap: Record<string, string> = {
      'dsa': 'Solve 5-10 medium difficulty problems in weak topics',
      'basic-skills': 'Build small projects to practice fundamental skills',
      'simple-projects': 'Complete 2-3 simple projects with clear structure',
      'intermediate-skills': 'Learn and implement intermediate-level patterns',
      'multi-component-projects': 'Build projects with multiple interconnected components',
      'caching': 'Implement Redis caching in a backend project',
      'queues': 'Add BullMQ or similar queue system for async processing',
      'databases': 'Design and implement proper database schemas with relationships',
      'deployment': 'Deploy application using Docker to a cloud platform',
      'monitoring': 'Add Prometheus/Grafana monitoring and alerting',
      'scaling': 'Implement horizontal scaling with load balancers',
      'optimization': 'Optimize database queries and API response times',
      'testing': 'Add comprehensive unit and integration tests',
      'distributed-systems': 'Design and implement a distributed system architecture',
      'architecture': 'Document and review system architecture decisions',
      'performance': 'Profile and optimize performance bottlenecks',
      'dsa-interview-prep': 'Practice 50+ medium/hard interview problems',
      'system-design': 'Study and practice system design case studies',
      'behavioral': 'Prepare STAR method answers for behavioral questions',
      'specialization': 'Deep dive into a specific engineering domain',
      'leadership': 'Lead a project or mentor other developers',
      'innovation': 'Contribute to open source or build innovative solutions',
    };
    
    return actionMap[area] || `Focus on ${area} to progress to next state`;
  }

  /**
   * Generate action for requirement
   */
  private generateActionForRequirement(req: StateRequirement): string {
    const actionMap: Record<string, string> = {
      'Overall readiness score': 'Improve overall readiness by addressing all weak areas',
      'DSA proficiency': `Solve problems to reach ${req.requiredLevel}% DSA proficiency`,
      'Skills domain maturity': `Build projects in weak domains to reach ${req.requiredLevel}%`,
      'Project engineering maturity': `Improve project quality to reach ${req.requiredLevel}%`,
      'Infrastructure sophistication': `Add infrastructure components to reach ${req.requiredLevel}%`,
      'Roadmap verification progress': `Verify roadmap nodes to reach ${req.requiredLevel}% progress`,
    };
    
    return actionMap[req.requirement] || `Work on ${req.requirement} to close ${req.gap}% gap`;
  }

  /**
   * Estimate time to next state
   */
  private estimateTimeToNextState(readiness: number): string {
    if (readiness >= 90) return 'Already at next state';
    if (readiness >= 80) return '1-2 weeks';
    if (readiness >= 60) return '2-4 weeks';
    if (readiness >= 40) return '1-2 months';
    if (readiness >= 20) return '2-3 months';
    return '3-6 months';
  }

  /**
   * Get state definition
   */
  getStateDefinition(state: ProgressionState): StateDefinition | undefined {
    return this.stateDefinitions.get(state);
  }

  /**
   * Get user's state history
   */
  getUserStateHistory(userId: string): ProgressionState[] {
    return this.userStateHistory.get(userId) || [];
  }
}

interface StateDefinition {
  name: string;
  description: string;
  criteria: {
    overallScore: number;
    dsaScore: number;
    skillsScore: number;
    projectsScore: number;
    infrastructureScore: number;
    roadmapProgress: number;
  };
  nextStates: ProgressionState[];
  focusAreas: string[];
}

export const ProgressionStateEngine = new ProgressionStateEngineClass();
