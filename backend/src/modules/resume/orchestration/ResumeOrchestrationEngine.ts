// src/modules/resume-intelligence/orchestration/ResumeOrchestrationEngine.ts
import type { Types } from 'mongoose';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { Project } from '../../../db/models/project.model.js';
import { ResumeProjectRankingEngine } from '../engines/ResumeProjectRankingEngine.js';
import { ResumeSkillPrioritizer } from '../engines/ResumeSkillPrioritizer.js';
import { EngineeringSignalAggregator } from '../credibility/EngineeringSignalAggregator.js';
import { DsaProblem } from '../../../db/models/dsaProblem.model.js';
import { DsaContest } from '../../../db/models/dsaContest.model.js';
import { logger } from '../../../shared/logger.js';

export interface IEngineeringSignals {
  infraSignals: {
    dockerUsage: boolean;
    cicdPipeline: boolean;
    cloudDeployment: boolean;
    monitoring: boolean;
    testing: boolean;
    score: number;
  };
  systemDesignSignals: {
    architectureComplexity: number;
    scalabilityEvidence: boolean;
    distributedSystems: boolean;
    score: number;
  };
  dsaSignals: {
    problemsSolved: number;
    contestsParticipated: number;
    averageDifficulty: string;
    score: number;
  };
}

export interface IOrchestrationResult {
  resumeProfile: typeof ResumeProfile.prototype;
  prioritizedProjects: Types.ObjectId[];
  prioritizedSkills: string[];
  engineeringSignals: IEngineeringSignals;
  credibilityScore: number;
  recommendations: string[];
}

/**
 * ResumeOrchestrationEngine
 * 
 * The deterministic core orchestrator for resume generation.
 * Aggregates engineering signals, prioritizes projects and skills,
 * and generates recruiter-safe structure.
 */
export class ResumeOrchestrationEngine {
  private projectRanker: ResumeProjectRankingEngine;
  private skillPrioritizer: ResumeSkillPrioritizer;
  private engineeringAggregator: EngineeringSignalAggregator;

  constructor() {
    this.projectRanker = new ResumeProjectRankingEngine();
    this.skillPrioritizer = new ResumeSkillPrioritizer();
    this.engineeringAggregator = new EngineeringSignalAggregator();
  }

  /**
   * Orchestrate resume generation for a user
   */
  async orchestrate(userId: Types.ObjectId): Promise<IOrchestrationResult> {
    logger.info(`[ResumeOrchestration] Starting orchestration for user ${userId}`);

    // 1. Fetch or create resume profile
    let resumeProfile = await ResumeProfile.findOne({ userId });
    if (!resumeProfile) {
      resumeProfile = await ResumeProfile.create({ userId });
    }

    // 2. Aggregate engineering signals
    const engineeringSignals = await this.aggregateEngineeringSignals(userId);

    // 3. Prioritize projects
    const projects = await Project.find({ userId }).lean();
    const prioritizedProjects = await this.projectRanker.rankProjects(projects, engineeringSignals);

    // 4. Prioritize skills
    const prioritizedSkills = await this.skillPrioritizer.prioritizeSkills(
      userId,
      projects,
      engineeringSignals
    );

    // 5. Analyze credibility using the REAL credibility engine
    const credibilityResult = await this.engineeringAggregator.aggregateAndVerify(userId);

    // 6. Update resume profile
    resumeProfile.infraSignals = engineeringSignals.infraSignals;
    resumeProfile.systemDesignSignals = engineeringSignals.systemDesignSignals;
    resumeProfile.dsaSignals = engineeringSignals.dsaSignals;
    resumeProfile.credibilityScore = credibilityResult.overallCredibility;
    resumeProfile.selectedProjects = prioritizedProjects.slice(0, 5) as any; // Top 5 projects
    resumeProfile.selectedSkills = prioritizedSkills.slice(0, 15); // Top 15 skills
    resumeProfile.metadata.lastGeneratedAt = new Date();
    resumeProfile.metadata.generationCount += 1;

    await resumeProfile.save();

    logger.info(`[ResumeOrchestration] Orchestration complete for user ${userId}`);

    return {
      resumeProfile,
      prioritizedProjects: prioritizedProjects.slice(0, 5),
      prioritizedSkills: prioritizedSkills.slice(0, 15),
      engineeringSignals,
      credibilityScore: credibilityResult.overallCredibility,
      recommendations: credibilityResult.summary ? [credibilityResult.summary] : [],
    };
  }

  /**
   * Aggregate engineering signals from various sources
   */
  private async aggregateEngineeringSignals(userId: Types.ObjectId): Promise<IEngineeringSignals> {
    // Fetch projects
    const projects = await Project.find({ userId }).lean();

    // Calculate infra signals
    const infraSignals = this.calculateInfraSignals(projects);

    // Calculate system design signals
    const systemDesignSignals = this.calculateSystemDesignSignals(projects);

    // Fetch actual DSA metrics for the signals payload without mocking a fake score
    const problemsSolved = await DsaProblem.countDocuments({ userId, status: 'solved' });
    const contestsParticipated = await DsaContest.countDocuments({ userId });

    return {
      infraSignals,
      systemDesignSignals,
      dsaSignals: {
        problemsSolved,
        contestsParticipated,
        averageDifficulty: 'N/A', // Moved logic to real DSACredibilityEngine
        score: 0 // Will be handled by the real CredibilityEngine now
      },
    };
  }

  /**
   * Calculate infrastructure maturity signals
   */
  private calculateInfraSignals(projects: unknown[]): IEngineeringSignals['infraSignals'] {
    const projectsArray = projects as Array<{
      techStack?: string[];
      description?: string;
      repoUrl?: string | null;
    }>;

    const dockerUsage = projectsArray.some(p => 
      p.techStack?.some(tech => tech.toLowerCase().includes('docker')) ||
      p.description?.toLowerCase().includes('docker')
    );

    const cicdPipeline = projectsArray.some(p =>
      p.techStack?.some(tech => 
        tech.toLowerCase().includes('github actions') ||
        tech.toLowerCase().includes('jenkins') ||
        tech.toLowerCase().includes('gitlab ci')
      ) ||
      p.description?.toLowerCase().includes('ci/cd')
    );

    const cloudDeployment = projectsArray.some(p =>
      p.techStack?.some(tech =>
        tech.toLowerCase().includes('aws') ||
        tech.toLowerCase().includes('azure') ||
        tech.toLowerCase().includes('gcp') ||
        tech.toLowerCase().includes('vercel') ||
        tech.toLowerCase().includes('heroku')
      )
    );

    const monitoring = projectsArray.some(p =>
      p.techStack?.some(tech =>
        tech.toLowerCase().includes('prometheus') ||
        tech.toLowerCase().includes('grafana') ||
        tech.toLowerCase().includes('datadog')
      )
    );

    const testing = projectsArray.some(p =>
      p.techStack?.some(tech =>
        tech.toLowerCase().includes('jest') ||
        tech.toLowerCase().includes('pytest') ||
        tech.toLowerCase().includes('mocha') ||
        tech.toLowerCase().includes('vitest')
      )
    );

    // Calculate score (0-100)
    const score = [dockerUsage, cicdPipeline, cloudDeployment, monitoring, testing]
      .filter(Boolean).length * 20;

    return {
      dockerUsage,
      cicdPipeline,
      cloudDeployment,
      monitoring,
      testing,
      score,
    };
  }

  /**
   * Calculate system design signals
   */
  private calculateSystemDesignSignals(projects: unknown[]): IEngineeringSignals['systemDesignSignals'] {
    const projectsArray = projects as Array<{
      techStack?: string[];
      description?: string;
      totalCommits?: number;
    }>;

    // Architecture complexity based on tech stack diversity and project size
    const avgTechStackSize = projectsArray.length > 0
      ? projectsArray.reduce((sum, p) => sum + (p.techStack?.length || 0), 0) / projectsArray.length
      : 0;

    const architectureComplexity = Math.min(10, Math.floor(avgTechStackSize));

    const scalabilityEvidence = projectsArray.some(p =>
      p.description?.toLowerCase().includes('scalable') ||
      p.description?.toLowerCase().includes('load balancing') ||
      p.description?.toLowerCase().includes('caching')
    );

    const distributedSystems = projectsArray.some(p =>
      p.techStack?.some(tech =>
        tech.toLowerCase().includes('redis') ||
        tech.toLowerCase().includes('kafka') ||
        tech.toLowerCase().includes('rabbitmq') ||
        tech.toLowerCase().includes('microservice')
      ) ||
      p.description?.toLowerCase().includes('distributed')
    );

    // Calculate score
    const score = Math.min(100, 
      (architectureComplexity * 5) +
      (scalabilityEvidence ? 25 : 0) +
      (distributedSystems ? 25 : 0)
    );

    return {
      architectureComplexity,
      scalabilityEvidence,
      distributedSystems,
      score,
    };
  }
}
