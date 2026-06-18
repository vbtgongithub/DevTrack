// src/modules/ml/ranking/RecruiterAlignmentModel.ts
// LightGBM-style model scoring recruiter alignment.
// Features: role match, skill overlap, experience depth, culture signals.

import { logger } from '../../../shared/logger.js';
import type { FeatureVector, MLPrediction } from '../types.js';
import { RankingModelBase } from './RankingModelBase.js';

interface RecruiterAlignmentInput {
  roleMatchScore: number;
  seniorityAlignment: number;
  skillOverlapRatio: number;
  coreSkillCoverage: number;
  bonusSkillCoverage: number;
  experienceYears: number;
  requiredExperienceYears: number;
  industryRelevance: number;
  educationMatch: number;
  projectRelevance: number;
  deploymentMaturity: number;
  communicationQuality: number;
  leadershipSignals: number;
  teamCollaborationEvidence: number;
  cultureFitIndicators: number;
  locationMatch: number;
  salaryRangeAlignment: number;
  availabilityMatch: number;
}

/**
 * RecruiterAlignmentModel
 *
 * LightGBM-style gradient boosted model for scoring how well a candidate
 * aligns with recruiter expectations. Focuses on role fit, skill coverage,
 * experience depth, and soft signals.
 */
export class RecruiterAlignmentModel extends RankingModelBase {
  constructor() {
    super('RecruiterAlignmentModel');
    logger.info(`[RecruiterAlignmentModel] Initialized with model ${this.modelId}`);
  }

  extractFeatures(input: RecruiterAlignmentInput): FeatureVector {
    const experienceRatio = input.requiredExperienceYears > 0
      ? Math.min(2, input.experienceYears / input.requiredExperienceYears)
      : 1;

    return {
      values: [
        input.roleMatchScore,
        input.seniorityAlignment,
        input.skillOverlapRatio,
        input.coreSkillCoverage,
        input.bonusSkillCoverage,
        experienceRatio,
        input.industryRelevance,
        input.educationMatch,
        input.projectRelevance,
        input.deploymentMaturity,
        input.communicationQuality,
        input.leadershipSignals,
        input.teamCollaborationEvidence,
        input.cultureFitIndicators,
        input.locationMatch,
        input.salaryRangeAlignment,
        input.availabilityMatch,
        // Derived features
        (input.coreSkillCoverage + input.bonusSkillCoverage) / 2, // combined skill score
      ],
      names: this.getFeatureNames(),
    };
  }

  /**
   * Score alignment between candidate and recruiter requirements.
   */
  scoreAlignment(input: RecruiterAlignmentInput): MLPrediction & { alignmentLevel: string } {
    const features = this.extractFeatures(input);
    const prediction = this.predict(features);

    let alignmentLevel: string;
    if (prediction.score >= 0.85) alignmentLevel = 'strong_match';
    else if (prediction.score >= 0.7) alignmentLevel = 'good_match';
    else if (prediction.score >= 0.5) alignmentLevel = 'moderate_match';
    else if (prediction.score >= 0.3) alignmentLevel = 'weak_match';
    else alignmentLevel = 'poor_match';

    return { ...prediction, alignmentLevel };
  }

  protected getFeatureNames(): string[] {
    return [
      'role_match',
      'seniority_alignment',
      'skill_overlap_ratio',
      'core_skill_coverage',
      'bonus_skill_coverage',
      'experience_ratio',
      'industry_relevance',
      'education_match',
      'project_relevance',
      'deployment_maturity',
      'communication_quality',
      'leadership_signals',
      'team_collaboration',
      'culture_fit',
      'location_match',
      'salary_alignment',
      'availability_match',
      'combined_skill_score',
    ];
  }
}
