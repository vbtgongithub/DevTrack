// src/modules/validation/simulation/SyntheticEngineeringProfileGenerator.ts
// Generates realistic synthetic engineering profiles for simulation.

import { logger } from '../../../shared/logger.js';

export interface SyntheticProfile {
  id: string;
  role: string;
  seniority: 'junior' | 'mid' | 'senior' | 'staff';
  techStack: string[];
  yearsExperience: number;
  projectCount: number;
  infraMaturity: number;
  dsaProficiency: number;
  systemDesignProficiency: number;
}

export class SyntheticEngineeringProfileGenerator {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
    logger.info('[SyntheticProfileGenerator] Initialized');
  }

  generateProfiles(count: number): SyntheticProfile[] {
    const profiles: SyntheticProfile[] = [];
    for (let i = 0; i < count; i++) {
      profiles.push(this.generateProfile(i));
    }
    logger.info(`[SyntheticProfileGenerator] Generated ${count} profiles`);
    return profiles;
  }

  private generateProfile(index: number): SyntheticProfile {
    const roles = ['backend', 'frontend', 'fullstack', 'devops', 'data'];
    const seniorities: ('junior' | 'mid' | 'senior' | 'staff')[] = ['junior', 'mid', 'senior', 'staff'];
    const role = roles[this.randomInt(roles.length)];
    const seniority = seniorities[this.randomInt(seniorities.length)];
    
    let yoe = 0;
    if (seniority === 'junior') yoe = this.randomInt(3);
    else if (seniority === 'mid') yoe = 3 + this.randomInt(4);
    else if (seniority === 'senior') yoe = 7 + this.randomInt(5);
    else yoe = 12 + this.randomInt(8);

    return {
      id: `synth_user_${index}`,
      role,
      seniority,
      techStack: this.generateStack(role),
      yearsExperience: yoe,
      projectCount: 2 + this.randomInt(5),
      infraMaturity: this.randomFloat(),
      dsaProficiency: this.randomFloat(),
      systemDesignProficiency: seniority === 'junior' ? this.randomFloat() * 0.5 : this.randomFloat(),
    };
  }

  private generateStack(role: string): string[] {
    const base = ['git', 'docker'];
    if (role === 'backend') return [...base, 'node', 'python', 'postgres', 'redis'];
    if (role === 'frontend') return [...base, 'react', 'typescript', 'tailwind'];
    if (role === 'devops') return [...base, 'kubernetes', 'terraform', 'aws'];
    return [...base, 'javascript'];
  }

  private randomFloat(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private randomInt(max: number): number {
    return Math.floor(this.randomFloat() * max);
  }
}
