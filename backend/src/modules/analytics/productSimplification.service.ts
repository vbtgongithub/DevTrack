// src/modules/analytics/productSimplification.service.ts — Product Simplification Framework
// Phase-I: Product Simplification Pass - Feature visibility scoring and UX density audit

import mongoose from 'mongoose';
import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface FeatureVisibilityScore {
  featureName: string;
  visibilityScore: number; // 0-100
  cognitiveCost: number; // 0-100
  behavioralValue: number; // 0-100
  recommendation: 'keep' | 'hide' | 'simplify' | 'remove';
  justification: string;
}

export interface UXDensityAudit {
  component: string;
  elementCount: number;
  cognitiveLoad: 'low' | 'medium' | 'high' | 'severe';
  visualClutter: number; // 0-100
  interactionComplexity: number; // 0-100
  recommendations: string[];
}

export interface SimplificationReport {
  totalFeatures: number;
  featuresToKeep: number;
  featuresToHide: number;
  featuresToSimplify: number;
  featuresToRemove: number;
  overallCognitiveLoad: number;
  priorityActions: string[];
}

export const productSimplification = {
  // ─── Feature Visibility Scoring ────────────────────────────────────────
  async calculateFeatureVisibilityScore(featureName: string): Promise<FeatureVisibilityScore> {
    const feature = await FeatureUsageAnalytics.findOne({ featureName });
    if (!feature) {
      return {
        featureName,
        visibilityScore: 0,
        cognitiveCost: 50,
        behavioralValue: 0,
        recommendation: 'remove',
        justification: 'Feature not found in analytics',
      };
    }

    // Calculate cognitive cost based on complexity (placeholder)
    const cognitiveCost = this.estimateCognitiveCost(featureName);

    // Behavioral value from feature analytics
    const behavioralValue = feature.featureValueScore;

    // Visibility score balances value against cognitive cost
    const visibilityScore = behavioralValue - (cognitiveCost * 0.3);

    // Determine recommendation
    let recommendation: 'keep' | 'hide' | 'simplify' | 'remove';
    let justification: string;

    if (behavioralValue >= 70 && cognitiveCost <= 40) {
      recommendation = 'keep';
      justification = 'High value with low cognitive cost - essential feature';
    } else if (behavioralValue >= 60 && cognitiveCost <= 60) {
      recommendation = 'keep';
      justification = 'Good value with acceptable cognitive cost';
    } else if (behavioralValue >= 50 && cognitiveCost > 60) {
      recommendation = 'simplify';
      justification = 'Moderate value but high cognitive cost - simplify UI';
    } else if (behavioralValue >= 40 && cognitiveCost <= 40) {
      recommendation = 'hide';
      justification = 'Moderate value with low cognitive cost - hide behind progressive disclosure';
    } else if (behavioralValue < 40) {
      recommendation = 'remove';
      justification = 'Low behavioral value - consider removal';
    } else {
      recommendation = 'hide';
      justification = 'Unclear value - hide and monitor usage';
    }

    return {
      featureName,
      visibilityScore: Math.max(0, Math.min(100, visibilityScore)),
      cognitiveCost,
      behavioralValue,
      recommendation,
      justification,
    };
  },

  // ─── Estimate Cognitive Cost (Placeholder) ────────────────────────────
  estimateCognitiveCost(featureName: string): number {
    // In production, this would analyze the actual UI complexity
    // For now, use a heuristic based on feature name
    const complexFeatures = ['dashboard', 'settings', 'analytics', 'reports', 'integrations'];
    const simpleFeatures = ['streak', 'xp', 'level', 'badge'];

    if (complexFeatures.some(f => featureName.toLowerCase().includes(f))) {
      return 70;
    } else if (simpleFeatures.some(f => featureName.toLowerCase().includes(f))) {
      return 20;
    }
    return 50;
  },

  // ─── UX Density Audit ───────────────────────────────────────────────────
  async auditUXDensity(component: string): Promise<UXDensityAudit> {
    // In production, this would analyze the actual component structure
    // For now, provide a framework for the audit

    const elementCount = this.estimateElementCount(component);
    const visualClutter = this.estimateVisualClutter(component);
    const interactionComplexity = this.estimateInteractionComplexity(component);

    // Calculate overall cognitive load
    const cognitiveLoadScore = (elementCount * 0.3 + visualClutter * 0.4 + interactionComplexity * 0.3);
    let cognitiveLoad: 'low' | 'medium' | 'high' | 'severe';

    if (cognitiveLoadScore < 30) {
      cognitiveLoad = 'low';
    } else if (cognitiveLoadScore < 50) {
      cognitiveLoad = 'medium';
    } else if (cognitiveLoadScore < 70) {
      cognitiveLoad = 'high';
    } else {
      cognitiveLoad = 'severe';
    }

    // Generate recommendations
    const recommendations = this.generateDensityRecommendations(component, cognitiveLoad, elementCount, visualClutter, interactionComplexity);

    return {
      component,
      elementCount,
      cognitiveLoad,
      visualClutter,
      interactionComplexity,
      recommendations,
    };
  },

  // ─── Estimate Element Count (Placeholder) ─────────────────────────────
  estimateElementCount(component: string): number {
    // In production, this would count actual DOM elements
    const complexComponents = ['dashboard', 'workspace', 'settings'];
    if (complexComponents.some(c => component.toLowerCase().includes(c))) {
      return 50;
    }
    return 20;
  },

  // ─── Estimate Visual Clutter (Placeholder) ───────────────────────────
  estimateVisualClutter(component: string): number {
    // In production, this would analyze visual density
    const clutteredComponents = ['dashboard', 'leaderboard', 'analytics'];
    if (clutteredComponents.some(c => component.toLowerCase().includes(c))) {
      return 65;
    }
    return 35;
  },

  // ─── Estimate Interaction Complexity (Placeholder) ───────────────────
  estimateInteractionComplexity(component: string): number {
    // In production, this would count interactive elements
    const complexInteractions = ['settings', 'workspace', 'integrations'];
    if (complexInteractions.some(c => component.toLowerCase().includes(c))) {
      return 60;
    }
    return 30;
  },

  // ─── Generate Density Recommendations ─────────────────────────────────
  generateDensityRecommendations(
    component: string,
    cognitiveLoad: 'low' | 'medium' | 'high' | 'severe',
    elementCount: number,
    visualClutter: number,
    interactionComplexity: number
  ): string[] {
    const recommendations: string[] = [];

    if (cognitiveLoad === 'severe') {
      recommendations.push('URGENT: Component has severe cognitive load - immediate simplification required');
      recommendations.push('Consider splitting into multiple smaller components');
      recommendations.push('Implement progressive disclosure for non-critical features');
    } else if (cognitiveLoad === 'high') {
      recommendations.push('Component has high cognitive load - simplification recommended');
      recommendations.push('Reduce visual clutter by removing non-essential elements');
    }

    if (elementCount > 40) {
      recommendations.push('Reduce element count by grouping related items');
      recommendations.push('Use collapsible sections for less important content');
    }

    if (visualClutter > 60) {
      recommendations.push('Reduce visual clutter by increasing whitespace');
      recommendations.push('Simplify color palette and reduce decorative elements');
    }

    if (interactionComplexity > 50) {
      recommendations.push('Simplify interaction patterns');
      recommendations.push('Provide clear visual hierarchy for interactive elements');
    }

    if (recommendations.length === 0) {
      recommendations.push('Component density is acceptable - continue monitoring');
    }

    return recommendations;
  },

  // ─── Generate Simplification Report ───────────────────────────────────
  async generateSimplificationReport(): Promise<SimplificationReport> {
    const features = await FeatureUsageAnalytics.find();

    let featuresToKeep = 0;
    let featuresToHide = 0;
    let featuresToSimplify = 0;
    let featuresToRemove = 0;

    const priorityActions: string[] = [];

    for (const feature of features) {
      const score = await this.calculateFeatureVisibilityScore(feature.featureName);

      switch (score.recommendation) {
        case 'keep':
          featuresToKeep++;
          break;
        case 'hide':
          featuresToHide++;
          priorityActions.push(`Hide "${feature.featureName}" behind progressive disclosure`);
          break;
        case 'simplify':
          featuresToSimplify++;
          priorityActions.push(`Simplify "${feature.featureName}" to reduce cognitive cost`);
          break;
        case 'remove':
          featuresToRemove++;
          priorityActions.push(`Consider removing "${feature.featureName}" - low behavioral value`);
          break;
      }
    }

    // Calculate overall cognitive load
    const overallCognitiveLoad = features.length > 0
      ? features.reduce((sum, f) => sum + this.estimateCognitiveCost(f.featureName), 0) / features.length
      : 0;

    // Sort priority actions by impact
    priorityActions.sort((a, b) => {
      if (a.includes('remove')) return -1;
      if (b.includes('remove')) return 1;
      if (a.includes('simplify')) return -1;
      if (b.includes('simplify')) return 1;
      return 0;
    });

    return {
      totalFeatures: features.length,
      featuresToKeep,
      featuresToHide,
      featuresToSimplify,
      featuresToRemove,
      overallCognitiveLoad,
      priorityActions: priorityActions.slice(0, 10), // Top 10 priority actions
    };
  },

  // ─── Progressive Disclosure Strategy ───────────────────────────────────
  async generateProgressiveDisclosureStrategy(): Promise<{
    alwaysVisible: string[];
    onDemand: string[];
    contextual: string[];
    hidden: string[];
  }> {
    const features = await FeatureUsageAnalytics.find();
    const alwaysVisible: string[] = [];
    const onDemand: string[] = [];
    const contextual: string[] = [];
    const hidden: string[] = [];

    for (const feature of features) {
      const score = await this.calculateFeatureVisibilityScore(feature.featureName);

      if (score.recommendation === 'keep' && score.behavioralValue >= 70) {
        alwaysVisible.push(feature.featureName);
      } else if (score.recommendation === 'keep' || score.recommendation === 'simplify') {
        onDemand.push(feature.featureName);
      } else if (score.recommendation === 'hide') {
        contextual.push(feature.featureName);
      } else {
        hidden.push(feature.featureName);
      }
    }

    return { alwaysVisible, onDemand, contextual, hidden };
  },
};

export default productSimplification;
