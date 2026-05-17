// src/modules/onboarding/onboardingActivationRefinement.service.ts — Onboarding Activation Refinement Service
// Phase-K: Onboarding + Activation Refinement - Onboarding drop-offs, setup friction, progression comprehension, feature confusion, first-session activation, workspace understanding

import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface OnboardingRefinementMetrics {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropOffPoints: Array<{ step: string; count: number; percentage: number }>;
  setupFrictionScore: number; // 0-100, higher = more friction
  progressionComprehensionScore: number; // 0-100
  featureConfusionScore: number; // 0-100, higher = more confusion
  firstSessionActivationRate: number;
  workspaceUnderstandingScore: number; // 0-100
  recommendations: string[];
}

export const onboardingActivationRefinement = {
  // ─── Get Onboarding Refinement Metrics ───────────────────────────────────────
  async getOnboardingRefinementMetrics(dateRange: { start: Date; end: Date }): Promise<OnboardingRefinementMetrics> {
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

    // Identify drop-off points
    const dropOffPoints = this.identifyDropOffPoints(onboardingData);

    // Calculate setup friction score
    const setupFrictionScore = this.calculateSetupFrictionScore(onboardingData);

    // Calculate progression comprehension score
    const progressionComprehensionScore = this.calculateProgressionComprehensionScore(onboardingData);

    // Calculate feature confusion score
    const featureConfusionScore = this.calculateFeatureConfusionScore(onboardingData);

    // Calculate first session activation rate
    const firstSessionActivationRate = this.calculateFirstSessionActivationRate(onboardingData);

    // Calculate workspace understanding score
    const workspaceUnderstandingScore = this.calculateWorkspaceUnderstandingScore(onboardingData);

    const recommendations = this.generateRefinementRecommendations(
      completionRate,
      setupFrictionScore,
      progressionComprehensionScore,
      featureConfusionScore,
      firstSessionActivationRate,
      workspaceUnderstandingScore
    );

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      averageTimeToComplete,
      dropOffPoints,
      setupFrictionScore,
      progressionComprehensionScore,
      featureConfusionScore,
      firstSessionActivationRate,
      workspaceUnderstandingScore,
      recommendations,
    };
  },

  // ─── Identify Drop-off Points ───────────────────────────────────────────────
  identifyDropOffPoints(onboardingData: any[]): Array<{ step: string; count: number; percentage: number }> {
    const dropOffCounts = new Map<string, number>();

    onboardingData.forEach(o => {
      if (o.dropOffStep) {
        dropOffCounts.set(o.dropOffStep, (dropOffCounts.get(o.dropOffStep) || 0) + 1);
      }
    });

    return Array.from(dropOffCounts.entries())
      .map(([step, count]) => ({
        step,
        count,
        percentage: onboardingData.length > 0 ? (count / onboardingData.length) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
  },

  // ─── Calculate Setup Friction Score ───────────────────────────────────────────
  calculateSetupFrictionScore(onboardingData: any[]): number {
    if (onboardingData.length === 0) return 0;

    let totalFriction = 0;

    onboardingData.forEach(o => {
      let friction = 0;

      // Platform sync issues
      friction += o.setupFriction?.platformSyncIssues || 0 * 10;

      // Authentication issues
      friction += o.setupFriction?.authenticationIssues || 0 * 15;

      // Configuration errors
      friction += o.setupFriction?.configurationErrors || 0 * 20;

      // Total setup time
      if (o.setupFriction?.totalSetupTime > 300000) { // > 5 minutes
        friction += 25;
      }

      totalFriction += friction;
    });

    return Math.min(100, totalFriction / onboardingData.length);
  },

  // ─── Calculate Progression Comprehension Score ─────────────────────────────────
  calculateProgressionComprehensionScore(onboardingData: any[]): number {
    if (onboardingData.length === 0) return 0;

    let totalScore = 0;

    onboardingData.forEach(o => {
      let score = 100;

      // Penalize confusion events
      score -= (o.firstSessionMetrics?.confusionEvents || 0) * 5;

      // Penalize help requests
      score -= (o.firstSessionMetrics?.helpRequests || 0) * 3;

      // Reward quick first problem
      if (o.firstSessionMetrics?.timeToFirstProblem < 120000) { // < 2 minutes
        score += 10;
      }

      // Reward first completion
      if (o.firstSessionMetrics?.timeToFirstCompletion < 300000) { // < 5 minutes
        score += 15;
      }

      totalScore += Math.max(0, score);
    });

    return totalScore / onboardingData.length;
  },

  // ─── Calculate Feature Confusion Score ────────────────────────────────────────
  calculateFeatureConfusionScore(onboardingData: any[]): number {
    // In a real implementation, this would analyze feature interaction patterns
    // For now, return a placeholder based on confusion events
    if (onboardingData.length === 0) return 0;

    const totalConfusion = onboardingData.reduce((sum, o) => sum + (o.firstSessionMetrics?.confusionEvents || 0), 0);
    return Math.min(100, (totalConfusion / onboardingData.length) * 10);
  },

  // ─── Calculate First Session Activation Rate ────────────────────────────────
  calculateFirstSessionActivationRate(onboardingData: any[]): number {
    if (onboardingData.length === 0) return 0;

    const activated = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstAction > 0).length;
    return (activated / onboardingData.length) * 100;
  },

  // ─── Calculate Workspace Understanding Score ───────────────────────────────────
  calculateWorkspaceUnderstandingScore(onboardingData: any[]): number {
    if (onboardingData.length === 0) return 0;

    let totalScore = 0;

    onboardingData.forEach(o => {
      let score = 100;

      // Penalize long time to first action
      if (o.firstSessionMetrics?.timeToFirstAction > 60000) { // > 1 minute
        score -= 20;
      }

      // Reward early problem attempts
      if (o.earlyEngagement?.problemsAttemptedInFirstHour > 0) {
        score += 15;
      }

      // Reward early problem solves
      if (o.earlyEngagement?.problemsSolvedInFirstHour > 0) {
        score += 20;
      }

      // Reward quick streak activation
      if (o.earlyEngagement?.timeToFirstStreak < 1800000) { // < 30 minutes
        score += 15;
      }

      totalScore += Math.max(0, score);
    });

    return totalScore / onboardingData.length;
  },

  // ─── Generate Refinement Recommendations ────────────────────────────────────────
  generateRefinementRecommendations(
    completionRate: number,
    setupFrictionScore: number,
    progressionComprehensionScore: number,
    featureConfusionScore: number,
    firstSessionActivationRate: number,
    workspaceUnderstandingScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (completionRate < 50) {
      recommendations.push('CRITICAL: Onboarding completion rate below 50% - major redesign needed');
    } else if (completionRate < 70) {
      recommendations.push('Onboarding completion rate concerning - review drop-off points');
    }

    if (setupFrictionScore > 50) {
      recommendations.push('High setup friction - simplify setup process and improve error handling');
    }

    if (progressionComprehensionScore < 60) {
      recommendations.push('Low progression comprehension - improve explanation and reduce confusion');
    }

    if (featureConfusionScore > 40) {
      recommendations.push('High feature confusion - simplify feature discovery and improve guidance');
    }

    if (firstSessionActivationRate < 60) {
      recommendations.push('Low first-session activation - improve initial value proposition');
    }

    if (workspaceUnderstandingScore < 60) {
      recommendations.push('Low workspace understanding - improve onboarding guidance and reduce complexity');
    }

    if (recommendations.length === 0) {
      recommendations.push('Onboarding is healthy - continue monitoring');
    }

    return recommendations;
  },
};

export default onboardingActivationRefinement;
