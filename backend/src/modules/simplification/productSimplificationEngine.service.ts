// src/modules/simplification/productSimplificationEngine.service.ts — Product Simplification Engine
// Phase-J: Product Simplification Engine - Simplification scoring and feature-value analysis

import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface SimplificationScore {
  featureName: string;
  emotionalValue: number; // 0-100
  behavioralUsefulness: number; // 0-100
  cognitiveCost: number; // 0-100
  overallScore: number; // 0-100
  recommendation: 'keep' | 'simplify' | 'hide' | 'remove';
  reason: string;
}

export interface FeatureValueAnalysis {
  totalFeatures: number;
  highValueFeatures: string[];
  mediumValueFeatures: string[];
  lowValueFeatures: string[];
  deadFeatures: string[];
  simplificationOpportunities: string[];
}

export const productSimplificationEngine = {
  // ─── Calculate Simplification Score ─────────────────────────────────────
  async calculateSimplificationScore(featureName: string): Promise<SimplificationScore> {
    const featureUsage = await FeatureUsageAnalytics.findOne({ featureName });
    
    if (!featureUsage) {
      return {
        featureName,
        emotionalValue: 0,
        behavioralUsefulness: 0,
        cognitiveCost: 50,
        overallScore: 0,
        recommendation: 'remove',
        reason: 'Feature has no usage data - likely unused',
      };
    }

    // Calculate emotional value (satisfaction + positive sentiment)
    const emotionalValue = (featureUsage.satisfactionScore * 0.6 + featureUsage.firstUseRetention * 0.4);

    // Calculate behavioral usefulness (usage frequency + repeat usage)
    const frequencyScore = this.getFrequencyScore(featureUsage.usageFrequency);
    const behavioralUsefulness = (frequencyScore * 0.5 + featureUsage.repeatUsageRate * 0.5);

    // Calculate cognitive cost (inverse of discovery rate + complexity)
    const cognitiveCost = (100 - featureUsage.discoveryRate) * 0.5 + this.estimateComplexity(featureName) * 0.5;

    // Calculate overall score
    const overallScore = (emotionalValue * 0.4 + behavioralUsefulness * 0.4 - cognitiveCost * 0.2);

    // Determine recommendation
    const recommendation = this.determineRecommendation(overallScore, emotionalValue, behavioralUsefulness, cognitiveCost);
    const reason = this.generateRecommendationReason(recommendation, overallScore, emotionalValue, behavioralUsefulness, cognitiveCost);

    return {
      featureName,
      emotionalValue,
      behavioralUsefulness,
      cognitiveCost,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      recommendation,
      reason,
    };
  },

  // ─── Get Frequency Score ───────────────────────────────────────────────
  getFrequencyScore(frequency: string): number {
    switch (frequency) {
      case 'daily': return 100;
      case 'weekly': return 75;
      case 'monthly': return 50;
      case 'rarely': return 25;
      default: return 0;
    }
  },

  // ─── Estimate Complexity ───────────────────────────────────────────────
  estimateComplexity(featureName: string): number {
    // Simplified complexity estimation based on feature name patterns
    const complexPatterns = ['dashboard', 'analytics', 'settings', 'configuration', 'integration'];
    const simplePatterns = ['toggle', 'button', 'link', 'badge'];

    const lowerName = featureName.toLowerCase();
    
    if (complexPatterns.some(p => lowerName.includes(p))) {
      return 70;
    }
    if (simplePatterns.some(p => lowerName.includes(p))) {
      return 30;
    }
    
    return 50; // Default medium complexity
  },

  // ─── Determine Recommendation ───────────────────────────────────────────
  determineRecommendation(
    overallScore: number,
    emotionalValue: number,
    behavioralUsefulness: number,
    cognitiveCost: number
  ): 'keep' | 'simplify' | 'hide' | 'remove' {
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

  // ─── Generate Recommendation Reason ───────────────────────────────────────
  generateRecommendationReason(
    recommendation: 'keep' | 'simplify' | 'hide' | 'remove',
    overallScore: number,
    emotionalValue: number,
    behavioralUsefulness: number,
    cognitiveCost: number
  ): string {
    switch (recommendation) {
      case 'keep':
        return `High overall score (${overallScore.toFixed(1)}) - feature provides strong value with acceptable cognitive cost`;
      case 'simplify':
        return `Moderate score (${overallScore.toFixed(1)}) - feature has value but could be simplified to reduce cognitive cost (${cognitiveCost.toFixed(1)})`;
      case 'hide':
        return `Low score (${overallScore.toFixed(1)}) - feature has limited value and high cognitive cost - consider hiding behind progressive disclosure`;
      case 'remove':
        return `Very low score (${overallScore.toFixed(1)}) - feature provides minimal value (${behavioralUsefulness.toFixed(1)}) with high cognitive cost (${cognitiveCost.toFixed(1)}) - consider removal`;
    }
  },

  // ─── Conduct Feature Value Analysis ─────────────────────────────────────
  async conductFeatureValueAnalysis(): Promise<FeatureValueAnalysis> {
    const features = await FeatureUsageAnalytics.find();

    const highValueFeatures: string[] = [];
    const mediumValueFeatures: string[] = [];
    const lowValueFeatures: string[] = [];
    const deadFeatures: string[] = [];

    for (const feature of features) {
      const score = await this.calculateSimplificationScore(feature.featureName);
      
      if (score.overallScore >= 70) {
        highValueFeatures.push(feature.featureName);
      } else if (score.overallScore >= 50) {
        mediumValueFeatures.push(feature.featureName);
      } else if (score.overallScore >= 30) {
        lowValueFeatures.push(feature.featureName);
      } else {
        deadFeatures.push(feature.featureName);
      }
    }

    // Identify simplification opportunities
    const simplificationOpportunities = [
      ...lowValueFeatures.map(f => `Simplify or hide: ${f}`),
      ...deadFeatures.map(f => `Consider removing: ${f}`),
    ];

    return {
      totalFeatures: features.length,
      highValueFeatures,
      mediumValueFeatures,
      lowValueFeatures,
      deadFeatures,
      simplificationOpportunities,
    };
  },

  // ─── Get Simplification Report ────────────────────────────────────────────
  async getSimplificationReport(): Promise<{
    totalFeatures: number;
    featuresToKeep: number;
    featuresToSimplify: number;
    featuresToHide: number;
    featuresToRemove: number;
    potentialCognitiveLoadReduction: number;
    recommendations: string[];
  }> {
    const features = await FeatureUsageAnalytics.find();
    
    let featuresToKeep = 0;
    let featuresToSimplify = 0;
    let featuresToHide = 0;
    let featuresToRemove = 0;
    let totalCognitiveCost = 0;
    let simplifiedCognitiveCost = 0;

    const recommendations: string[] = [];

    for (const feature of features) {
      const score = await this.calculateSimplificationScore(feature.featureName);
      
      totalCognitiveCost += score.cognitiveCost;

      switch (score.recommendation) {
        case 'keep':
          featuresToKeep++;
          simplifiedCognitiveCost += score.cognitiveCost;
          break;
        case 'simplify':
          featuresToSimplify++;
          simplifiedCognitiveCost += score.cognitiveCost * 0.5; // Assume 50% reduction
          recommendations.push(score.reason);
          break;
        case 'hide':
          featuresToHide++;
          simplifiedCognitiveCost += score.cognitiveCost * 0.2; // Assume 80% reduction
          recommendations.push(score.reason);
          break;
        case 'remove':
          featuresToRemove++;
          simplifiedCognitiveCost += 0; // Full reduction
          recommendations.push(score.reason);
          break;
      }
    }

    const potentialCognitiveLoadReduction = totalCognitiveCost > 0 
      ? ((totalCognitiveCost - simplifiedCognitiveCost) / totalCognitiveCost) * 100 
      : 0;

    return {
      totalFeatures: features.length,
      featuresToKeep,
      featuresToSimplify,
      featuresToHide,
      featuresToRemove,
      potentialCognitiveLoadReduction,
      recommendations,
    };
  },

  // ─── Identify Low-Value UI Elements ───────────────────────────────────────
  async identifyLowValueUIElements(): Promise<Array<{
    element: string;
    interactionRate: number;
    frictionRate: number;
    recommendation: string;
  }>> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const elementInteractions = new Map<string, { interactions: number; friction: number }>();

    sessionReplays.forEach(replay => {
      replay.interactions.forEach(interaction => {
        const element = interaction.element;
        const existing = elementInteractions.get(element) || { interactions: 0, friction: 0 };
        existing.interactions++;
        elementInteractions.set(element, existing);
      });

      replay.frictionEvents.forEach(event => {
        const element = event.element;
        const existing = elementInteractions.get(element) || { interactions: 0, friction: 0 };
        existing.friction++;
        elementInteractions.set(element, existing);
      });
    });

    const totalSessions = sessionReplays.length;
    const lowValueElements: Array<{
      element: string;
      interactionRate: number;
      frictionRate: number;
      recommendation: string;
    }> = [];

    elementInteractions.forEach((stats, element) => {
      const interactionRate = totalSessions > 0 ? (stats.interactions / totalSessions) * 100 : 0;
      const frictionRate = stats.interactions > 0 ? (stats.friction / stats.interactions) * 100 : 0;

      if (interactionRate < 10 && frictionRate > 20) {
        lowValueElements.push({
          element,
          interactionRate,
          frictionRate,
          recommendation: 'Consider removing - low interaction rate with high friction',
        });
      } else if (interactionRate < 20) {
        lowValueElements.push({
          element,
          interactionRate,
          frictionRate,
          recommendation: 'Consider hiding or simplifying - low interaction rate',
        });
      }
    });

    return lowValueElements.sort((a, b) => a.interactionRate - b.interactionRate).slice(0, 20);
  },
};

export default productSimplificationEngine;
