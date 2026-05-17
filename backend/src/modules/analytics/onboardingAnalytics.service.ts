// src/modules/analytics/onboardingAnalytics.service.ts — Onboarding Analytics Service
// Phase-I: Onboarding Optimization - Tracks funnel, completion, and first-session behavior

import mongoose from 'mongoose';
import { OnboardingAnalytics, type IOnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface FunnelStep {
  stepName: string;
  stepOrder: number;
  reachedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  skipped: boolean;
}

export interface OnboardingMetrics {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageDuration: number;
  dropOffByStep: Array<{ step: string; count: number; rate: number }>;
  averageTimePerStep: Array<{ step: string; avgTime: number }>;
}

const ONBOARDING_KEYS = {
  funnelData: (date: string) => `onboarding:funnel:${date}`,
  activeOnboarding: (userId: string) => `onboarding:active:${userId}`,
};

export const onboardingAnalytics = {
  // ─── Onboarding Session Management ─────────────────────────────────────
  async startOnboarding(
    userId: string,
    cohort: { signupDate: Date; acquisitionChannel?: string; referralSource?: string }
  ): Promise<void> {
    const existing = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existing) {
      logger.warn('[onboarding-analytics] Onboarding already started', { userId });
      return;
    }

    const analytics = new OnboardingAnalytics({
      userId: new mongoose.Types.ObjectId(userId),
      startedAt: new Date(),
      completionRate: 0,
      currentStep: '',
      funnelSteps: [],
      firstSessionMetrics: {
        pageViews: 0,
        timeToFirstAction: 0,
        timeToFirstProblem: 0,
        timeToFirstCompletion: 0,
        confusionEvents: 0,
        helpRequests: 0,
      },
      setupFriction: {
        platformSyncIssues: 0,
        authenticationIssues: 0,
        configurationErrors: 0,
        totalSetupTime: 0,
      },
      earlyEngagement: {
        problemsAttemptedInFirstHour: 0,
        problemsSolvedInFirstHour: 0,
        returnWithin24h: false,
        returnWithin7d: false,
      },
      cohort,
    });

    await analytics.save();

    // Cache active onboarding
    const redis = getRedisClient();
    await redis.setex(ONBOARDING_KEYS.activeOnboarding(userId), 3600, 'true');

    logger.info('[onboarding-analytics] Onboarding started', { userId });
  },

  // ─── Funnel Step Tracking ──────────────────────────────────────────────
  async trackFunnelStep(userId: string, step: FunnelStep): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    const existingStep = analytics.funnelSteps.find(s => s.stepName === step.stepName);

    if (existingStep) {
      existingStep.completedAt = step.completedAt;
      existingStep.timeSpent = step.timeSpent;
      existingStep.skipped = step.skipped;
    } else {
      analytics.funnelSteps.push(step);
    }

    analytics.currentStep = step.stepName;

    // Calculate completion rate
    const totalSteps = analytics.funnelSteps.length;
    const completedSteps = analytics.funnelSteps.filter(s => s.completedAt).length;
    analytics.completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    await analytics.save();

    logger.debug('[onboarding-analytics] Funnel step tracked', { userId, step: step.stepName });
  },

  // ─── Onboarding Completion ─────────────────────────────────────────────
  async completeOnboarding(userId: string): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    analytics.completedAt = new Date();
    analytics.totalDuration = analytics.completedAt.getTime() - analytics.startedAt.getTime();
    analytics.completionRate = 100;
    analytics.currentStep = 'completed';

    await analytics.save();

    // Clean up cache
    const redis = getRedisClient();
    await redis.del(ONBOARDING_KEYS.activeOnboarding(userId));

    logger.info('[onboarding-analytics] Onboarding completed', { userId, duration: analytics.totalDuration });
  },

  // ─── Drop-off Tracking ────────────────────────────────────────────────
  async trackDropOff(
    userId: string,
    step: string,
    reason?: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    analytics.dropOffStep = step;
    analytics.dropOffReason = reason;
    analytics.dropOffContext = context;

    await analytics.save();

    logger.info('[onboarding-analytics] Drop-off tracked', { userId, step, reason });
  },

  // ─── First Session Metrics ─────────────────────────────────────────────
  async updateFirstSessionMetrics(
    userId: string,
    updates: {
      pageViews?: number;
      timeToFirstAction?: number;
      timeToFirstProblem?: number;
      timeToFirstCompletion?: number;
      confusionEvents?: number;
      helpRequests?: number;
    }
  ): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    if (updates.pageViews !== undefined) analytics.firstSessionMetrics.pageViews += updates.pageViews;
    if (updates.timeToFirstAction !== undefined && analytics.firstSessionMetrics.timeToFirstAction === 0) {
      analytics.firstSessionMetrics.timeToFirstAction = updates.timeToFirstAction;
    }
    if (updates.timeToFirstProblem !== undefined && analytics.firstSessionMetrics.timeToFirstProblem === 0) {
      analytics.firstSessionMetrics.timeToFirstProblem = updates.timeToFirstProblem;
    }
    if (updates.timeToFirstCompletion !== undefined && analytics.firstSessionMetrics.timeToFirstCompletion === 0) {
      analytics.firstSessionMetrics.timeToFirstCompletion = updates.timeToFirstCompletion;
    }
    if (updates.confusionEvents !== undefined) analytics.firstSessionMetrics.confusionEvents += updates.confusionEvents;
    if (updates.helpRequests !== undefined) analytics.firstSessionMetrics.helpRequests += updates.helpRequests;

    await analytics.save();
  },

  // ─── Setup Friction Tracking ─────────────────────────────────────────
  async trackSetupFriction(
    userId: string,
    type: 'platformSync' | 'authentication' | 'configuration',
    additionalTime?: number
  ): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    switch (type) {
      case 'platformSync':
        analytics.setupFriction.platformSyncIssues++;
        break;
      case 'authentication':
        analytics.setupFriction.authenticationIssues++;
        break;
      case 'configuration':
        analytics.setupFriction.configurationErrors++;
        break;
    }

    if (additionalTime) {
      analytics.setupFriction.totalSetupTime += additionalTime;
    }

    await analytics.save();

    logger.debug('[onboarding-analytics] Setup friction tracked', { userId, type });
  },

  // ─── Early Engagement Tracking ────────────────────────────────────────
  async updateEarlyEngagement(
    userId: string,
    updates: {
      problemsAttemptedInFirstHour?: number;
      problemsSolvedInFirstHour?: number;
      timeToFirstStreak?: number;
      returnWithin24h?: boolean;
      returnWithin7d?: boolean;
    }
  ): Promise<void> {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) return;

    if (updates.problemsAttemptedInFirstHour !== undefined) {
      analytics.earlyEngagement.problemsAttemptedInFirstHour += updates.problemsAttemptedInFirstHour;
    }
    if (updates.problemsSolvedInFirstHour !== undefined) {
      analytics.earlyEngagement.problemsSolvedInFirstHour += updates.problemsSolvedInFirstHour;
    }
    if (updates.timeToFirstStreak !== undefined && analytics.earlyEngagement.timeToFirstStreak === undefined) {
      analytics.earlyEngagement.timeToFirstStreak = updates.timeToFirstStreak;
    }
    if (updates.returnWithin24h !== undefined) analytics.earlyEngagement.returnWithin24h = updates.returnWithin24h;
    if (updates.returnWithin7d !== undefined) analytics.earlyEngagement.returnWithin7d = updates.returnWithin7d;

    await analytics.save();
  },

  // ─── Analytics Queries ─────────────────────────────────────────────────
  async getUserOnboarding(userId: string): Promise<IOnboardingAnalytics | null> {
    return OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  },

  async getFunnelMetrics(dateRange: { start: Date; end: Date }): Promise<OnboardingMetrics> {
    const analytics = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalStarted = analytics.length;
    const totalCompleted = analytics.filter(a => a.completedAt).length;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    const totalDuration = analytics
      .filter(a => a.totalDuration)
      .reduce((sum, a) => sum + (a.totalDuration || 0), 0);
    const averageDuration = totalCompleted > 0 ? totalDuration / totalCompleted : 0;

    // Drop-off by step
    const stepCounts = new Map<string, { reached: number; completed: number }>();
    analytics.forEach(a => {
      a.funnelSteps.forEach(step => {
        const existing = stepCounts.get(step.stepName) || { reached: 0, completed: 0 };
        existing.reached++;
        if (step.completedAt) existing.completed++;
        stepCounts.set(step.stepName, existing);
      });
    });

    const dropOffByStep = Array.from(stepCounts.entries()).map(([step, data]) => ({
      step,
      count: data.reached - data.completed,
      rate: data.reached > 0 ? ((data.reached - data.completed) / data.reached) * 100 : 0,
    })).sort((a, b) => b.count - a.count);

    // Average time per step
    const stepTimes = new Map<string, { totalTime: number; count: number }>();
    analytics.forEach(a => {
      a.funnelSteps.forEach(step => {
        if (step.timeSpent > 0) {
          const existing = stepTimes.get(step.stepName) || { totalTime: 0, count: 0 };
          existing.totalTime += step.timeSpent;
          existing.count++;
          stepTimes.set(step.stepName, existing);
        }
      });
    });

    const averageTimePerStep = Array.from(stepTimes.entries()).map(([step, data]) => ({
      step,
      avgTime: data.count > 0 ? data.totalTime / data.count : 0,
    })).sort((a, b) => b.avgTime - a.avgTime);

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      averageDuration,
      dropOffByStep,
      averageTimePerStep,
    };
  },

  async getDropOffAnalysis(dateRange: { start: Date; end: Date }): Promise<Array<{
    step: string;
    count: number;
    reasons: Array<{ reason: string; count: number }>;
  }>> {
    const analytics = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
      dropOffStep: { $exists: true },
    });

    const stepMap = new Map<string, Map<string, number>>();

    analytics.forEach(a => {
      if (a.dropOffStep) {
        const reasonMap = stepMap.get(a.dropOffStep) || new Map();
        const reason = a.dropOffReason || 'unknown';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
        stepMap.set(a.dropOffStep, reasonMap);
      }
    });

    return Array.from(stepMap.entries()).map(([step, reasonMap]) => ({
      step,
      count: Array.from(reasonMap.values()).reduce((sum, count) => sum + count, 0),
      reasons: Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    })).sort((a, b) => b.count - a.count);
  },

  async getFirstSessionInsights(dateRange: { start: Date; end: Date }): Promise<{
    averageTimeToFirstAction: number;
    averageTimeToFirstProblem: number;
    averageTimeToFirstCompletion: number;
    averageConfusionEvents: number;
    averageHelpRequests: number;
  }> {
    const analytics = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const validMetrics = analytics.filter(a => a.firstSessionMetrics.timeToFirstAction > 0);

    const averageTimeToFirstAction = validMetrics.length > 0
      ? validMetrics.reduce((sum, a) => sum + a.firstSessionMetrics.timeToFirstAction, 0) / validMetrics.length
      : 0;

    const validProblemMetrics = analytics.filter(a => a.firstSessionMetrics.timeToFirstProblem > 0);
    const averageTimeToFirstProblem = validProblemMetrics.length > 0
      ? validProblemMetrics.reduce((sum, a) => sum + a.firstSessionMetrics.timeToFirstProblem, 0) / validProblemMetrics.length
      : 0;

    const validCompletionMetrics = analytics.filter(a => a.firstSessionMetrics.timeToFirstCompletion > 0);
    const averageTimeToFirstCompletion = validCompletionMetrics.length > 0
      ? validCompletionMetrics.reduce((sum, a) => sum + a.firstSessionMetrics.timeToFirstCompletion, 0) / validCompletionMetrics.length
      : 0;

    const averageConfusionEvents = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.firstSessionMetrics.confusionEvents, 0) / analytics.length
      : 0;

    const averageHelpRequests = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.firstSessionMetrics.helpRequests, 0) / analytics.length
      : 0;

    return {
      averageTimeToFirstAction,
      averageTimeToFirstProblem,
      averageTimeToFirstCompletion,
      averageConfusionEvents,
      averageHelpRequests,
    };
  },

  async getEarlyEngagementMetrics(dateRange: { start: Date; end: Date }): Promise<{
    averageProblemsAttempted: number;
    averageProblemsSolved: number;
    return24hRate: number;
    return7dRate: number;
  }> {
    const analytics = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const averageProblemsAttempted = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.earlyEngagement.problemsAttemptedInFirstHour, 0) / analytics.length
      : 0;

    const averageProblemsSolved = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.earlyEngagement.problemsSolvedInFirstHour, 0) / analytics.length
      : 0;

    const return24hCount = analytics.filter(a => a.earlyEngagement.returnWithin24h).length;
    const return7dCount = analytics.filter(a => a.earlyEngagement.returnWithin7d).length;

    return {
      averageProblemsAttempted,
      averageProblemsSolved,
      return24hRate: analytics.length > 0 ? (return24hCount / analytics.length) * 100 : 0,
      return7dRate: analytics.length > 0 ? (return7dCount / analytics.length) * 100 : 0,
    };
  },
};

export default onboardingAnalytics;
