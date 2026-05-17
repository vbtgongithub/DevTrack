// src/modules/analytics/featureValueValidation.service.ts — Feature Value Validation Service
// Phase-K: Feature Value Validation - Feature-value scoring, engagement contribution analysis, retention impact analysis, product simplification recommendations

import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface FeatureValueValidation {
  featureName: string;
  valueScore: number; // 0-100
  engagementContribution: number; // 0-100
  retentionImpact: number; // 0-100
  simplificationRecommendation: 'keep' | 'simplify' | 'hide' | 'remove';
  reason: string;
}

export interface ValueValidationReport {
  totalFeatures: number;
  highValueFeatures: number;
  mediumValueFeatures: number;
  lowValueFeatures: number;
  averageValueScore: number;
  averageEngagementContribution: number;
  averageRetentionImpact: number;
  simplificationRecommendations: string[];
}

export const featureValueValidation = {
  // ─── Validate Feature Value ─────────────────────────────────────────────────────
  async validateFeatureValue(featureName: string): Promise<FeatureValueValidation> {
    const featureUsage = await FeatureUsageAnalytics.findOne({ featureName });

    if (!featureUsage) {
      return {
        featureName,
        valueScore: 0,
        engagementContribution: 0,
        retentionImpact: 0,
        simplificationRecommendation: 'remove',
        reason: 'Feature has no usage data - consider removal',
      };
    }

    const valueScore = this.calculateValueScore(featureUsage);
    const engagementContribution = this.calculateEngagementContribution(featureUsage);
    const retentionImpact = this.calculateRetentionImpact(featureUsage);

    const simplificationRecommendation = this.determineSimplificationRecommendation(valueScore, engagementContribution, retentionImpact);
    const reason = this.generateValidationReason(valueScore, engagementContribution, retentionImpact, simplificationRecommendation);

    return {
      featureName,
      valueScore,
      engagementContribution,
      retentionImpact,
      simplificationRecommendation,
      reason,
    };
  },

  // ─── Calculate Value Score ─────────────────────────────────────────────────────
  calculateValueScore(featureUsage: any): number {
    let score = 0;

    // Discovery rate (20% weight)
    score += featureUsage.discoveryRate * 0.2;

    // Repeat usage rate (25% weight)
    score += featureUsage.repeatUsageRate * 0.25;

    // First-use retention (20% weight)
    score += featureUsage.firstUseRetention * 0.2;

    // Satisfaction score (20% weight)
    score += featureUsage.satisfactionScore * 0.2;

    // Business impact (15% weight)
    const impactScore = featureUsage.businessImpact === 'critical' ? 100 : featureUsage.businessImpact === 'high' ? 80 : 60;
    score += impactScore * 0.15;

    return Math.min(100, score);
  },

  // ─── Calculate Engagement Contribution ───────────────────────────────────────────
  calculateEngagementContribution(featureUsage: any): number {
    let contribution = 0;

    // Usage frequency contribution
    const frequencyScore = featureUsage.usageFrequency === 'daily' ? 100 : featureUsage.usageFrequency === 'weekly' ? 75 : featureUsage.usageFrequency === 'monthly' ? 50 : 25;
    contribution += frequencyScore * 0.3;

    // Time spent contribution
    const timeScore = Math.min(100, featureUsage.averageTimeSpent / 60); // Normalize to 0-100 based on minutes
    contribution += timeScore * 0.3;

    // Completion rate contribution
    contribution += featureUsage.completionRate * 0.2;

    // Discovery rate contribution
    contribution += featureUsage.discoveryRate * 0.2;

    return Math.min(100, contribution);
  },

  // ─── Calculate Retention Impact ───────────────────────────────────────────────
  calculateRetentionImpact(featureUsage: any): number {
    let impact = 0;

    // First-use retention is the strongest indicator
    impact += featureUsage.firstUseRetention * 0.4;

    // 30-day retention
    impact += featureUsage.thirtyDayRetention * 0.3;

    // Repeat usage rate
    impact += featureUsage.repeatUsageRate * 0.2;

    // Satisfaction score
    impact += featureUsage.satisfactionScore * 0.1;

    return Math.min(100, impact);
  },

  // ─── Determine Simplification Recommendation ───────────────────────────────────
  determineSimplificationRecommendation(valueScore: number, engagementContribution: number, retentionImpact: number): 'keep' | 'simplify' | 'hide' | 'remove' {
    const overallScore = (valueScore * 0.4 + engagementContribution * 0.3 + retentionImpact * 0.3);

    if (overallScore >= 70) {
      return 'keep';
    }

    if (overallScore >= 50) {
      return 'simplify';
    }

    if (overallScore >= 30) {
      return 'hide';
    }

    return 'remove';
  },

  // ─── Generate Validation Reason ───────────────────────────────────────────────
  generateValidationReason(valueScore: number, engagementContribution: number, retentionImpact: number, recommendation: string): string {
    const overallScore = (valueScore * 0.4 + engagementContribution * 0.3 + retentionImpact * 0.3);

    switch (recommendation) {
      case 'keep':
        return `High value feature - overall score: ${overallScore.toFixed(1)}`;
      case 'simplify':
        return `Moderate value - needs simplification - overall score: ${overallScore.toFixed(1)}`;
      case 'hide':
        return `Low value - consider hiding - overall score: ${overallScore.toFixed(1)}`;
      case 'remove':
        return `Very low value - consider removal - overall score: ${overallScore.toFixed(1)}`;
      default:
        return 'Unknown recommendation';
    }
  },

  // ─── Generate Value Validation Report ─────────────────────────────────────────────
  async generateValueValidationReport(): Promise<ValueValidationReport> {
    const features = await FeatureUsageAnalytics.find();

    const highValueFeatures: number[] = [];
    const mediumValueFeatures: number[] = [];
    const lowValueFeatures: number[] = [];

    let totalValueScore = 0;
    let totalEngagementContribution = 0;
    let totalRetentionImpact = 0;

    for (const feature of features) {
      const validation = await this.validateFeatureValue(feature.featureName);

      totalValueScore += validation.valueScore;
      totalEngagementContribution += validation.engagementContribution;
      totalRetentionImpact += validation.retentionImpact;

      const overallScore = validation.valueScore * 0.4 + validation.engagementContribution * 0.3 + validation.retentionImpact * 0.3;

      if (overallScore >= 70) {
        highValueFeatures.push(1);
      } else if (overallScore >= 50) {
        mediumValueFeatures.push(1);
      } else {
        lowValueFeatures.push(1);
      }
    }

    const averageValueScore = features.length > 0 ? totalValueScore / features.length : 0;
    const averageEngagementContribution = features.length > 0 ? totalEngagementContribution / features.length : 0;
    const averageRetentionImpact = features.length > 0 ? totalRetentionImpact / features.length : 0;

    const simplificationRecommendations = this.generateReportRecommendations(
      highValueFeatures.length,
      mediumValueFeatures.length,
      lowValueFeatures.length,
      features.length
    );

    return {
      totalFeatures: features.length,
      highValueFeatures: highValueFeatures.length,
      mediumValueFeatures: mediumValueFeatures.length,
      lowValueFeatures: lowValueFeatures.length,
      averageValueScore,
      averageEngagementContribution,
      averageRetentionImpact,
      simplificationRecommendations,
    };
  },

  // ─── Generate Report Recommendations ───────────────────────────────────────────────
  generateReportRecommendations(highValue: number, mediumValue: number, lowValue: number, totalFeatures: number): string[] {
    const recommendations: string[] = [];

    if (lowValue / totalFeatures > 0.3) {
      recommendations.push('30%+ features are low value - consider removal or hiding');
    }

    if (mediumValue / totalFeatures > 0.5) {
      recommendations.push('50%+ features need simplification - prioritize high-usage features');
    }

    if (lowValue > 0) {
      recommendations.push(`${lowValue} features are candidates for removal`);
    }

    if (mediumValue > 3) {
      recommendations.push(`${mediumValue} features need simplification`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Feature portfolio is healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default featureValueValidation;
