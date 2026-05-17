// src/modules/analytics/featureValueAnalytics.service.ts — Feature Value Analytics Service
// Phase-J: Feature Value Analytics - Feature discovery and repeat usage tracking

import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface FeatureValueMetrics {
  featureName: string;
  discoveryRate: number;
  repeatUsageRate: number;
  retentionRate: number;
  emotionalValue: number;
  businessImpact: number;
  overallValueScore: number; // 0-100
  recommendation: 'keep' | 'improve' | 'hide' | 'remove';
  reason: string;
}

export interface FeatureValueReport {
  totalFeatures: number;
  highValueFeatures: string[];
  mediumValueFeatures: string[];
  lowValueFeatures: string[];
  deadFeatures: string[];
  averageValueScore: number;
  recommendations: string[];
}

export const featureValueAnalytics = {
  // ─── Calculate Feature Value Metrics ───────────────────────────────────────────
  async calculateFeatureValueMetrics(featureName: string): Promise<FeatureValueMetrics> {
    const featureUsage = await FeatureUsageAnalytics.findOne({ featureName });

    if (!featureUsage) {
      return {
        featureName,
        discoveryRate: 0,
        repeatUsageRate: 0,
        retentionRate: 0,
        emotionalValue: 0,
        businessImpact: 0,
        overallValueScore: 0,
        recommendation: 'remove',
        reason: 'Feature has no usage data',
      };
    }

    // Calculate overall value score
    const overallValueScore = this.calculateOverallValueScore(featureUsage);

    // Determine recommendation
    const recommendation = this.determineRecommendation(overallValueScore, featureUsage);

    // Generate reason
    const reason = this.generateRecommendationReason(overallValueScore, featureUsage, recommendation);

    return {
      featureName,
      discoveryRate: featureUsage.discoveryRate,
      repeatUsageRate: featureUsage.repeatUsageRate,
      retentionRate: featureUsage.firstUseRetention,
      emotionalValue: featureUsage.satisfactionScore,
      businessImpact: this.getBusinessImpactScore(featureUsage.businessImpact),
      overallValueScore,
      recommendation,
      reason,
    };
  },

  // ─── Calculate Overall Value Score ─────────────────────────────────────────────
  calculateOverallValueScore(featureUsage: any): number {
    let score = 0;

    // Discovery rate (20% weight)
    score += featureUsage.discoveryRate * 0.2;

    // Repeat usage rate (25% weight)
    score += featureUsage.repeatUsageRate * 0.25;

    // Retention rate (20% weight)
    score += featureUsage.firstUseRetention * 0.2;

    // Satisfaction score (20% weight)
    score += featureUsage.satisfactionScore * 0.2;

    // Business impact (15% weight)
    score += this.getBusinessImpactScore(featureUsage.businessImpact) * 0.15;

    return Math.min(100, score);
  },

  // ─── Get Business Impact Score ─────────────────────────────────────────────────
  getBusinessImpactScore(impact: string): number {
    switch (impact) {
      case 'critical': return 100;
      case 'high': return 80;
      case 'medium': return 60;
      case 'low': return 40;
      case 'unknown': return 50;
      default: return 50;
    }
  },

  // ─── Determine Recommendation ───────────────────────────────────────────────────
  determineRecommendation(valueScore: number, featureUsage: any): 'keep' | 'improve' | 'hide' | 'remove' {
    if (valueScore >= 70) {
      return 'keep';
    }
    if (valueScore >= 50) {
      return 'improve';
    }
    if (valueScore >= 30) {
      return 'hide';
    }
    return 'remove';
  },

  // ─── Generate Recommendation Reason ───────────────────────────────────────────────
  generateRecommendationReason(valueScore: number, featureUsage: any, recommendation: string): string {
    switch (recommendation) {
      case 'keep':
        return `High value score (${valueScore.toFixed(1)}) - feature is valuable to users`;
      case 'improve':
        return `Moderate value score (${valueScore.toFixed(1)}) - feature has potential but needs improvement`;
      case 'hide':
        return `Low value score (${valueScore.toFixed(1)}) - consider hiding behind progressive disclosure`;
      case 'remove':
        return `Very low value score (${valueScore.toFixed(1)}) - consider removing to reduce complexity`;
      default:
        return 'Unknown recommendation';
    }
  },

  // ─── Generate Feature Value Report ─────────────────────────────────────────────
  async generateFeatureValueReport(): Promise<FeatureValueReport> {
    const features = await FeatureUsageAnalytics.find();

    const highValueFeatures: string[] = [];
    const mediumValueFeatures: string[] = [];
    const lowValueFeatures: string[] = [];
    const deadFeatures: string[] = [];

    let totalValueScore = 0;

    for (const feature of features) {
      const metrics = await this.calculateFeatureValueMetrics(feature.featureName);
      totalValueScore += metrics.overallValueScore;

      if (metrics.overallValueScore >= 70) {
        highValueFeatures.push(feature.featureName);
      } else if (metrics.overallValueScore >= 50) {
        mediumValueFeatures.push(feature.featureName);
      } else if (metrics.overallValueScore >= 30) {
        lowValueFeatures.push(feature.featureName);
      } else {
        deadFeatures.push(feature.featureName);
      }
    }

    const averageValueScore = features.length > 0 ? totalValueScore / features.length : 0;

    // Generate recommendations
    const recommendations = this.generateReportRecommendations(
      averageValueScore,
      highValueFeatures,
      mediumValueFeatures,
      lowValueFeatures,
      deadFeatures
    );

    return {
      totalFeatures: features.length,
      highValueFeatures,
      mediumValueFeatures,
      lowValueFeatures,
      deadFeatures,
      averageValueScore,
      recommendations,
    };
  },

  // ─── Generate Report Recommendations ───────────────────────────────────────────
  generateReportRecommendations(
    avgValueScore: number,
    highValue: string[],
    mediumValue: string[],
    lowValue: string[],
    dead: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (avgValueScore < 50) {
      recommendations.push('Low average feature value - review product strategy and feature portfolio');
    }

    if (dead.length > 0) {
      recommendations.push(`${dead.length} dead features detected - consider removal to reduce complexity`);
    }

    dead.forEach(feature => {
      recommendations.push(`Consider removing: ${feature}`);
    });

    if (lowValue.length > 3) {
      recommendations.push(`${lowValue.length} low-value features - consider hiding or improving`);
    }

    if (mediumValue.length > 5) {
      recommendations.push(`${mediumValue.length} features need improvement - prioritize based on impact`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Feature portfolio is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Track Feature Discovery ───────────────────────────────────────────────────
  async trackFeatureDiscovery(featureName: string, userId: string): Promise<void> {
    let featureUsage = await FeatureUsageAnalytics.findOne({ featureName });

    if (!featureUsage) {
      featureUsage = await FeatureUsageAnalytics.create({
        featureName,
        featureCategory: 'uncategorized',
        totalDiscoveries: 1,
        uniqueUsersDiscovered: 1,
        discoveryRate: 100,
        totalUses: 0,
        uniqueUsers: 1,
        averageUsagePerUser: 0,
        usageFrequency: 'rarely',
        firstUseRetention: 0,
        thirtyDayRetention: 0,
        repeatUsageRate: 0,
        averageTimeSpent: 0,
        completionRate: 0,
        errorRate: 0,
        satisfactionScore: 0,
        featureValueScore: 0,
        businessImpact: 'unknown',
        peakUsageTimes: [],
        userSegments: [],
        ignoreRate: 0,
        abandonmentRate: 0,
        correlatedFeatures: [],
        firstSeen: new Date(),
        lastUpdated: new Date(),
      });
    } else {
      featureUsage.totalDiscoveries++;
      featureUsage.uniqueUsersDiscovered++;
      featureUsage.discoveryRate = Math.min(100, (featureUsage.uniqueUsersDiscovered / featureUsage.totalDiscoveries) * 100);
      featureUsage.lastUpdated = new Date();
      await featureUsage.save();
    }
  },

  // ─── Track Feature Usage ───────────────────────────────────────────────────────
  async trackFeatureUsage(featureName: string, userId: string, metadata?: Record<string, unknown>): Promise<void> {
    const featureUsage = await FeatureUsageAnalytics.findOne({ featureName });

    if (!featureUsage) {
      await this.trackFeatureDiscovery(featureName, userId);
      return;
    }

    featureUsage.totalUses++;
    featureUsage.lastUpdated = new Date();
    await featureUsage.save();
  },
};

export default featureValueAnalytics;
