// src/modules/resume-intelligence/engines/ResumeProjectRankingEngine.ts
import type { Types } from 'mongoose';
import type { IEngineeringSignals } from '../orchestration/ResumeOrchestrationEngine.js';
import { logger } from '../../../shared/logger.js';

interface IProjectScore {
  projectId: Types.ObjectId;
  score: number;
  reasons: string[];
  flags: string[];
}

/**
 * ResumeProjectRankingEngine
 * 
 * Ranks projects using:
 * - Infrastructure sophistication
 * - Architecture maturity
 * - Deployment evidence
 * - Engineering depth
 * - Scalability signals
 * - Roadmap relevance
 * - Role alignment
 */
export class ResumeProjectRankingEngine {
  /**
   * Rank projects for resume inclusion
   */
  async rankProjects(
    projects: unknown[],
    engineeringSignals: IEngineeringSignals
  ): Promise<Types.ObjectId[]> {
    logger.info(`[ProjectRanking] Ranking ${projects.length} projects`);

    const projectsArray = projects as Array<{
      _id: Types.ObjectId;
      name: string;
      description: string;
      techStack: string[];
      status: string;
      totalCommits: number;
      stars: number;
      forks: number;
      repoUrl: string | null;
      liveUrl: string | null;
    }>;

    const scoredProjects: IProjectScore[] = projectsArray.map(project => {
      const score = this.calculateProjectScore(project, engineeringSignals);
      return score;
    });

    // Sort by score descending
    scoredProjects.sort((a, b) => b.score - a.score);

    // Filter out flagged projects (tutorial, weak engineering)
    const validProjects = scoredProjects.filter(p => p.flags.length === 0);

    logger.info(`[ProjectRanking] Ranked ${validProjects.length} valid projects`);

    return validProjects.map(p => p.projectId);
  }

  /**
   * Calculate comprehensive project score
   */
  private calculateProjectScore(
    project: {
      _id: Types.ObjectId;
      name: string;
      description: string;
      techStack: string[];
      status: string;
      totalCommits: number;
      stars: number;
      forks: number;
      repoUrl: string | null;
      liveUrl: string | null;
    },
    _engineeringSignals: IEngineeringSignals
  ): IProjectScore {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];

    // 1. Infrastructure sophistication (0-25 points)
    const infraScore = this.scoreInfrastructure(project);
    score += infraScore;
    if (infraScore > 15) {
      reasons.push('Strong infrastructure setup');
    }

    // 2. Architecture maturity (0-25 points)
    const archScore = this.scoreArchitecture(project);
    score += archScore;
    if (archScore > 15) {
      reasons.push('Mature architecture');
    }

    // 3. Deployment evidence (0-20 points)
    const deployScore = this.scoreDeployment(project);
    score += deployScore;
    if (deployScore > 10) {
      reasons.push('Production deployment');
    }

    // 4. Engineering depth (0-20 points)
    const depthScore = this.scoreEngineeringDepth(project);
    score += depthScore;
    if (depthScore > 10) {
      reasons.push('Significant engineering effort');
    }

    // 5. Community validation (0-10 points)
    const communityScore = this.scoreCommunityValidation(project);
    score += communityScore;
    if (communityScore > 5) {
      reasons.push('Community validated');
    }

    // Detect tutorial/weak projects
    if (this.isTutorialProject(project)) {
      flags.push('Likely tutorial project');
      score *= 0.3; // Heavily penalize
    }

    if (this.isWeakEngineeringProject(project)) {
      flags.push('Weak engineering signals');
      score *= 0.5;
    }

    return {
      projectId: project._id,
      score: Math.round(score),
      reasons,
      flags,
    };
  }

  /**
   * Score infrastructure sophistication
   */
  private scoreInfrastructure(project: {
    techStack: string[];
    description: string;
  }): number {
    let score = 0;

    const infraKeywords = [
      'docker', 'kubernetes', 'k8s',
      'ci/cd', 'github actions', 'jenkins',
      'aws', 'azure', 'gcp', 'cloud',
      'nginx', 'load balancer',
      'redis', 'memcached',
      'monitoring', 'logging',
    ];

    const text = `${project.techStack.join(' ')} ${project.description}`.toLowerCase();

    infraKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 3;
      }
    });

    return Math.min(25, score);
  }

  /**
   * Score architecture maturity
   */
  private scoreArchitecture(project: {
    techStack: string[];
    description: string;
  }): number {
    let score = 0;

    // Tech stack diversity
    score += Math.min(10, project.techStack.length * 2);

    // Architecture patterns
    const archKeywords = [
      'microservice', 'api', 'rest', 'graphql',
      'database', 'sql', 'nosql', 'mongodb', 'postgresql',
      'authentication', 'authorization',
      'scalable', 'distributed',
      'event-driven', 'message queue',
    ];

    const text = `${project.techStack.join(' ')} ${project.description}`.toLowerCase();

    archKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 2;
      }
    });

    return Math.min(25, score);
  }

  /**
   * Score deployment evidence
   */
  private scoreDeployment(project: {
    liveUrl: string | null;
    description: string;
  }): number {
    let score = 0;

    if (project.liveUrl) {
      score += 15;
    }

    const deployKeywords = ['deployed', 'production', 'live', 'hosting'];
    const text = project.description.toLowerCase();

    deployKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 2;
      }
    });

    return Math.min(20, score);
  }

  /**
   * Score engineering depth
   */
  private scoreEngineeringDepth(project: {
    totalCommits: number;
    description: string;
  }): number {
    let score = 0;

    // Commit count indicates effort
    if (project.totalCommits > 100) score += 10;
    else if (project.totalCommits > 50) score += 7;
    else if (project.totalCommits > 20) score += 5;
    else if (project.totalCommits > 10) score += 3;

    // Description length indicates thoughtfulness
    if (project.description.length > 200) score += 5;
    else if (project.description.length > 100) score += 3;

    return Math.min(20, score);
  }

  /**
   * Score community validation
   */
  private scoreCommunityValidation(project: {
    stars: number;
    forks: number;
  }): number {
    let score = 0;

    if (project.stars > 50) score += 5;
    else if (project.stars > 20) score += 3;
    else if (project.stars > 5) score += 1;

    if (project.forks > 10) score += 3;
    else if (project.forks > 3) score += 1;

    return Math.min(10, score);
  }

  /**
   * Detect tutorial projects
   */
  private isTutorialProject(project: {
    name: string;
    description: string;
  }): boolean {
    const tutorialKeywords = [
      'tutorial', 'learning', 'practice', 'course',
      'udemy', 'coursera', 'freecodecamp',
      'todo app', 'todo list', 'hello world',
      'sample', 'example', 'demo',
    ];

    const text = `${project.name} ${project.description}`.toLowerCase();

    return tutorialKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detect weak engineering projects
   */
  private isWeakEngineeringProject(project: {
    totalCommits: number;
    techStack: string[];
    description: string;
  }): boolean {
    // Very few commits
    if (project.totalCommits < 5) return true;

    // Very small tech stack
    if (project.techStack.length < 2) return true;

    // Very short description
    if (project.description.length < 50) return true;

    return false;
  }
}
