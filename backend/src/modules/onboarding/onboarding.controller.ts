// src/modules/onboarding/onboarding.controller.ts — Onboarding API Endpoints
import mongoose from 'mongoose';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { ApiResponse } from '../../shared/response.js';
import { withAuth } from '../../shared/controllerUtils.js';

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Welcome to DevTrack!' },
  { id: 'connect', title: 'Connect Platforms', description: 'Connect LeetCode, Codeforces, or GitHub to sync telemetry' },
  { id: 'personalize', title: 'Personalization', description: 'Configure goals and daily focus targets' },
  { id: 'momentum', title: 'Understand Momentum', description: 'Learn how streaks, missions, and XP work' },
  { id: 'first-action', title: 'Ready to Launch', description: 'Take your first action and start coding' },
];

export const onboardingController = {
  getProgress: withAuth('[onboarding]', 'get progress', async (userId, _req, res) => {
    let analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!analytics) {
      analytics = new OnboardingAnalytics({
        userId: new mongoose.Types.ObjectId(userId),
        startedAt: new Date(),
        funnelSteps: [],
        completionRate: 0,
        currentStep: 'welcome',
        cohort: { signupDate: new Date() },
        firstSessionMetrics: {
          pageViews: 1,
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
      });
      await analytics.save();
    }

    const steps = ONBOARDING_STEPS.map((step) => {
      const dbStep = analytics!.funnelSteps.find(s => s.stepName === step.id);
      return {
        id: step.id,
        title: step.title,
        description: step.description,
        completed: !!dbStep?.completedAt,
        skipped: !!dbStep?.skipped,
      };
    });

    let currentStepIdx = steps.findIndex(s => !s.completed && !s.skipped);
    if (currentStepIdx === -1) {
      currentStepIdx = steps.length - 1;
    }

    res.json({
      success: true,
      data: {
        isCompleted: !!analytics.completedAt,
        currentStep: currentStepIdx,
        steps,
        startedAt: analytics.startedAt.toISOString(),
        completedAt: analytics.completedAt ? analytics.completedAt.toISOString() : null,
      },
    });
  }),

  completeStep: withAuth('[onboarding]', 'complete step', async (userId, req, res) => {
    const stepId = req.params.stepId;
    if (!stepId) {
      ApiResponse.badRequest(res, 'Step ID is required');
      return;
    }

    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) {
      ApiResponse.notFound(res, 'Onboarding session not found');
      return;
    }

    const existingStepIdx = analytics.funnelSteps.findIndex(s => s.stepName === stepId);
    const now = new Date();

    if (existingStepIdx !== -1) {
      analytics.funnelSteps[existingStepIdx].completedAt = now;
      analytics.funnelSteps[existingStepIdx].skipped = false;
    } else {
      const order = ONBOARDING_STEPS.findIndex(s => s.id === stepId) + 1;
      analytics.funnelSteps.push({
        stepName: stepId as string,
        stepOrder: order || analytics.funnelSteps.length + 1,
        reachedAt: now,
        completedAt: now,
        timeSpent: 0,
        skipped: false,
      });
    }

    const completedCount = analytics.funnelSteps.filter(s => s.completedAt).length;
    analytics.completionRate = (completedCount / ONBOARDING_STEPS.length) * 100;
    analytics.currentStep = stepId as string;

    await analytics.save();
    res.json({ success: true });
  }),

  skipStep: withAuth('[onboarding]', 'skip step', async (userId, req, res) => {
    const stepId = req.params.stepId;
    if (!stepId) {
      ApiResponse.badRequest(res, 'Step ID is required');
      return;
    }

    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) {
      ApiResponse.notFound(res, 'Onboarding session not found');
      return;
    }

    const existingStepIdx = analytics.funnelSteps.findIndex(s => s.stepName === stepId);
    const now = new Date();

    if (existingStepIdx !== -1) {
      analytics.funnelSteps[existingStepIdx].skipped = true;
      analytics.funnelSteps[existingStepIdx].completedAt = undefined;
    } else {
      const order = ONBOARDING_STEPS.findIndex(s => s.id === stepId) + 1;
      analytics.funnelSteps.push({
        stepName: stepId as string,
        stepOrder: order || analytics.funnelSteps.length + 1,
        reachedAt: now,
        timeSpent: 0,
        skipped: true,
      });
    }

    await analytics.save();
    res.json({ success: true });
  }),

  completeOnboarding: withAuth('[onboarding]', 'complete onboarding', async (userId, _req, res) => {
    const analytics = await OnboardingAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!analytics) {
      ApiResponse.notFound(res, 'Onboarding session not found');
      return;
    }

    analytics.completedAt = new Date();
    analytics.totalDuration = analytics.completedAt.getTime() - analytics.startedAt.getTime();
    analytics.completionRate = 100;
    analytics.currentStep = 'completed';

    ONBOARDING_STEPS.forEach(step => {
      const exist = analytics.funnelSteps.find(s => s.stepName === step.id);
      if (!exist) {
        analytics.funnelSteps.push({
          stepName: step.id,
          stepOrder: ONBOARDING_STEPS.findIndex(s => s.id === step.id) + 1,
          reachedAt: new Date(),
          completedAt: new Date(),
          timeSpent: 0,
          skipped: false,
        });
      } else if (!exist.completedAt && !exist.skipped) {
        exist.completedAt = new Date();
      }
    });

    await analytics.save();
    res.json({ success: true });
  }),
};
