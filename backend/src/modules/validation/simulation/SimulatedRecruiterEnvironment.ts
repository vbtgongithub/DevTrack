// src/modules/validation/simulation/SimulatedRecruiterEnvironment.ts
// Simulates recruiter search patterns and expectations.

import { logger } from '../../../shared/logger.js';
import type { SyntheticProfile } from './SyntheticEngineeringProfileGenerator.js';

export interface RecruiterQuery {
  id: string;
  roleTarget: string;
  mustHaveSkills: string[];
  minimumYoe: number;
  strictInfraRequirement: boolean;
}

export class SimulatedRecruiterEnvironment {
  constructor() {
    logger.info('[SimulatedRecruiterEnv] Initialized');
  }

  generateQueries(count: number): RecruiterQuery[] {
    const queries: RecruiterQuery[] = [];
    const roles = ['backend', 'frontend', 'fullstack', 'devops'];
    
    for (let i = 0; i < count; i++) {
      const role = roles[i % roles.length];
      queries.push({
        id: `query_${i}`,
        roleTarget: role,
        mustHaveSkills: role === 'backend' ? ['node', 'postgres'] : ['react'],
        minimumYoe: i % 3 === 0 ? 5 : 2,
        strictInfraRequirement: role === 'devops' || i % 4 === 0,
      });
    }
    return queries;
  }

  evaluateMatch(profile: SyntheticProfile, query: RecruiterQuery): number {
    let score = 0;
    if (profile.role === query.roleTarget) score += 0.4;
    if (profile.yearsExperience >= query.minimumYoe) score += 0.3;
    
    const skillMatch = query.mustHaveSkills.filter(s => profile.techStack.includes(s)).length;
    score += (skillMatch / query.mustHaveSkills.length) * 0.3;

    if (query.strictInfraRequirement && profile.infraMaturity < 0.6) {
      score *= 0.5; // Penalty
    }

    return score;
  }
}
