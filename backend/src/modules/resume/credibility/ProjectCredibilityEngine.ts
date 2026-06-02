import type { Types } from 'mongoose';
import { Project } from '../../../db/models/project.model.js';
import { CredibilitySignal } from './credibility.schema.js';

export interface ProjectCredibilityResult {
  score: number;
  signals: CredibilitySignal[];
}

export class ProjectCredibilityEngine {
  async evaluate(userId: Types.ObjectId | undefined): Promise<ProjectCredibilityResult> {
    if (!userId) {
      return {
        score: 0,
        signals: [{
          type: 'project',
          title: 'Missing GitHub Data',
          description: 'No synced GitHub data available to verify project claims.',
          evidence: 'User account lacks GitHub connection.',
          impact: 0
        }]
      };
    }

    const projects = await Project.find({ userId }).lean();
    
    if (projects.length === 0) {
      return {
        score: 0,
        signals: [{
          type: 'project',
          title: 'No Verified Projects',
          description: 'User has no verified GitHub repositories.',
          evidence: '0 connected repositories.',
          impact: 0
        }]
      };
    }

    const signals: CredibilitySignal[] = [];
    let score = 0;
    
    const totalCommits = projects.reduce((sum, p) => sum + (p.totalCommits || 0), 0);
    if (totalCommits > 1000) {
      score += 40;
      signals.push({ type: 'project', title: 'Extensive Engineering History', description: 'Massive commit history proving deep engineering experience.', evidence: `${totalCommits} total verified commits`, impact: 40 });
    } else if (totalCommits > 300) {
      score += 25;
      signals.push({ type: 'project', title: 'Strong Engineering History', description: 'Solid track record of code contributions.', evidence: `${totalCommits} total verified commits`, impact: 25 });
    } else if (totalCommits > 50) {
      score += 10;
    }

    const deployedProjects = projects.filter(p => !!p.liveUrl);
    if (deployedProjects.length > 2) {
      score += 30;
      signals.push({ type: 'project', title: 'Production Experience', description: 'Multiple projects successfully deployed to production environments.', evidence: `${deployedProjects.length} live deployments`, impact: 30 });
    } else if (deployedProjects.length === 1) {
      score += 15;
    }

    // Evaluate architecture/tech stack complexity
    const complexProjects = projects.filter(p => p.techStack && p.techStack.length >= 4);
    if (complexProjects.length >= 3) {
      score += 30;
      signals.push({ type: 'project', title: 'Complex Architecture Exposure', description: 'Experience integrating multiple technologies and services.', evidence: `${complexProjects.length} multi-stack repositories`, impact: 30 });
    } else if (complexProjects.length > 0) {
      score += 15;
    }

    return {
      score: Math.min(100, score),
      signals
    };
  }
}
