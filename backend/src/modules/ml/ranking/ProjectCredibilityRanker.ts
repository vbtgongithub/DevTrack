// src/modules/ml/ranking/ProjectCredibilityRanker.ts
// Gradient boosted tree model for project credibility scoring.
// Evidence-based features for authenticity and engineering quality assessment.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, MLPrediction } from '../types.js';
import { RankingModelBase } from './RankingModelBase.js';

interface ProjectCredibilityInput {
  projectId: string;
  commitCount: number;
  commitFrequency: number;
  uniqueContributors: number;
  hasRepository: boolean;
  hasLiveUrl: boolean;
  hasDocumentation: boolean;
  hasCICD: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  techStackSize: number;
  descriptionLength: number;
  descriptionQuality: number;
  codeToDocRatio: number;
  issueCount: number;
  prCount: number;
  branchCount: number;
  lastCommitRecency: number;
  repoAge: number;
  stars: number;
  forks: number;
  tutorialSignals: number;
  plagiarismRisk: number;
  claimEvidenceRatio: number;
}

interface CredibilityResult extends MLPrediction {
  credibilityLevel: 'high' | 'medium' | 'low' | 'suspicious';
  flags: string[];
  recommendations: string[];
}

/**
 * ProjectCredibilityRanker
 *
 * Gradient boosted model for project credibility and authenticity scoring.
 * Uses evidence-based features to detect tutorial projects, unsupported claims,
 * and weak engineering signals.
 *
 * All outputs include confidence, flags, and improvement recommendations.
 */
export class ProjectCredibilityRanker extends RankingModelBase {
  constructor() {
    super('ProjectCredibilityRanker');
    logger.info(`[ProjectCredibilityRanker] Initialized with model ${this.modelId}`);
  }

  extractFeatures(input: ProjectCredibilityInput): FeatureVector {
    return {
      values: [
        Math.log1p(input.commitCount) / 10,
        input.commitFrequency,
        Math.min(1, input.uniqueContributors / 5),
        input.hasRepository ? 1 : 0,
        input.hasLiveUrl ? 1 : 0,
        input.hasDocumentation ? 1 : 0,
        input.hasCICD ? 1 : 0,
        input.hasTests ? 1 : 0,
        input.hasDocker ? 1 : 0,
        Math.min(1, input.techStackSize / 10),
        Math.min(1, input.descriptionLength / 500),
        input.descriptionQuality,
        input.codeToDocRatio,
        Math.log1p(input.issueCount) / 5,
        Math.log1p(input.prCount) / 5,
        Math.min(1, input.branchCount / 10),
        input.lastCommitRecency,
        Math.min(1, input.repoAge / 365),
        Math.log1p(input.stars) / 10,
        Math.log1p(input.forks) / 8,
        1 - input.tutorialSignals,           // fewer tutorial signals = better
        1 - input.plagiarismRisk,            // lower risk = better
        input.claimEvidenceRatio,
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Score project credibility and generate flags/recommendations.
   */
  scoreCredibility(input: ProjectCredibilityInput): CredibilityResult {
    const features = this.extractFeatures(input);
    const prediction = this.predict(features);
    const { explanation } = this.explain(features);

    const flags: string[] = [];
    const recommendations: string[] = [];

    // Flag detection
    if (input.tutorialSignals > 0.7) {
      flags.push('High tutorial project probability');
    }
    if (input.plagiarismRisk > 0.5) {
      flags.push('Elevated plagiarism risk detected');
    }
    if (input.commitCount < 10 && input.techStackSize > 5) {
      flags.push('Tech stack complexity inconsistent with commit history');
    }
    if (!input.hasRepository) {
      flags.push('No repository link for verification');
    }
    if (input.claimEvidenceRatio < 0.3) {
      flags.push('Claims not well supported by evidence');
    }

    // Recommendations
    if (!input.hasLiveUrl) {
      recommendations.push('Deploy the project to demonstrate production readiness');
    }
    if (!input.hasCICD) {
      recommendations.push('Add CI/CD pipeline to show engineering maturity');
    }
    if (!input.hasTests) {
      recommendations.push('Add tests to demonstrate code quality');
    }
    if (input.descriptionQuality < 0.5) {
      recommendations.push('Improve project description with technical details and outcomes');
    }

    // Determine credibility level
    let credibilityLevel: 'high' | 'medium' | 'low' | 'suspicious';
    if (prediction.score >= 0.8 && flags.length === 0) credibilityLevel = 'high';
    else if (prediction.score >= 0.6 && flags.length <= 1) credibilityLevel = 'medium';
    else if (prediction.score >= 0.3) credibilityLevel = 'low';
    else credibilityLevel = 'suspicious';

    return {
      ...prediction,
      credibilityLevel,
      flags,
      recommendations,
    };
  }

  protected getFeatureNames(): string[] {
    return [
      'commit_count_log',
      'commit_frequency',
      'unique_contributors',
      'has_repository',
      'has_live_url',
      'has_documentation',
      'has_cicd',
      'has_tests',
      'has_docker',
      'tech_stack_size',
      'description_length',
      'description_quality',
      'code_to_doc_ratio',
      'issue_count_log',
      'pr_count_log',
      'branch_count',
      'last_commit_recency',
      'repo_age',
      'stars_log',
      'forks_log',
      'non_tutorial_signal',
      'non_plagiarism_signal',
      'claim_evidence_ratio',
    ];
  }
}
