// src/modules/simplification/productSimplificationIteration.service.ts — Product Simplification Iteration Service
// Phase-K: Product Simplification Iteration - Simplification scoring, feature-removal candidates, cognitive-load analytics, UI density refinement

import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface SimplificationScore {
  featureName: string;
  currentScore: number; // 0-100, higher = simpler
  complexityScore: number; // 0-100, higher = more complex
  cognitiveLoad: number; // 0-100, higher = more load
  recommendation: 'keep' | 'simplify' | 'hide' | 'remove';
  reason: string;
}

export interface FeatureRemovalCandidate {
  featureName: string;
  removalScore: number; // 0-100, higher = better removal candidate
  usageRate: number;
  valueScore: number;
  complexityCost: number;
  recommendation: 'remove' | 'hide' | 'simplify' | 'keep';
  impact: 'low' | 'medium' | 'high';
}

export const productSimplificationIteration = {
  // ─── Calculate Simplification Score ─────────────────────────────────────────────
  async calculateSimplificationScore(featureName: string): Promise<SimplificationScore> {
    const featureUsage = await FeatureUsageAnalytics.findOne({ featureName });

    if (!featureUsage) {
      return {
        featureName,
        currentScore: 0,
        complexityScore: 50,
        cognitiveLoad: 50,
        recommendation: 'remove',
        reason: 'Feature has no usage data - consider removal',
      };
    }

    const complexityScore = this.calculateComplexityScore(featureUsage);
    const cognitiveLoad = this.calculateCognitiveLoad(featureUsage);
    const currentScore = 100 - (complexityScore * 0.4 + cognitiveLoad * 0.6);

    const recommendation = this.determineSimplificationRecommendation(currentScore, featureUsage);
    const reason = this.generateSimplificationReason(currentScore, complexityScore, cognitiveLoad, recommendation);

    return {
      featureName,
      currentScore,
      complexityScore,
      cognitiveLoad,
      recommendation,
      reason,
    };
  },

  // ─── Calculate Complexity Score ───────────────────────────────────────────────
  calculateComplexityScore(featureUsage: any): number {
    let score = 0;

    // Low usage indicates potential complexity
    if (featureUsage.usageFrequency === 'rarely') score += 30;
    else if (featureUsage.usageFrequency === 'occasionally') score += 15;

    // Low completion rate indicates complexity
    if (featureUsage.completionRate < 50) score += 25;
    else if (featureUsage.completionRate < 70) score += 10;

    // High error rate indicates complexity
    if (featureUsage.errorRate > 10) score += 20;
    else if (featureUsage.errorRate > 5) score += 10;

    // Low satisfaction indicates complexity
    if (featureUsage.satisfactionScore < 50) score += 15;
    else if (featureUsage.satisfactionScore < 70) score += 5;

    // High time spent can indicate complexity
    if (featureUsage.averageTimeSpent > 30000) score += 10;

    return Math.min(100, score);
  },

  // ─── Calculate Cognitive Load ───────────────────────────────────────────────────
  calculateCognitiveLoad(featureUsage: any): number {
    let load = 0;

    // Low discovery rate indicates cognitive load
    if (featureUsage.discoveryRate < 30) load += 25;
    else if (featureUsage.discoveryRate < 50) load += 10;

    // Low repeat usage indicates cognitive load
    if (featureUsage.repeatUsageRate < 20) load += 20;
    else if (featureUsage.repeatUsageRate < 40) load += 10;

    // High ignore rate indicates cognitive load
    if (featureUsage.ignoreRate > 40) load += 25;
    else if (featureUsage.ignoreRate > 20) load += 10;

    // High abandonment rate indicates cognitive load
    if (featureUsage.abandonmentRate > 30) load += 20;
    else if (featureUsage.abandonmentRate > 15) load += 10;

    return Math.min(100, load);
  },

  // ─── Determine Simplification Recommendation ───────────────────────────────────
  determineSimplificationRecommendation(currentScore: number, featureUsage: any): 'keep' | 'simplify' | 'hide' | 'remove' {
    if (featureUsage.usageFrequency === 'rarely' && featureUsage.discoveryRate < 20) {
      return 'remove';
    }

    if (currentScore < 40) {
      return 'remove';
    }

    if (currentScore < 60) {
      return 'simplify';
    }

    if (currentScore < 80) {
      return 'hide';
    }

    return 'keep';
  },

  // ─── Generate Simplification Reason ─────────────────────────────────────────────
  generateSimplificationReason(currentScore: number, complexityScore: number, cognitiveLoad: number, recommendation: string): string {
    switch (recommendation) {
      case 'keep':
        return `Feature is simple and valuable - current score: ${currentScore.toFixed(1)}`;
      case 'simplify':
        return `Feature needs simplification - complexity: ${complexityScore.toFixed(1)}, cognitive load: ${cognitiveLoad.toFixed(1)}`;
      case 'hide':
        return `Consider hiding behind progressive disclosure - complexity: ${complexityScore.toFixed(1)}`;
      case 'remove':
        return `Consider removal - low value and high complexity`;
      default:
        return 'Unknown recommendation';
    }
  },

  // ─── Identify Feature Removal Candidates ───────────────────────────────────────
  async identifyFeatureRemovalCandidates(): Promise<FeatureRemovalCandidate[]> {
    const features = await FeatureUsageAnalytics.find();

    const candidates: FeatureRemovalCandidate[] = [];

    for (const feature of features) {
      const usageRate = featureUsageToUsageRate(feature.usageFrequency);
      const valueScore = featureUsageToValueScore(feature);
      const complexityCost = this.calculateComplexityScore(feature);
      const cognitiveCost = this.calculateCognitiveLoad(feature);

      const removalScore = (100 - valueScore) * 0.4 + complexityCost * 0.3 + cognitiveCost * 0.3;

      const recommendation = this.determineRemovalRecommendation(removalScore, usageRate, valueScore);
      const impact = this.determineImpact(feature);

      candidates.push({
        featureName: feature.featureName,
        removalScore,
        usageRate,
        valueScore,
        complexityCost,
        recommendation,
        impact,
      });
    }

    return candidates.sort((a, b) => b.removalScore - a.removalScore);
  },

  // ─── Determine Removal Recommendation ───────────────────────────────────────────
  determineRemovalRecommendation(removalScore: number, usageRate: number, valueScore: number): 'remove' | 'hide' | 'simplify' | 'keep' {
    if (removalScore > 70 && usageRate < 20) {
      return 'remove';
    }

    if (removalScore > 60 && usageRate < 30) {
      return 'hide';
    }

    if (removalScore > 50) {
      return 'simplify';
    }

    return 'keep';
  },

  // ─── Determine Impact ─────────────────────────────────────────────────────────
  determineImpact(feature: any): 'low' | 'medium' | 'high' {
    if (feature.businessImpact === 'critical') return 'high';
    if (feature.businessImpact === 'high') return 'medium';
    return 'low';
  },

  // ─── Generate Simplification Report ─────────────────────────────────────────────
  async generateSimplificationReport(): Promise<{
    totalFeatures: number;
    removalCandidates: number;
    simplificationCandidates: number;
    hideCandidates: number;
    keepFeatures: number;
    recommendations: string[];
  }> {
    const candidates = await this.identifyFeatureRemovalCandidates();

    const removalCandidates = candidates.filter(c => c.recommendation === 'remove').length;
    const simplificationCandidates = candidates.filter(c => c.recommendation === 'simplify').length;
    const hideCandidates = candidates.filter(c => c.recommendation === 'hide').length;
    const keepFeatures = candidates.filter(c => c.recommendation === 'keep').length;

    const recommendations = this.generateReportRecommendations(
      removalCandidates,
      simplificationCandidates,
      hideCandidates,
      candidates
    );

    return {
      totalFeatures: candidates.length,
      removalCandidates,
      simplificationCandidates,
      hideCandidates,
      keepFeatures,
      recommendations,
    };
  },

  // ─── Generate Report Recommendations ─────────────────────────────────────────────
  generateReportRecommendations(
    removalCandidates: number,
    simplificationCandidates: number,
    hideCandidates: number,
    candidates: FeatureRemovalCandidate[]
  ): string[] {
    const recommendations: string[] = [];

    if (removalCandidates > 0) {
      recommendations.push(`${removalCandidates} features are candidates for removal - review low-impact features first`);
    }

    if (simplificationCandidates > 3) {
      recommendations.push(`${simplificationCandidates} features need simplification - prioritize high-usage features`);
    }

    if (hideCandidates > 2) {
      recommendations.push(`${hideCandidates} features should be hidden behind progressive disclosure`);
    }

    candidates.slice(0, 3).forEach(c => {
      if (c.recommendation === 'remove' && c.impact === 'low') {
        recommendations.push(`Consider removing: ${c.featureName} (low impact)`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Product complexity is acceptable - continue monitoring');
    }

    return recommendations;
  },
};

// Helper functions
function featureUsageToUsageRate(frequency: string): number {
  switch (frequency) {
    case 'daily': return 80;
    case 'weekly': return 60;
    case 'monthly': return 40;
    case 'rarely': return 20;
    default: return 50;
  }
}

function featureUsageToValueScore(feature: any): number {
  let score = 0;
  score += feature.discoveryRate * 0.2;
  score += feature.repeatUsageRate * 0.25;
  score += feature.firstUseRetention * 0.2;
  score += feature.satisfactionScore * 0.2;
  const impactScore = feature.businessImpact === 'critical' ? 100 : feature.businessImpact === 'high' ? 80 : 60;
  score += impactScore * 0.15;
  return score;
}

export default productSimplificationIteration;
