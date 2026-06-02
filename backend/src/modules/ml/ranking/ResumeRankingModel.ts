// src/modules/ml/ranking/ResumeRankingModel.ts
// XGBoost-style ranking model for resume scoring.
// Extracts features from ATS signals, infra maturity, engineering depth,
// deployment evidence, semantic similarity, project authenticity, credibility.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector } from '../types.js';
import { RankingModelBase } from './RankingModelBase.js';

interface ResumeRankingInput {
  atsScore: number;
  atsKeywordDensity: number;
  atsFormatCompliance: number;
  infraMaturityScore: number;
  dockerUsage: boolean;
  cicdPipeline: boolean;
  cloudDeployment: boolean;
  monitoring: boolean;
  engineeringDepth: number;
  totalCommits: number;
  techStackDiversity: number;
  architectureComplexity: number;
  deploymentEvidence: number;
  liveUrlCount: number;
  productionReadiness: number;
  semanticSimilarityToRole: number;
  skillOverlapRatio: number;
  roleAlignmentScore: number;
  projectAuthenticityScore: number;
  tutorialProjectRatio: number;
  credibilityScore: number;
  evidenceCoverage: number;
  unsupportedClaimCount: number;
  roadmapProgressionScore: number;
  communityValidation: number;
  starsTotal: number;
  forksTotal: number;
}

/**
 * ResumeRankingModel
 *
 * XGBoost-style gradient boosted tree model for resume ranking.
 * Inputs: ATS features, infra maturity, engineering depth, deployment evidence,
 *         semantic similarity, project authenticity, credibility signals.
 * Outputs: ranking score with explainability.
 */
export class ResumeRankingModel extends RankingModelBase {
  constructor() {
    super('ResumeRankingModel');
    logger.info(`[ResumeRankingModel] Initialized with model ${this.modelId}`);
  }

  extractFeatures(input: ResumeRankingInput): FeatureVector {
    return {
      values: [
        input.atsScore,
        input.atsKeywordDensity,
        input.atsFormatCompliance,
        input.infraMaturityScore,
        input.dockerUsage ? 1 : 0,
        input.cicdPipeline ? 1 : 0,
        input.cloudDeployment ? 1 : 0,
        input.monitoring ? 1 : 0,
        input.engineeringDepth,
        Math.log1p(input.totalCommits) / 10,   // log-scale normalize
        input.techStackDiversity / 20,          // normalize
        input.architectureComplexity / 10,
        input.deploymentEvidence,
        input.liveUrlCount / 5,
        input.productionReadiness,
        input.semanticSimilarityToRole,
        input.skillOverlapRatio,
        input.roleAlignmentScore,
        input.projectAuthenticityScore,
        1 - input.tutorialProjectRatio,          // invert: fewer tutorials = better
        input.credibilityScore,
        input.evidenceCoverage,
        Math.max(0, 1 - input.unsupportedClaimCount * 0.2), // penalize claims
        input.roadmapProgressionScore,
        input.communityValidation,
        Math.log1p(input.starsTotal) / 10,
        Math.log1p(input.forksTotal) / 8,
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Rank resumes: extract features and predict for each resume input.
   */
  rankResumes(inputs: ResumeRankingInput[]): { inputIndex: number; score: number; confidence: number; explanation: string[] }[] {
    logger.info(`[ResumeRankingModel] Ranking ${inputs.length} resumes`);

    const results = inputs.map((input, index) => {
      const features = this.extractFeatures(input);
      const prediction = this.predict(features);
      const { explanation } = this.explain(features);

      return {
        inputIndex: index,
        score: prediction.score,
        confidence: prediction.confidence,
        explanation,
      };
    });

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  protected getFeatureNames(): string[] {
    return [
      'ats_score',
      'ats_keyword_density',
      'ats_format_compliance',
      'infra_maturity',
      'docker_usage',
      'cicd_pipeline',
      'cloud_deployment',
      'monitoring',
      'engineering_depth',
      'total_commits_log',
      'tech_stack_diversity',
      'architecture_complexity',
      'deployment_evidence',
      'live_url_count',
      'production_readiness',
      'semantic_similarity_role',
      'skill_overlap_ratio',
      'role_alignment',
      'project_authenticity',
      'non_tutorial_ratio',
      'credibility_score',
      'evidence_coverage',
      'unsupported_claim_penalty',
      'roadmap_progression',
      'community_validation',
      'stars_log',
      'forks_log',
    ];
  }
}
