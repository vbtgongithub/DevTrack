// src/modules/analytics/productIntelligenceDashboard.service.ts — Product Intelligence Dashboard (Internal)
// Phase-I: Product Intelligence Dashboard - Internal tools for behavioral diagnostics and UX intelligence

import mongoose from 'mongoose';
import { BehavioralTelemetry } from '../../db/models/behavioralTelemetry.model.js';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { FeatureUsageAnalytics } from '../../db/models/featureUsageAnalytics.model.js';
import { UserAnalytics } from '../../db/models/userAnalytics.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface DashboardMetrics {
  onboardingHealth: {
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    averageTimeToComplete: number;
    topDropOffStep: string;
  };
  workspaceEngagement: {
    averageSessionDuration: number;
    averageProblemsPerSession: number;
    focusInterruptionRate: number;
    keyboardWorkflowAdoption: number;
  };
  featureAdoption: {
    totalFeatures: number;
    averageAdoptionRate: number;
    lowAdoptionFeatures: string[];
    highAdoptionFeatures: string[];
  };
  retentionQuality: {
    day7Retention: number;
    day30Retention: number;
    averageStreakLength: number;
    comebackSuccessRate: number;
  };
  notificationEffectiveness: {
    averageClickRate: number;
    averageDismissalRate: number;
    fatigueIndicators: string[];
  };
  frustrationSignals: {
    totalFrustrationEvents: number;
    topFrustrationSources: Array<{ source: string; count: number }>;
    highFrictionAreas: string[];
  };
  confusionHotspots: {
    totalConfusionEvents: number;
    topConfusionAreas: Array<{ area: string; count: number }>;
    recommendedImprovements: string[];
  };
}

export interface BehavioralDiagnostics {
  overallHealthScore: number; // 0-100
  healthDimensions: {
    onboarding: number;
    engagement: number;
    retention: number;
    satisfaction: number;
    trust: number;
  };
  criticalIssues: string[];
  warnings: string[];
  positiveSignals: string[];
  actionableInsights: Array<{
    category: string;
    insight: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
  }>;
}

export const productIntelligenceDashboard = {
  // ─── Get Dashboard Metrics ────────────────────────────────────────────
  async getDashboardMetrics(dateRange: { start: Date; end: Date }): Promise<DashboardMetrics> {
    // Onboarding Health
    const onboardingHealth = await this.getOnboardingHealth(dateRange);

    // Workspace Engagement
    const workspaceEngagement = await this.getWorkspaceEngagement(dateRange);

    // Feature Adoption
    const featureAdoption = await this.getFeatureAdoption();

    // Retention Quality
    const retentionQuality = await this.getRetentionQuality(dateRange);

    // Notification Effectiveness
    const notificationEffectiveness = await this.getNotificationEffectiveness(dateRange);

    // Frustration Signals
    const frustrationSignals = await this.getFrustrationSignals(dateRange);

    // Confusion Hotspots
    const confusionHotspots = await this.getConfusionHotspots(dateRange);

    return {
      onboardingHealth,
      workspaceEngagement,
      featureAdoption,
      retentionQuality,
      notificationEffectiveness,
      frustrationSignals,
      confusionHotspots,
    };
  },

  // ─── Get Onboarding Health ────────────────────────────────────────────
  async getOnboardingHealth(dateRange: { start: Date; end: Date }): Promise<{
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    averageTimeToComplete: number;
    topDropOffStep: string;
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

    // Find top drop-off step
    const stepCounts = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.dropOffStep) {
        stepCounts.set(o.dropOffStep, (stepCounts.get(o.dropOffStep) || 0) + 1);
      }
    });

    const topDropOffStep = Array.from(stepCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      averageTimeToComplete,
      topDropOffStep,
    };
  },

  // ─── Get Workspace Engagement ────────────────────────────────────────
  async getWorkspaceEngagement(dateRange: { start: Date; end: Date }): Promise<{
    averageSessionDuration: number;
    averageProblemsPerSession: number;
    focusInterruptionRate: number;
    keyboardWorkflowAdoption: number;
  }> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (!telemetry.length) {
      return {
        averageSessionDuration: 0,
        averageProblemsPerSession: 0,
        focusInterruptionRate: 0,
        keyboardWorkflowAdoption: 0,
      };
    }

    const sessionDurations = telemetry.map(t => t.sessionDuration || 0).filter(d => d > 0);
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
      : 0;

    const totalProblems = telemetry.reduce((sum, t) => sum + t.workspaceEngagement.problemsSolved, 0);
    const averageProblemsPerSession = telemetry.length > 0 ? totalProblems / telemetry.length : 0;

    const totalInterruptions = telemetry.reduce((sum, t) => sum + t.workspaceEngagement.focusInterruptions, 0);
    const focusInterruptionRate = telemetry.length > 0 ? totalInterruptions / telemetry.length : 0;

    const totalKeyboardUsage = telemetry.reduce((sum, t) => sum + t.workspaceEngagement.keyboardWorkflowUsage, 0);
    const keyboardWorkflowAdoption = telemetry.length > 0 ? (totalKeyboardUsage / telemetry.length) * 100 : 0;

    return {
      averageSessionDuration,
      averageProblemsPerSession,
      focusInterruptionRate,
      keyboardWorkflowAdoption,
    };
  },

  // ─── Get Feature Adoption ─────────────────────────────────────────────
  async getFeatureAdoption(): Promise<{
    totalFeatures: number;
    averageAdoptionRate: number;
    lowAdoptionFeatures: string[];
    highAdoptionFeatures: string[];
  }> {
    const features = await FeatureUsageAnalytics.find();

    const totalFeatures = features.length;
    const averageAdoptionRate = features.length > 0
      ? features.reduce((sum, f) => sum + f.discoveryRate, 0) / features.length
      : 0;

    const lowAdoptionFeatures = features
      .filter(f => f.discoveryRate < 30)
      .map(f => f.featureName)
      .slice(0, 5);

    const highAdoptionFeatures = features
      .filter(f => f.discoveryRate > 70)
      .map(f => f.featureName)
      .slice(0, 5);

    return {
      totalFeatures,
      averageAdoptionRate,
      lowAdoptionFeatures,
      highAdoptionFeatures,
    };
  },

  // ─── Get Retention Quality ───────────────────────────────────────────
  async getRetentionQuality(dateRange: { start: Date; end: Date }): Promise<{
    day7Retention: number;
    day30Retention: number;
    averageStreakLength: number;
    comebackSuccessRate: number;
  }> {
    const userAnalytics = await UserAnalytics.find({
      lastActiveDate: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (!userAnalytics.length) {
      return {
        day7Retention: 0,
        day30Retention: 0,
        averageStreakLength: 0,
        comebackSuccessRate: 0,
      };
    }

    // Simplified retention calculation
    const day7Retention = 65; // Placeholder - would calculate from actual data
    const day30Retention = 45; // Placeholder

    const averageStreakLength = userAnalytics.length > 0
      ? userAnalytics.reduce((sum, u) => sum + (u.currentStreak || 0), 0) / userAnalytics.length
      : 0;

    const comebackSuccessRate = 70; // Placeholder

    return {
      day7Retention,
      day30Retention,
      averageStreakLength,
      comebackSuccessRate,
    };
  },

  // ─── Get Notification Effectiveness ──────────────────────────────────
  async getNotificationEffectiveness(dateRange: { start: Date; end: Date }): Promise<{
    averageClickRate: number;
    averageDismissalRate: number;
    fatigueIndicators: string[];
  }> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    if (!telemetry.length) {
      return {
        averageClickRate: 0,
        averageDismissalRate: 0,
        fatigueIndicators: [],
      };
    }

    let totalInteractions = 0;
    let totalClicks = 0;
    let totalDismissals = 0;

    telemetry.forEach(t => {
      t.notificationInteractions.forEach((n: any) => {
        totalInteractions++;
        if (n.action === 'clicked') totalClicks++;
        if (n.action === 'dismissed') totalDismissals++;
      });
    });

    const averageClickRate = totalInteractions > 0 ? (totalClicks / totalInteractions) * 100 : 0;
    const averageDismissalRate = totalInteractions > 0 ? (totalDismissals / totalInteractions) * 100 : 0;

    const fatigueIndicators: string[] = [];
    if (averageDismissalRate > 50) fatigueIndicators.push('High dismissal rate indicates fatigue');
    if (averageClickRate < 30) fatigueIndicators.push('Low click rate indicates low relevance');

    return {
      averageClickRate,
      averageDismissalRate,
      fatigueIndicators,
    };
  },

  // ─── Get Frustration Signals ─────────────────────────────────────────
  async getFrustrationSignals(dateRange: { start: Date; end: Date }): Promise<{
    totalFrustrationEvents: number;
    topFrustrationSources: Array<{ source: string; count: number }>;
    highFrictionAreas: string[];
  }> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    let totalFrustrationEvents = 0;
    const sourceCounts = new Map<string, number>();

    telemetry.forEach(t => {
      t.emotionalSignals.forEach((s: any) => {
        if (s.signal === 'frustration') {
          totalFrustrationEvents++;
          const source = s.context || 'unknown';
          sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
        }
      });
    });

    const topFrustrationSources = Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const highFrictionAreas = telemetry
      .filter(t => t.frictionEvents.filter((f: any) => f.severity === 'high').length > 0)
      .map(t => t.frictionEvents.filter((f: any) => f.severity === 'high').map((f: any) => f.element))
      .flat()
      .slice(0, 5);

    return {
      totalFrustrationEvents,
      topFrustrationSources,
      highFrictionAreas,
    };
  },

  // ─── Get Confusion Hotspots ───────────────────────────────────────────
  async getConfusionHotspots(dateRange: { start: Date; end: Date }): Promise<{
    totalConfusionEvents: number;
    topConfusionAreas: Array<{ area: string; count: number }>;
    recommendedImprovements: string[];
  }> {
    const telemetry = await BehavioralTelemetry.find({
      sessionStart: { $gte: dateRange.start, $lte: dateRange.end },
    });

    let totalConfusionEvents = 0;
    const areaCounts = new Map<string, number>();

    telemetry.forEach(t => {
      t.emotionalSignals.forEach((s: any) => {
        if (s.signal === 'confusion') {
          totalConfusionEvents++;
          const area = s.context || 'unknown';
          areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
        }
      });
    });

    const topConfusionAreas = Array.from(areaCounts.entries())
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recommendedImprovements: string[] = [];
    if (totalConfusionEvents > 50) {
      recommendedImprovements.push('High confusion rate - review UX clarity');
    }
    topConfusionAreas.slice(0, 3).forEach(({ area }) => {
      recommendedImprovements.push(`Improve clarity in "${area}" area`);
    });

    return {
      totalConfusionEvents,
      topConfusionAreas,
      recommendedImprovements,
    };
  },

  // ─── Conduct Behavioral Diagnostics ───────────────────────────────────
  async conductBehavioralDiagnostics(dateRange: { start: Date; end: Date }): Promise<BehavioralDiagnostics> {
    const metrics = await this.getDashboardMetrics(dateRange);

    // Calculate health dimensions
    const onboarding = metrics.onboardingHealth.completionRate;
    const engagement = Math.min(100, (metrics.workspaceEngagement.averageSessionDuration / 3600000) * 100); // Normalize to 1 hour
    const retention = (metrics.retentionQuality.day7Retention + metrics.retentionQuality.day30Retention) / 2;
    const satisfaction = Math.max(0, 100 - (metrics.frustrationSignals.totalFrustrationEvents / 10));
    const trust = Math.max(0, 100 - metrics.notificationEffectiveness.averageDismissalRate);

    const overallHealthScore = (onboarding * 0.2 + engagement * 0.25 + retention * 0.25 + satisfaction * 0.15 + trust * 0.15);

    const healthDimensions = { onboarding, engagement, retention, satisfaction, trust };

    // Identify issues and signals
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const positiveSignals: string[] = [];

    if (metrics.onboardingHealth.completionRate < 40) {
      criticalIssues.push('Critical onboarding completion rate');
    }
    if (metrics.retentionQuality.day7Retention < 40) {
      criticalIssues.push('Critical 7-day retention rate');
    }
    if (metrics.frustrationSignals.totalFrustrationEvents > 100) {
      criticalIssues.push('High frustration event count');
    }

    if (metrics.workspaceEngagement.focusInterruptionRate > 5) {
      warnings.push('High focus interruption rate');
    }
    if (metrics.notificationEffectiveness.averageClickRate < 30) {
      warnings.push('Low notification click rate');
    }

    if (metrics.workspaceEngagement.keyboardWorkflowAdoption > 50) {
      positiveSignals.push('High keyboard workflow adoption');
    }
    if (metrics.retentionQuality.averageStreakLength > 7) {
      positiveSignals.push('Strong average streak length');
    }

    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(metrics, healthDimensions);

    return {
      overallHealthScore,
      healthDimensions,
      criticalIssues,
      warnings,
      positiveSignals,
      actionableInsights,
    };
  },

  // ─── Generate Actionable Insights ─────────────────────────────────────
  generateActionableInsights(
    metrics: DashboardMetrics,
    healthDimensions: { onboarding: number; engagement: number; retention: number; satisfaction: number; trust: number }
  ): Array<{
    category: string;
    insight: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
  }> {
    const insights: Array<{
      category: string;
      insight: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      recommendedAction: string;
    }> = [];

    if (healthDimensions.onboarding < 50) {
      insights.push({
        category: 'Onboarding',
        insight: 'Onboarding completion rate is below target',
        priority: 'critical',
        recommendedAction: 'Review onboarding funnel and simplify drop-off steps',
      });
    }

    if (healthDimensions.retention < 50) {
      insights.push({
        category: 'Retention',
        insight: 'Retention rates are concerning',
        priority: 'critical',
        recommendedAction: 'Implement early engagement strategies and improve value demonstration',
      });
    }

    if (metrics.workspaceEngagement.focusInterruptionRate > 3) {
      insights.push({
        category: 'Engagement',
        insight: 'Users are experiencing frequent interruptions',
        priority: 'high',
        recommendedAction: 'Reduce notification frequency and improve focus preservation',
      });
    }

    if (metrics.featureAdoption.lowAdoptionFeatures.length > 3) {
      insights.push({
        category: 'Features',
        insight: 'Multiple features have low adoption',
        priority: 'medium',
        recommendedAction: 'Consider hiding or removing low-adoption features to reduce complexity',
      });
    }

    if (healthDimensions.satisfaction < 60) {
      insights.push({
        category: 'Satisfaction',
        insight: 'User satisfaction is below target',
        priority: 'high',
        recommendedAction: 'Investigate frustration sources and improve UX clarity',
      });
    }

    if (insights.length === 0) {
      insights.push({
        category: 'Overall',
        insight: 'Product health is within acceptable ranges',
        priority: 'low',
        recommendedAction: 'Continue monitoring and iterate on minor improvements',
      });
    }

    return insights;
  },
};

export default productIntelligenceDashboard;
