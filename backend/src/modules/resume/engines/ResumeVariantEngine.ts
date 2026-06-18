// src/modules/resume-intelligence/engines/ResumeVariantEngine.ts
import type { Types } from 'mongoose';
import { ResumeVariant, type RoleType, type IWeightingProfile } from '../../../db/models/resumeVariant.model.js';
import { ResumeProfile } from '../../../db/models/resumeProfile.model.js';
import { Project } from '../../../db/models/project.model.js';
import { logger } from '../../../shared/logger.js';
import { randomBytes } from 'crypto';

/**
 * ResumeVariantEngine
 * 
 * Responsibilities:
 * - Role-aware prioritization
 * - Project reordering
 * - Skill weighting
 * - Infrastructure emphasis
 * - Recruiter-specific optimization
 */
export class ResumeVariantEngine {
  /**
   * Generate a role-specific resume variant
   */
  async generateVariant(
    userId: Types.ObjectId,
    roleType: RoleType,
    customWeights?: Partial<IWeightingProfile>
  ): Promise<typeof ResumeVariant.prototype> {
    logger.info(`[VariantEngine] Generating ${roleType} variant for user ${userId}`);

    // Fetch resume profile
    const resumeProfile = await ResumeProfile.findOne({ userId });
    if (!resumeProfile) {
      throw new Error('Resume profile not found');
    }

    // Get weighting profile for role
    const weightingProfile = this.getWeightingProfile(roleType, customWeights);

    // Fetch all projects
    const projects = await Project.find({ userId }).lean();

    // Prioritize projects based on role
    const prioritizedProjects = this.prioritizeProjectsForRole(
      projects,
      roleType,
      weightingProfile
    );

    // Prioritize skills based on role
    const prioritizedSkills = this.prioritizeSkillsForRole(
      resumeProfile.selectedSkills,
      roleType,
      weightingProfile
    );

    // Generate variant ID
    const variantId = `${roleType.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(4).toString('hex')}`;

    // Create variant
    const variant = await ResumeVariant.create({
      userId,
      resumeProfileId: resumeProfile._id,
      variantId,
      roleType,
      weightingProfile,
      prioritizedProjects: prioritizedProjects.slice(0, 5),
      prioritizedSkills: prioritizedSkills.slice(0, 15),
      infraWeight: weightingProfile.infraWeight,
      atsMetadata: {
        keywordDensity: this.calculateKeywordDensity(roleType),
        sectionOrder: this.getSectionOrder(roleType),
        formattingRules: this.getFormattingRules(roleType),
      },
      confidence: this.calculateVariantConfidence(projects, roleType),
    });

    // Update resume profile
    if (!resumeProfile.generatedVariants.includes(variantId)) {
      resumeProfile.generatedVariants.push(variantId);
      await resumeProfile.save();
    }

    logger.info(`[VariantEngine] Generated variant ${variantId}`);

    return variant;
  }

  /**
   * Get weighting profile for role type
   */
  private getWeightingProfile(
    roleType: RoleType,
    customWeights?: Partial<IWeightingProfile>
  ): IWeightingProfile {
    const defaultProfiles: Record<RoleType, IWeightingProfile> = {
      'Backend': {
        infraWeight: 0.3,
        systemDesignWeight: 0.35,
        dsaWeight: 0.2,
        projectComplexityWeight: 0.1,
        leadershipWeight: 0.05,
      },
      'Full Stack': {
        infraWeight: 0.2,
        systemDesignWeight: 0.25,
        dsaWeight: 0.15,
        projectComplexityWeight: 0.3,
        leadershipWeight: 0.1,
      },
      'Frontend': {
        infraWeight: 0.1,
        systemDesignWeight: 0.15,
        dsaWeight: 0.1,
        projectComplexityWeight: 0.5,
        leadershipWeight: 0.15,
      },
      'Infrastructure': {
        infraWeight: 0.5,
        systemDesignWeight: 0.3,
        dsaWeight: 0.05,
        projectComplexityWeight: 0.1,
        leadershipWeight: 0.05,
      },
      'Startup': {
        infraWeight: 0.15,
        systemDesignWeight: 0.2,
        dsaWeight: 0.1,
        projectComplexityWeight: 0.35,
        leadershipWeight: 0.2,
      },
      'Product Engineering': {
        infraWeight: 0.15,
        systemDesignWeight: 0.25,
        dsaWeight: 0.15,
        projectComplexityWeight: 0.3,
        leadershipWeight: 0.15,
      },
    };

    return {
      ...defaultProfiles[roleType],
      ...customWeights,
    };
  }

  /**
   * Prioritize projects for specific role
   */
  private prioritizeProjectsForRole(
    projects: unknown[],
    roleType: RoleType,
    weights: IWeightingProfile
  ): Types.ObjectId[] {
    const projectsArray = projects as Array<{
      _id: Types.ObjectId;
      techStack: string[];
      description: string;
      liveUrl: string | null;
      totalCommits: number;
    }>;

    const scoredProjects = projectsArray.map(project => {
      let score = 0;

      // Infrastructure score
      const infraScore = this.scoreProjectInfra(project);
      score += infraScore * weights.infraWeight * 100;

      // System design score
      const systemDesignScore = this.scoreProjectSystemDesign(project);
      score += systemDesignScore * weights.systemDesignWeight * 100;

      // Project complexity score
      const complexityScore = this.scoreProjectComplexity(project);
      score += complexityScore * weights.projectComplexityWeight * 100;

      // Role-specific bonus
      score += this.getRoleSpecificBonus(project, roleType);

      return { projectId: project._id, score };
    });

    scoredProjects.sort((a, b) => b.score - a.score);

    return scoredProjects.map(p => p.projectId);
  }

  /**
   * Score project infrastructure
   */
  private scoreProjectInfra(project: {
    techStack: string[];
    description: string;
  }): number {
    const infraKeywords = ['docker', 'kubernetes', 'ci/cd', 'aws', 'azure', 'gcp', 'cloud'];
    const text = `${project.techStack.join(' ')} ${project.description}`.toLowerCase();
    
    const matches = infraKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(1, matches / infraKeywords.length);
  }

  /**
   * Score project system design
   */
  private scoreProjectSystemDesign(project: {
    techStack: string[];
    description: string;
  }): number {
    const systemDesignKeywords = ['microservice', 'api', 'database', 'scalable', 'distributed', 'redis', 'kafka'];
    const text = `${project.techStack.join(' ')} ${project.description}`.toLowerCase();
    
    const matches = systemDesignKeywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(1, matches / systemDesignKeywords.length);
  }

  /**
   * Score project complexity
   */
  private scoreProjectComplexity(project: {
    techStack: string[];
    totalCommits: number;
    liveUrl: string | null;
  }): number {
    let score = 0;

    // Tech stack diversity
    score += Math.min(0.4, project.techStack.length * 0.05);

    // Commit count
    score += Math.min(0.3, project.totalCommits / 200);

    // Deployment
    if (project.liveUrl) score += 0.3;

    return Math.min(1, score);
  }

  /**
   * Get role-specific bonus
   */
  private getRoleSpecificBonus(
    project: {
      techStack: string[];
      description: string;
    },
    roleType: RoleType
  ): number {
    const text = `${project.techStack.join(' ')} ${project.description}`.toLowerCase();

    const roleKeywords: Record<RoleType, string[]> = {
      'Backend': ['api', 'database', 'server', 'backend', 'microservice'],
      'Full Stack': ['full stack', 'frontend', 'backend', 'react', 'node'],
      'Frontend': ['react', 'vue', 'angular', 'ui', 'ux', 'frontend'],
      'Infrastructure': ['devops', 'infrastructure', 'deployment', 'monitoring', 'cloud'],
      'Startup': ['mvp', 'startup', 'product', 'launch', 'growth'],
      'Product Engineering': ['product', 'user', 'feature', 'analytics', 'metrics'],
    };

    const keywords = roleKeywords[roleType] || [];
    const matches = keywords.filter(keyword => text.includes(keyword)).length;

    return matches * 5; // 5 points per keyword match
  }

  /**
   * Prioritize skills for specific role
   */
  private prioritizeSkillsForRole(
    skills: string[],
    roleType: RoleType,
    _weights: IWeightingProfile
  ): string[] {
    const roleSkillPriority: Record<RoleType, string[]> = {
      'Backend': ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB', 'Redis', 'REST API', 'GraphQL', 'Docker', 'AWS'],
      'Full Stack': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST API', 'Docker', 'AWS', 'Git'],
      'Frontend': ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS', 'Redux', 'Next.js'],
      'Infrastructure': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Monitoring', 'Linux', 'Nginx'],
      'Startup': ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Git', 'Agile', 'Product'],
      'Product Engineering': ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Analytics', 'A/B Testing', 'Product'],
    };

    const prioritySkills = roleSkillPriority[roleType] || [];

    // Sort skills: priority skills first, then others
    return skills.sort((a, b) => {
      const aIndex = prioritySkills.findIndex(s => a.toLowerCase().includes(s.toLowerCase()));
      const bIndex = prioritySkills.findIndex(s => b.toLowerCase().includes(s.toLowerCase()));

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });
  }

  /**
   * Calculate keyword density for ATS
   */
  private calculateKeywordDensity(roleType: RoleType): Record<string, number> {
    const roleKeywords: Record<RoleType, Record<string, number>> = {
      'Backend': { 'backend': 3, 'api': 3, 'database': 2, 'server': 2, 'microservices': 2 },
      'Full Stack': { 'full stack': 3, 'frontend': 2, 'backend': 2, 'react': 2, 'node': 2 },
      'Frontend': { 'frontend': 3, 'react': 3, 'ui': 2, 'ux': 2, 'responsive': 2 },
      'Infrastructure': { 'devops': 3, 'infrastructure': 3, 'cloud': 2, 'deployment': 2, 'monitoring': 2 },
      'Startup': { 'startup': 2, 'mvp': 2, 'product': 2, 'agile': 2, 'growth': 1 },
      'Product Engineering': { 'product': 3, 'engineering': 3, 'feature': 2, 'user': 2, 'analytics': 2 },
    };

    return roleKeywords[roleType] || {};
  }

  /**
   * Get section order for role
   */
  private getSectionOrder(roleType: RoleType): string[] {
    const roleOrders: Record<RoleType, string[]> = {
      'Backend': ['summary', 'skills', 'experience', 'projects', 'education'],
      'Full Stack': ['summary', 'skills', 'projects', 'experience', 'education'],
      'Frontend': ['summary', 'projects', 'skills', 'experience', 'education'],
      'Infrastructure': ['summary', 'skills', 'experience', 'certifications', 'education'],
      'Startup': ['summary', 'projects', 'experience', 'skills', 'education'],
      'Product Engineering': ['summary', 'experience', 'projects', 'skills', 'education'],
    };

    return roleOrders[roleType] || ['summary', 'experience', 'projects', 'skills', 'education'];
  }

  /**
   * Get formatting rules for role
   */
  private getFormattingRules(_roleType: RoleType): string[] {
    return [
      'Use single-column layout',
      'Use standard section headings',
      'Avoid tables and graphics',
      'Use bullet points for lists',
      'Use standard fonts (Arial, Calibri, Times New Roman)',
      'Maintain consistent formatting',
    ];
  }

  /**
   * Calculate variant confidence
   */
  private calculateVariantConfidence(
    projects: unknown[],
    roleType: RoleType
  ): number {
    const projectsArray = projects as Array<{
      techStack: string[];
      description: string;
    }>;

    if (projectsArray.length === 0) return 0;

    // Check how many projects align with the role
    const alignedProjects = projectsArray.filter(project => {
      const bonus = this.getRoleSpecificBonus(project, roleType);
      return bonus > 0;
    });

    const alignmentRatio = alignedProjects.length / projectsArray.length;

    return Math.round(alignmentRatio * 100);
  }
}
