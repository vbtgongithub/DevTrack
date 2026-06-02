// src/modules/resume-intelligence/engines/ResumeSkillPrioritizer.ts
import type { Types } from 'mongoose';
import type { IEngineeringSignals } from '../orchestration/ResumeOrchestrationEngine.js';
import { logger } from '../../../shared/logger.js';

interface ISkillScore {
  skill: string;
  score: number;
  verified: boolean;
  projectCount: number;
}

/**
 * ResumeSkillPrioritizer
 * 
 * Prioritizes verified skills based on:
 * - Engineering maturity
 * - Project linkage
 * - Infrastructure exposure
 * - Roadmap progression
 * - Role alignment
 */
export class ResumeSkillPrioritizer {
  /**
   * Prioritize skills for resume
   */
  async prioritizeSkills(
    _userId: Types.ObjectId,
    projects: unknown[],
    engineeringSignals: IEngineeringSignals
  ): Promise<string[]> {
    logger.info(`[SkillPrioritizer] Prioritizing skills from ${projects.length} projects`);

    const projectsArray = projects as Array<{
      techStack: string[];
      status: string;
    }>;

    // Fetch the latest ResumeSession to get extracted skills from the resume parser
    let extractedResumeSkills: string[] = [];
    try {
      const { ResumeSession } = await import('../../../db/models/resumeSession.model.js');
      const latestSession = await ResumeSession.findOne({ userId: _userId }).sort({ createdAt: -1 });
      if (latestSession && latestSession.parsedContent?.metadata?.extractedSkills) {
        extractedResumeSkills = latestSession.parsedContent.metadata.extractedSkills;
      }
    } catch (e) {
      logger.warn(`[SkillPrioritizer] Failed to fetch ResumeSession for user ${_userId}`, {
        error: e instanceof Error ? e.message : String(e)
      });
    }

    // Extract all skills from projects
    const skillMap = new Map<string, ISkillScore>();

    // 1. Add extracted resume skills first (unverified, projectCount = 0)
    extractedResumeSkills.forEach(skill => {
      const normalizedSkill = this.normalizeSkill(skill);
      if (!skillMap.has(normalizedSkill)) {
        skillMap.set(normalizedSkill, {
          skill: normalizedSkill,
          score: 0,
          verified: false, // Claimed on resume, but no project proof
          projectCount: 0,
        });
      }
    });

    // 2. Add skills from actual DevTrack projects (verifies them and increments count)
    projectsArray.forEach(project => {
      project.techStack.forEach(skill => {
        const normalizedSkill = this.normalizeSkill(skill);
        
        if (!skillMap.has(normalizedSkill)) {
          skillMap.set(normalizedSkill, {
            skill: normalizedSkill,
            score: 0,
            verified: true, // From projects = verified
            projectCount: 0,
          });
        }

        const skillScore = skillMap.get(normalizedSkill)!;
        skillScore.verified = true; // Upgrade status if it was unverified from resume
        skillScore.projectCount += 1;
      });
    });

    // Score each skill
    const scoredSkills: ISkillScore[] = Array.from(skillMap.values()).map(skillScore => {
      const score = this.calculateSkillScore(skillScore, engineeringSignals);
      return { ...skillScore, score };
    });

    // Sort by score descending
    scoredSkills.sort((a, b) => {
      // Verified skills always rank higher
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }
      return b.score - a.score;
    });

    logger.info(`[SkillPrioritizer] Prioritized ${scoredSkills.length} skills`);

    return scoredSkills.map(s => s.skill);
  }

  /**
   * Normalize skill names
   */
  private normalizeSkill(skill: string): string {
    // Normalize common variations
    const normalized = skill.trim().toLowerCase();

    const mappings: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'react': 'React',
      'reactjs': 'React',
      'react.js': 'React',
      'nodejs': 'Node.js',
      'node': 'Node.js',
      'express': 'Express.js',
      'expressjs': 'Express.js',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mysql': 'MySQL',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'k8s': 'Kubernetes',
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'Google Cloud',
      'redis': 'Redis',
      'graphql': 'GraphQL',
      'rest': 'REST API',
      'restful': 'REST API',
      'git': 'Git',
      'github': 'GitHub',
      'ci/cd': 'CI/CD',
      'tailwind': 'Tailwind CSS',
      'tailwindcss': 'Tailwind CSS',
    };

    return mappings[normalized] || skill.trim();
  }

  /**
   * Calculate skill score
   */
  private calculateSkillScore(
    skillScore: ISkillScore,
    engineeringSignals: IEngineeringSignals
  ): number {
    let score = 0;

    // Base score from project count
    score += skillScore.projectCount * 10;

    // Bonus for verified skills
    if (skillScore.verified) {
      score += 20;
    }

    // Bonus for infrastructure-related skills
    if (this.isInfraSkill(skillScore.skill)) {
      score += engineeringSignals.infraSignals.score * 0.3;
    }

    // Bonus for system design skills
    if (this.isSystemDesignSkill(skillScore.skill)) {
      score += engineeringSignals.systemDesignSignals.score * 0.3;
    }

    // Bonus for high-demand skills
    if (this.isHighDemandSkill(skillScore.skill)) {
      score += 15;
    }

    return Math.round(score);
  }

  /**
   * Check if skill is infrastructure-related
   */
  private isInfraSkill(skill: string): boolean {
    const infraSkills = [
      'docker', 'kubernetes', 'k8s',
      'aws', 'azure', 'gcp', 'google cloud',
      'ci/cd', 'jenkins', 'github actions',
      'terraform', 'ansible',
      'nginx', 'apache',
      'monitoring', 'prometheus', 'grafana',
    ];

    return infraSkills.some(s => skill.toLowerCase().includes(s));
  }

  /**
   * Check if skill is system design related
   */
  private isSystemDesignSkill(skill: string): boolean {
    const systemDesignSkills = [
      'microservice', 'distributed',
      'redis', 'kafka', 'rabbitmq',
      'load balancing', 'caching',
      'database', 'sql', 'nosql',
      'api', 'rest', 'graphql',
      'scalability', 'architecture',
    ];

    return systemDesignSkills.some(s => skill.toLowerCase().includes(s));
  }

  /**
   * Check if skill is high-demand
   */
  private isHighDemandSkill(skill: string): boolean {
    const highDemandSkills = [
      'react', 'node.js', 'python', 'typescript',
      'aws', 'docker', 'kubernetes',
      'postgresql', 'mongodb',
      'graphql', 'rest api',
      'microservices', 'ci/cd',
    ];

    return highDemandSkills.some(s => skill.toLowerCase().includes(s.toLowerCase()));
  }
}
