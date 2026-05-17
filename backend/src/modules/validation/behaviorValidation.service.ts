// src/modules/validation/behaviorValidation.service.ts — Behavior Validation Service
// Phase-K: Real User Behavior Validation - Behavior validation dashboards, friction analysis, onboarding diagnostics, feature confusion mapping

import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { logger } from '../../shared/logger.js';

export interface BehaviorValidationDashboard {
  totalSessions: number;
  averageSessionDuration: number;
  averageFrictionScore: number;
  highFrictionSessions: number;
  confusionHotspots: Array<{ location: string; count: number; severity: 'low' | 'medium' | 'high' }>;
  featureConfusion: Array<{ feature: string; confusionRate: number; ignoredRate: number }>;
  recommendations: string[];
}

export interface FrictionAnalysis {
  sessionId: string;
  frictionScore: number; // 0-100
  frictionEvents: Array<{ type: string; element: string; severity: 'low' | 'medium' | 'high' }>;
  hesitationPoints: number;
  abandonmentPoints: number;
  recommendations: string[];
}

export const behaviorValidation = {
  // ─── Get Behavior Validation Dashboard ───────────────────────────────────────
  async getBehaviorValidationDashboard(dateRange: { start: Date; end: Date }): Promise<BehaviorValidationDashboard> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalSessions = sessionReplays.length;
    const averageSessionDuration = sessionReplays.length > 0
      ? sessionReplays.reduce((sum, r) => sum + (r.duration || 0), 0) / sessionReplays.length
      : 0;

    // Calculate average friction score
    const frictionScores = sessionReplays.map(r => this.calculateFrictionScore(r));
    const averageFrictionScore = frictionScores.length > 0
      ? frictionScores.reduce((sum, s) => sum + s, 0) / frictionScores.length
      : 0;

    const highFrictionSessions = frictionScores.filter(s => s > 50).length;

    // Identify confusion hotspots
    const confusionHotspots = this.identifyConfusionHotspots(sessionReplays);

    // Identify feature confusion
    const featureConfusion = await this.identifyFeatureConfusion(sessionReplays);

    const recommendations = this.generateDashboardRecommendations(
      averageFrictionScore,
      highFrictionSessions,
      confusionHotspots,
      featureConfusion
    );

    return {
      totalSessions,
      averageSessionDuration,
      averageFrictionScore,
      highFrictionSessions,
      confusionHotspots,
      featureConfusion,
      recommendations,
    };
  },

  // ─── Calculate Friction Score ───────────────────────────────────────────────────
  calculateFrictionScore(replay: any): number {
    let score = 0;

    // Friction events contribute to score
    replay.frictionEvents.forEach((event: any) => {
      if (event.severity === 'high') score += 20;
      else if (event.severity === 'medium') score += 10;
      else score += 5;
    });

    // Hesitation points (type === 'hesitation')
    const hesitationCount = replay.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
    score += hesitationCount * 3;

    // Abandonment events (type === 'abandonment')
    const abandonmentCount = replay.frictionEvents.filter((f: any) => f.type === 'abandonment').length;
    score += abandonmentCount * 15;

    // Normalize to 0-100
    return Math.min(100, score);
  },

  // ─── Identify Confusion Hotspots ───────────────────────────────────────────────
  identifyConfusionHotspots(sessionReplays: any[]): Array<{ location: string; count: number; severity: 'low' | 'medium' | 'high' }> {
    const locationCounts = new Map<string, number>();

    sessionReplays.forEach(replay => {
      replay.frictionEvents.forEach((event: any) => {
        if (event.type === 'confusion') {
          const location = event.element || 'unknown';
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        }
      });
    });

    return Array.from(locationCounts.entries())
      .map(([location, count]) => {
        let severity: 'low' | 'medium' | 'high';
        if (count > 10) severity = 'high';
        else if (count > 5) severity = 'medium';
        else severity = 'low';

        return { location, count, severity };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  // ─── Identify Feature Confusion ────────────────────────────────────────────────
  async identifyFeatureConfusion(sessionReplays: any[]): Promise<Array<{ feature: string; confusionRate: number; ignoredRate: number }>> {
    const featureStats = new Map<string, { interactions: number; confusion: number; ignored: number }>();

    sessionReplays.forEach(replay => {
      replay.interactions.forEach((interaction: any) => {
        const feature = interaction.element.split('/')[0] || 'unknown';
        const stats = featureStats.get(feature) || { interactions: 0, confusion: 0, ignored: 0 };
        stats.interactions++;

        // Check for confusion in friction events
        const hasConfusion = replay.frictionEvents.some((f: any) => 
          f.type === 'confusion' && f.element.includes(feature)
        );
        if (hasConfusion) stats.confusion++;

        // Check for abandonment (ignored)
        const hasAbandonment = replay.frictionEvents.some((f: any) => 
          f.type === 'abandonment' && f.element.includes(feature)
        );
        if (hasAbandonment) stats.ignored++;

        featureStats.set(feature, stats);
      });
    });

    return Array.from(featureStats.entries())
      .map(([feature, stats]) => ({
        feature,
        confusionRate: stats.interactions > 0 ? (stats.confusion / stats.interactions) * 100 : 0,
        ignoredRate: stats.interactions > 0 ? (stats.ignored / stats.interactions) * 100 : 0,
      }))
      .sort((a, b) => b.confusionRate - a.confusionRate)
      .slice(0, 10);
  },

  // ─── Generate Dashboard Recommendations ────────────────────────────────────────
  generateDashboardRecommendations(
    averageFrictionScore: number,
    highFrictionSessions: number,
    confusionHotspots: Array<{ location: string; count: number; severity: 'low' | 'medium' | 'high' }>,
    featureConfusion: Array<{ feature: string; confusionRate: number; ignoredRate: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (averageFrictionScore > 50) {
      recommendations.push('High average friction - comprehensive UX review needed');
    }

    if (highFrictionSessions / 10 > 0.3) {
      recommendations.push('30%+ sessions have high friction - investigate common patterns');
    }

    confusionHotspots.slice(0, 3).forEach(({ location, severity }) => {
      if (severity === 'high') {
        recommendations.push(`Address high-severity confusion at ${location}`);
      }
    });

    featureConfusion.slice(0, 3).forEach(({ feature, confusionRate, ignoredRate }) => {
      if (confusionRate > 30) {
        recommendations.push(`Simplify ${feature} - ${confusionRate.toFixed(1)}% confusion rate`);
      }
      if (ignoredRate > 40) {
        recommendations.push(`Review ${feature} - ${ignoredRate.toFixed(1)}% ignored rate`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Behavior validation is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Analyze Session Friction ─────────────────────────────────────────────────
  async analyzeSessionFriction(sessionId: string): Promise<FrictionAnalysis> {
    const replay = await SessionReplay.findOne({ sessionId });

    if (!replay) {
      throw new Error('Session replay not found');
    }

    const frictionScore = this.calculateFrictionScore(replay);

    const frictionEvents = replay.frictionEvents.map((event: any) => ({
      type: event.type,
      element: event.element,
      severity: event.severity,
    }));

    const hesitationPoints = replay.frictionEvents.filter((f: any) => f.type === 'hesitation').length;
    const abandonmentPoints = replay.frictionEvents.filter((f: any) => f.type === 'abandonment').length;

    const recommendations = this.generateFrictionRecommendations(frictionScore, frictionEvents, hesitationPoints, abandonmentPoints);

    return {
      sessionId,
      frictionScore,
      frictionEvents,
      hesitationPoints,
      abandonmentPoints,
      recommendations,
    };
  },

  // ─── Generate Friction Recommendations ────────────────────────────────────────
  generateFrictionRecommendations(
    frictionScore: number,
    frictionEvents: any[],
    hesitationPoints: number,
    abandonmentPoints: number
  ): string[] {
    const recommendations: string[] = [];

    if (frictionScore > 70) {
      recommendations.push('CRITICAL: Very high friction - immediate UX intervention needed');
    } else if (frictionScore > 50) {
      recommendations.push('High friction - review and simplify interaction flow');
    }

    if (hesitationPoints > 5) {
      recommendations.push('Frequent hesitation - reduce cognitive load and improve clarity');
    }

    if (abandonmentPoints > 2) {
      recommendations.push('Multiple abandonment points - investigate drop-off reasons');
    }

    const highSeverityEvents = frictionEvents.filter(f => f.severity === 'high').length;
    if (highSeverityEvents > 3) {
      recommendations.push('Multiple high-severity friction events - prioritize fixes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Session friction is acceptable');
    }

    return recommendations;
  },

  // ─── Get Onboarding Diagnostics Summary ───────────────────────────────────────
  async getOnboardingDiagnosticsSummary(dateRange: { start: Date; end: Date }): Promise<{
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    averageTimeToComplete: number;
    topDropOffPoints: Array<{ step: string; count: number; percentage: number }>;
    recommendations: string[];
  }> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalStarted = onboardingData.length;
    const totalCompleted = onboardingData.filter(o => o.completedAt).length;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    const completedOnboarding = onboardingData.filter(o => o.completedAt && o.totalDuration);
    const averageTimeToComplete = completedOnboarding.length > 0
      ? completedOnboarding.reduce((sum, o) => sum + (o.totalDuration || 0), 0) / completedOnboarding.length
      : 0;

    // Identify top drop-off points
    const dropOffCounts = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.dropOffStep) {
        dropOffCounts.set(o.dropOffStep, (dropOffCounts.get(o.dropOffStep) || 0) + 1);
      }
    });

    const topDropOffPoints = Array.from(dropOffCounts.entries())
      .map(([step, count]) => ({
        step,
        count,
        percentage: totalStarted > 0 ? (count / totalStarted) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    const recommendations = this.generateOnboardingRecommendations(completionRate, topDropOffPoints);

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      averageTimeToComplete,
      topDropOffPoints,
      recommendations,
    };
  },

  // ─── Generate Onboarding Recommendations ────────────────────────────────────────
  generateOnboardingRecommendations(
    completionRate: number,
    topDropOffPoints: Array<{ step: string; count: number; percentage: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (completionRate < 50) {
      recommendations.push('CRITICAL: Onboarding completion rate below 50% - major redesign needed');
    } else if (completionRate < 70) {
      recommendations.push('Onboarding completion rate concerning - review drop-off points');
    }

    if (topDropOffPoints.length > 0 && topDropOffPoints[0].percentage > 30) {
      recommendations.push(`High drop-off at "${topDropOffPoints[0].step}" - simplify or remove this step`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Onboarding is healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default behaviorValidation;
