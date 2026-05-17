// src/modules/simplification/cognitiveLoadAudit.service.ts — Cognitive Load Audit Service
// Phase-J: Product Simplification Engine - Cognitive-load auditing and UI density analysis

import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface CognitiveLoadMetrics {
  pagePath: string;
  averageElements: number;
  averageInteractions: number;
  averageTimeOnPage: number;
  hesitationRate: number;
  confusionRate: number;
  cognitiveLoadScore: number; // 0-100, higher = more cognitive load
  recommendation: string;
}

export interface UIDensityAnalysis {
  totalPages: number;
  highDensityPages: string[];
  mediumDensityPages: string[];
  lowDensityPages: string[];
  averageDensityScore: number;
  densityByPage: Array<{
    pagePath: string;
    elementCount: number;
    densityScore: number;
    recommendation: string;
  }>;
  recommendations: string[];
}

export const cognitiveLoadAudit = {
  // ─── Calculate Cognitive Load for Page ─────────────────────────────────────
  async calculatePageCognitiveLoad(pagePath: string, dateRange: { start: Date; end: Date }): Promise<CognitiveLoadMetrics> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
      'pages.path': pagePath,
    });

    if (sessionReplays.length === 0) {
      return {
        pagePath,
        averageElements: 0,
        averageInteractions: 0,
        averageTimeOnPage: 0,
        hesitationRate: 0,
        confusionRate: 0,
        cognitiveLoadScore: 0,
        recommendation: 'No data available for this page',
      };
    }

    // Calculate metrics
    let totalElements = 0;
    let totalInteractions = 0;
    let totalTimeOnPage = 0;
    let hesitationCount = 0;
    let confusionCount = 0;

    sessionReplays.forEach(replay => {
      const page = replay.pages.find(p => p.path === pagePath);
      if (page) {
        // Estimate elements from interactions (simplified)
        totalElements += replay.interactions.filter(i => i.element.includes(pagePath)).length;
        totalInteractions += replay.interactions.filter(i => i.element.includes(pagePath)).length;
        totalTimeOnPage += page.duration || 0;
      }

      // Count hesitation and confusion events on this page
      replay.frictionEvents.forEach(event => {
        if (event.element.includes(pagePath)) {
          if (event.type === 'hesitation') hesitationCount++;
          if (event.type === 'confusion') confusionCount++;
        }
      });
    });

    const averageElements = sessionReplays.length > 0 ? totalElements / sessionReplays.length : 0;
    const averageInteractions = sessionReplays.length > 0 ? totalInteractions / sessionReplays.length : 0;
    const averageTimeOnPage = sessionReplays.length > 0 ? totalTimeOnPage / sessionReplays.length : 0;
    const hesitationRate = totalInteractions > 0 ? (hesitationCount / totalInteractions) * 100 : 0;
    const confusionRate = totalInteractions > 0 ? (confusionCount / totalInteractions) * 100 : 0;

    // Calculate cognitive load score
    const cognitiveLoadScore = this.calculateCognitiveLoadScore(
      averageElements,
      averageInteractions,
      averageTimeOnPage,
      hesitationRate,
      confusionRate
    );

    // Generate recommendation
    const recommendation = this.generateCognitiveLoadRecommendation(cognitiveLoadScore, hesitationRate, confusionRate);

    return {
      pagePath,
      averageElements,
      averageInteractions,
      averageTimeOnPage,
      hesitationRate,
      confusionRate,
      cognitiveLoadScore,
      recommendation,
    };
  },

  // ─── Calculate Cognitive Load Score ─────────────────────────────────────
  calculateCognitiveLoadScore(
    elements: number,
    interactions: number,
    timeOnPage: number,
    hesitationRate: number,
    confusionRate: number
  ): number {
    let score = 0;

    // More elements = higher cognitive load
    score += Math.min(30, elements * 0.5);

    // More interactions = higher cognitive load
    score += Math.min(20, interactions * 0.3);

    // Longer time on page can indicate difficulty
    if (timeOnPage > 30000) score += 15;
    else if (timeOnPage > 15000) score += 10;
    else if (timeOnPage > 10000) score += 5;

    // Hesitation and confusion directly increase cognitive load
    score += hesitationRate * 0.5;
    score += confusionRate * 0.7;

    return Math.min(100, score);
  },

  // ─── Generate Cognitive Load Recommendation ───────────────────────────────
  generateCognitiveLoadRecommendation(
    cognitiveLoadScore: number,
    hesitationRate: number,
    confusionRate: number
  ): string {
    if (cognitiveLoadScore > 70) {
      return 'CRITICAL: Very high cognitive load - simplify page layout, reduce elements, improve clarity';
    }
    if (cognitiveLoadScore > 50) {
      return 'High cognitive load - consider progressive disclosure or simplifying information hierarchy';
    }
    if (hesitationRate > 20 || confusionRate > 15) {
      return 'Moderate cognitive load with user friction - improve UX clarity and reduce ambiguity';
    }
    if (cognitiveLoadScore > 30) {
      return 'Moderate cognitive load - monitor user behavior for optimization opportunities';
    }
    return 'Low cognitive load - page is well-designed';
  },

  // ─── Conduct UI Density Analysis ───────────────────────────────────────────
  async conductUIDensityAnalysis(dateRange: { start: Date; end: Date }): Promise<UIDensityAnalysis> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Get all unique pages
    const pageMetrics = new Map<string, {
      elementCount: number;
      interactionCount: number;
      timeOnPage: number;
      sessionCount: number;
    }>();

    sessionReplays.forEach(replay => {
      replay.pages.forEach(page => {
        const existing = pageMetrics.get(page.path) || {
          elementCount: 0,
          interactionCount: 0,
          timeOnPage: 0,
          sessionCount: 0,
        };

        // Estimate element count from interactions
        const pageInteractions = replay.interactions.filter(i => i.element.includes(page.path));
        existing.elementCount += pageInteractions.length;
        existing.interactionCount += pageInteractions.length;
        existing.timeOnPage += page.duration || 0;
        existing.sessionCount++;

        pageMetrics.set(page.path, existing);
      });
    });

    // Calculate density scores for each page
    const densityByPage: Array<{
      pagePath: string;
      elementCount: number;
      densityScore: number;
      recommendation: string;
    }> = [];

    const highDensityPages: string[] = [];
    const mediumDensityPages: string[] = [];
    const lowDensityPages: string[] = [];

    let totalDensityScore = 0;

    for (const [pagePath, metrics] of pageMetrics) {
      const averageElements = metrics.sessionCount > 0 ? metrics.elementCount / metrics.sessionCount : 0;
      const averageTime = metrics.sessionCount > 0 ? metrics.timeOnPage / metrics.sessionCount : 0;

      // Density score based on elements per session and time spent
      const densityScore = Math.min(100, averageElements * 2 + (averageTime / 10000) * 10);
      totalDensityScore += densityScore;

      const recommendation = this.generateDensityRecommendation(densityScore, averageElements);

      densityByPage.push({
        pagePath,
        elementCount: averageElements,
        densityScore,
        recommendation,
      });

      if (densityScore > 70) {
        highDensityPages.push(pagePath);
      } else if (densityScore > 40) {
        mediumDensityPages.push(pagePath);
      } else {
        lowDensityPages.push(pagePath);
      }
    }

    const averageDensityScore = densityByPage.length > 0 ? totalDensityScore / densityByPage.length : 0;

    // Generate overall recommendations
    const recommendations = this.generateDensityRecommendations(
      averageDensityScore,
      highDensityPages.length,
      mediumDensityPages.length
    );

    return {
      totalPages: densityByPage.length,
      highDensityPages,
      mediumDensityPages,
      lowDensityPages,
      averageDensityScore,
      densityByPage: densityByPage.sort((a, b) => b.densityScore - a.densityScore),
      recommendations,
    };
  },

  // ─── Generate Density Recommendation ─────────────────────────────────────
  generateDensityRecommendation(densityScore: number, elementCount: number): string {
    if (densityScore > 70) {
      return 'Very high density - significantly reduce UI elements, use progressive disclosure';
    }
    if (densityScore > 50) {
      return 'High density - consider simplifying layout and reducing visual clutter';
    }
    if (densityScore > 30) {
      return 'Moderate density - monitor for optimization opportunities';
    }
    return 'Low density - well-balanced UI';
  },

  // ─── Generate Density Recommendations ─────────────────────────────────────
  generateDensityRecommendations(
    averageDensityScore: number,
    highDensityCount: number,
    mediumDensityCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageDensityScore > 60) {
      recommendations.push('Overall UI density is high - consider product-wide simplification initiative');
    }

    if (highDensityCount > 0) {
      recommendations.push(`${highDensityCount} page(s) have very high density - prioritize for simplification`);
    }

    if (mediumDensityCount > 3) {
      recommendations.push(`${mediumDensityCount} page(s) have moderate density - review for optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('UI density is within acceptable ranges - continue monitoring');
    }

    return recommendations;
  },

  // ─── Identify Cognitive Overload Patterns ─────────────────────────────────
  async identifyCognitiveOverloadPatterns(dateRange: { start: Date; end: Date }): Promise<{
    overloadedPages: string[];
    commonOverloadTriggers: string[];
    userSegmentsAffected: string[];
    recommendations: string[];
  }> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const pageLoadScores = new Map<string, number[]>();

    sessionReplays.forEach(replay => {
      replay.pages.forEach(page => {
        const pageFriction = replay.frictionEvents.filter(f => f.element.includes(page.path));
        const loadScore = pageFriction.length * 10;

        if (!pageLoadScores.has(page.path)) {
          pageLoadScores.set(page.path, []);
        }
        pageLoadScores.get(page.path)!.push(loadScore);
      });
    });

    // Identify overloaded pages (high average load score)
    const overloadedPages: string[] = [];
    for (const [pagePath, scores] of pageLoadScores) {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      if (avgScore > 50) {
        overloadedPages.push(pagePath);
      }
    }

    // Identify common overload triggers
    const triggerCounts = new Map<string, number>();
    sessionReplays.forEach(replay => {
      replay.frictionEvents.forEach(event => {
        if (event.severity === 'high') {
          const trigger = event.context?.trigger as string || 'unknown';
          triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
        }
      });
    });

    const commonOverloadTriggers = Array.from(triggerCounts.entries())
      .map(([trigger, count]) => trigger)
      .sort((a, b) => (triggerCounts.get(b) || 0) - (triggerCounts.get(a) || 0))
      .slice(0, 5);

    // Generate recommendations
    const recommendations = [
      ...overloadedPages.map(p => `Simplify ${p} - high cognitive load detected`),
      ...commonOverloadTriggers.map(t => `Address ${t} - common overload trigger`),
    ];

    return {
      overloadedPages,
      commonOverloadTriggers,
      userSegmentsAffected: [], // Would analyze by user segments
      recommendations,
    };
  },
};

export default cognitiveLoadAudit;
