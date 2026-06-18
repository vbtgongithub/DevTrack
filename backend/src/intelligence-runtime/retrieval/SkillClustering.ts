import { IntelligenceResult, ConfidenceEnvelope } from '../types/index.js';

export interface SkillCluster {
  coreSkill: string;
  adjacentSkills: string[];
  roleAffinity: Record<string, number>;
}

export class SkillClustering {
  // Pre-computed static adjacency graph based on DevTrack datasets
  private adjacencyGraph: Record<string, string[]> = {
    'react': ['javascript', 'typescript', 'redux', 'next.js', 'frontend', 'css'],
    'node.js': ['javascript', 'typescript', 'express', 'backend', 'mongodb', 'redis'],
    'aws': ['cloud', 'ec2', 's3', 'lambda', 'devops', 'terraform']
  };

  /**
   * Maps a skill to its cluster of adjacent technologies and role affinities.
   */
  async clusterSkill(skill: string): Promise<IntelligenceResult<SkillCluster>> {
    const normalized = skill.toLowerCase();
    const adjacent = this.adjacencyGraph[normalized] || [];
    
    let affinity: Record<string, number> = {};
    if (adjacent.includes('backend')) affinity['backend_engineer'] = 0.9;
    if (adjacent.includes('frontend')) affinity['frontend_engineer'] = 0.9;
    if (adjacent.includes('devops')) affinity['devops_engineer'] = 0.8;

    const cluster: SkillCluster = {
      coreSkill: normalized,
      adjacentSkills: adjacent,
      roleAffinity: affinity
    };

    const confidence: ConfidenceEnvelope = {
      confidence: adjacent.length > 0 ? 0.95 : 0.4,
      evidenceCount: adjacent.length,
      evidenceSources: ['dataset_skill_graph'],
      reasoning: adjacent.length > 0 ? 'Exact match in deterministic skill graph.' : 'Skill not found in primary clusters.'
    };

    return {
      data: cluster,
      confidence,
      metadata: {
        runtimeVersion: '1.0.0',
        schemaVersion: '1.0',
        replayCompatibilityVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };
  }
}
