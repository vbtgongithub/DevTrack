// src/modules/onboarding/onboardingOptimization.service.ts — Onboarding Optimization Service
// Phase-J: Onboarding + Activation Optimization - Onboarding completion and drop-off tracking

import mongoose from 'mongoose';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface OnboardingCompletionMetrics {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropOffByStep: Array<{ step: string; count: number; percentage: number }>;
  completionByVariant: Array<{ variant: string; count: number; completionRate: number }>;
  recommendations: string[];
}

export interface ActivationMetrics {
  firstSessionActivation: number;
  firstWeekRetention: number;
  firstChallengeCompletion: number;
  averageTimeToFirstAction: number;
  activationByCohort: Array<{ cohortId: string; activationRate: number }>;
  recommendations: string[];
}

export const onboardingOptimization = {
  // ─── Get Onboarding Completion Metrics ───────────────────────────────────────
  async getOnboardingCompletionMetrics(dateRange: { start: Date; end: Date }): Promise<OnboardingCompletionMetrics> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalStarted = onboardingData.length;
    const totalCompleted = onboardingData.filter(o => o.completedAt).length;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Calculate average time to complete
    const completedOnboarding = onboardingData.filter(o => o.completedAt && o.totalDuration);
    const averageTimeToComplete = completedOnboarding.length > 0
      ? completedOnboarding.reduce((sum, o) => sum + (o.totalDuration || 0), 0) / completedOnboarding.length
      : 0;

    // Analyze drop-off by step
    const dropOffCounts = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.dropOffStep) {
        dropOffCounts.set(o.dropOffStep, (dropOffCounts.get(o.dropOffStep) || 0) + 1);
      }
    });

    const dropOffByStep = Array.from(dropOffCounts.entries())
      .map(([step, count]) => ({
        step,
        count,
        percentage: totalStarted > 0 ? (count / totalStarted) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Analyze completion by cohort
    const cohortStats = new Map<string, { started: number; completed: number }>();
    onboardingData.forEach(o => {
      const cohort = o.cohort?.acquisitionChannel || 'default';
      const stats = cohortStats.get(cohort) || { started: 0, completed: 0 };
      stats.started++;
      if (o.completedAt) stats.completed++;
      cohortStats.set(cohort, stats);
    });

    const completionByVariant = Array.from(cohortStats.entries())
      .map(([cohort, stats]) => ({
        variant: cohort,
        count: stats.completed,
        completionRate: stats.started > 0 ? (stats.completed / stats.started) * 100 : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);

    // Generate recommendations
    const recommendations = this.generateCompletionRecommendations(
      completionRate,
      dropOffByStep,
      completionByVariant
    );

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      averageTimeToComplete,
      dropOffByStep,
      completionByVariant,
      recommendations,
    };
  },

  // ─── Generate Completion Recommendations ─────────────────────────────────────
  generateCompletionRecommendations(
    completionRate: number,
    dropOffByStep: Array<{ step: string; count: number; percentage: number }>,
    completionByVariant: Array<{ variant: string; count: number; completionRate: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (completionRate < 50) {
      recommendations.push('CRITICAL: Onboarding completion rate is below 50% - major redesign needed');
    } else if (completionRate < 70) {
      recommendations.push('Onboarding completion rate is concerning - review drop-off points');
    }

    if (dropOffByStep.length > 0 && dropOffByStep[0].percentage > 30) {
      recommendations.push(`High drop-off at "${dropOffByStep[0].step}" - simplify or remove this step`);
    }

    if (completionByVariant.length > 1) {
      const bestVariant = completionByVariant[0];
      const worstVariant = completionByVariant[completionByVariant.length - 1];
      if (bestVariant.completionRate - worstVariant.completionRate > 20) {
        recommendations.push(`Variant "${bestVariant.variant}" performs significantly better - consider making it default`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Onboarding completion is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Get Activation Metrics ─────────────────────────────────────────────────
  async getActivationMetrics(dateRange: { start: Date; end: Date }): Promise<ActivationMetrics> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Calculate first session activation (users who took at least one action)
    const firstSessionActivation = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstAction > 0).length;
    const firstSessionActivationRate = onboardingData.length > 0
      ? (firstSessionActivation / onboardingData.length) * 100
      : 0;

    // Calculate first week retention (users who returned within 7 days)
    const firstWeekRetention = onboardingData.filter(o => o.earlyEngagement?.returnWithin7d).length;
    const firstWeekRetentionRate = onboardingData.length > 0
      ? (firstWeekRetention / onboardingData.length) * 100
      : 0;

    // Calculate first challenge completion (problems solved in first hour)
    const firstChallengeCompletion = onboardingData.filter(o => o.earlyEngagement?.problemsSolvedInFirstHour > 0).length;
    const firstChallengeCompletionRate = onboardingData.length > 0
      ? (firstChallengeCompletion / onboardingData.length) * 100
      : 0;

    // Calculate average time to first action
    const withFirstAction = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstAction > 0);
    const averageTimeToFirstAction = withFirstAction.length > 0
      ? withFirstAction.reduce((sum, o) => sum + (o.firstSessionMetrics?.timeToFirstAction || 0), 0) / withFirstAction.length
      : 0;

    // Analyze activation by cohort
    const cohortStats = new Map<string, { total: number; activated: number }>();
    onboardingData.forEach(o => {
      const cohort = o.cohort?.acquisitionChannel || 'default';
      const stats = cohortStats.get(cohort) || { total: 0, activated: 0 };
      stats.total++;
      if (o.firstSessionMetrics?.timeToFirstAction > 0) stats.activated++;
      cohortStats.set(cohort, stats);
    });

    const activationByCohort = Array.from(cohortStats.entries())
      .map(([cohortId, stats]) => ({
        cohortId,
        activationRate: stats.total > 0 ? (stats.activated / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.activationRate - a.activationRate);

    // Generate recommendations
    const recommendations = this.generateActivationRecommendations(
      firstSessionActivationRate,
      firstWeekRetentionRate,
      firstChallengeCompletionRate,
      averageTimeToFirstAction
    );

    return {
      firstSessionActivation: firstSessionActivationRate,
      firstWeekRetention: firstWeekRetentionRate,
      firstChallengeCompletion: firstChallengeCompletionRate,
      averageTimeToFirstAction,
      activationByCohort,
      recommendations,
    };
  },

  // ─── Generate Activation Recommendations ───────────────────────────────────────
  generateActivationRecommendations(
    firstSessionActivation: number,
    firstWeekRetention: number,
    firstChallengeCompletion: number,
    averageTimeToFirstAction: number
  ): string[] {
    const recommendations: string[] = [];

    if (firstSessionActivation < 60) {
      recommendations.push('Low first-session activation - improve initial value proposition and reduce friction');
    }

    if (firstWeekRetention < 40) {
      recommendations.push('Poor first-week retention - improve onboarding follow-up and early engagement');
    }

    if (firstChallengeCompletion < 30) {
      recommendations.push('Low first-challenge completion - simplify challenge introduction and provide better guidance');
    }

    if (averageTimeToFirstAction > 60000) {
      recommendations.push('Long time to first action - reduce cognitive load and provide clearer calls-to-action');
    }

    if (recommendations.length === 0) {
      recommendations.push('Activation metrics are healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Track Onboarding Step ────────────────────────────────────────────────────
  async trackOnboardingStep(
    userId: mongoose.Types.ObjectId,
    step: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    let onboarding = await OnboardingAnalytics.findOne({ userId });

    if (!onboarding) {
      onboarding = await OnboardingAnalytics.create({
        userId,
        startedAt: new Date(),
        funnelSteps: [],
        setupFriction: {
          platformSyncIssues: 0,
          authenticationIssues: 0,
          configurationErrors: 0,
          totalSetupTime: 0,
        },
        firstSessionMetrics: {
          pageViews: 0,
          timeToFirstAction: 0,
          timeToFirstProblem: 0,
          timeToFirstCompletion: 0,
          confusionEvents: 0,
          helpRequests: 0,
        },
        earlyEngagement: {
          problemsAttemptedInFirstHour: 0,
          problemsSolvedInFirstHour: 0,
          timeToFirstStreak: 0,
          returnWithin24h: false,
          returnWithin7d: false,
        },
        cohort: {
          signupDate: new Date(),
        },
      });
    }

    // Add step to funnel if not already present
    if (!onboarding.funnelSteps.some(s => s.stepName === step)) {
      const stepOrder = onboarding.funnelSteps.length + 1;
      onboarding.funnelSteps.push({
        stepName: step,
        stepOrder,
        reachedAt: new Date(),
        completedAt: new Date(),
        timeSpent: 0,
        skipped: false,
      });
    }

    await onboarding.save();
  },

  // ─── Record Drop-off ────────────────────────────────────────────────────────
  async recordDropOff(userId: mongoose.Types.ObjectId, step: string, reason?: string): Promise<void> {
    const onboarding = await OnboardingAnalytics.findOne({ userId });
    if (!onboarding) return;

    onboarding.dropOffStep = step;
    onboarding.dropOffReason = reason;
    await onboarding.save();
  },

  // ─── Complete Onboarding ────────────────────────────────────────────────────
  async completeOnboarding(userId: mongoose.Types.ObjectId): Promise<void> {
    const onboarding = await OnboardingAnalytics.findOne({ userId });
    if (!onboarding) return;

    onboarding.completedAt = new Date();
    onboarding.totalDuration = onboarding.completedAt.getTime() - onboarding.startedAt.getTime();
    await onboarding.save();
  },
};

export default onboardingOptimization;
