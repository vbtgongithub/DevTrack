// src/modules/observation/onboardingDiagnostics.service.ts — Onboarding Diagnostics Service
// Phase-J: Real User Observation System - Onboarding diagnostics and interaction flow analysis

import mongoose from 'mongoose';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { logger } from '../../shared/logger.js';

export interface OnboardingDiagnostics {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  dropOffPoints: Array<{ step: string; count: number; percentage: number }>;
  averageTimeToComplete: number;
  confusionHotspots: Array<{ step: string; confusionCount: number }>;
  hesitationPoints: Array<{ step: string; hesitationCount: number }>;
  recommendations: string[];
}

export interface InteractionFlowAnalysis {
  commonPaths: Array<{
    path: string[];
    frequency: number;
    percentage: number;
  }>;
  deadEnds: Array<{ step: string; count: number }>;
  loops: Array<{ step: string; loopCount: number }>;
  optimalPath: string[];
  deviationRate: number;
}

export const onboardingDiagnostics = {
  // ─── Get Onboarding Diagnostics ───────────────────────────────────────────
  async getOnboardingDiagnostics(dateRange: { start: Date; end: Date }): Promise<OnboardingDiagnostics> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalStarted = onboardingData.length;
    const totalCompleted = onboardingData.filter(o => o.completedAt).length;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Analyze drop-off points
    const dropOffCounts = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.dropOffStep) {
        dropOffCounts.set(o.dropOffStep, (dropOffCounts.get(o.dropOffStep) || 0) + 1);
      }
    });

    const dropOffPoints = Array.from(dropOffCounts.entries())
      .map(([step, count]) => ({
        step,
        count,
        percentage: totalStarted > 0 ? (count / totalStarted) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average time to complete
    const completedOnboarding = onboardingData.filter(o => o.completedAt && o.totalDuration);
    const averageTimeToComplete = completedOnboarding.length > 0
      ? completedOnboarding.reduce((sum, o) => sum + (o.totalDuration || 0), 0) / completedOnboarding.length
      : 0;

    // Analyze confusion hotspots from session replays
    const confusionHotspots = await this.analyzeConfusionHotspots(dateRange);

    // Analyze hesitation points
    const hesitationPoints = await this.analyzeHesitationPoints(dateRange);

    // Generate recommendations
    const recommendations = this.generateOnboardingRecommendations(
      completionRate,
      dropOffPoints,
      confusionHotspots,
      hesitationPoints
    );

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      dropOffPoints,
      averageTimeToComplete,
      confusionHotspots,
      hesitationPoints,
      recommendations,
    };
  },

  // ─── Analyze Confusion Hotspots ─────────────────────────────────────────
  async analyzeConfusionHotspots(dateRange: { start: Date; end: Date }): Promise<Array<{ step: string; confusionCount: number }>> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const confusionByStep = new Map<string, number>();

    sessionReplays.forEach(replay => {
      replay.frictionEvents.forEach(event => {
        if (event.type === 'confusion') {
          const step = event.context?.step as string || 'unknown';
          confusionByStep.set(step, (confusionByStep.get(step) || 0) + 1);
        }
      });
    });

    return Array.from(confusionByStep.entries())
      .map(([step, confusionCount]) => ({ step, confusionCount }))
      .sort((a, b) => b.confusionCount - a.confusionCount)
      .slice(0, 10);
  },

  // ─── Analyze Hesitation Points ─────────────────────────────────────────
  async analyzeHesitationPoints(dateRange: { start: Date; end: Date }): Promise<Array<{ step: string; hesitationCount: number }>> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const hesitationByStep = new Map<string, number>();

    sessionReplays.forEach(replay => {
      replay.frictionEvents.forEach(event => {
        if (event.type === 'hesitation') {
          const step = event.context?.step as string || 'unknown';
          hesitationByStep.set(step, (hesitationByStep.get(step) || 0) + 1);
        }
      });
    });

    return Array.from(hesitationByStep.entries())
      .map(([step, hesitationCount]) => ({ step, hesitationCount }))
      .sort((a, b) => b.hesitationCount - a.hesitationCount)
      .slice(0, 10);
  },

  // ─── Generate Onboarding Recommendations ─────────────────────────────────
  generateOnboardingRecommendations(
    completionRate: number,
    dropOffPoints: Array<{ step: string; count: number; percentage: number }>,
    confusionHotspots: Array<{ step: string; confusionCount: number }>,
    hesitationPoints: Array<{ step: string; hesitationCount: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (completionRate < 50) {
      recommendations.push('CRITICAL: Onboarding completion rate is below 50% - major redesign needed');
    } else if (completionRate < 70) {
      recommendations.push('Onboarding completion rate is concerning - review drop-off points');
    }

    if (dropOffPoints.length > 0 && dropOffPoints[0].percentage > 30) {
      recommendations.push(`High drop-off at "${dropOffPoints[0].step}" - simplify or remove this step`);
    }

    confusionHotspots.slice(0, 3).forEach(({ step }) => {
      recommendations.push(`Confusion detected at "${step}" - improve clarity and guidance`);
    });

    hesitationPoints.slice(0, 3).forEach(({ step }) => {
      recommendations.push(`Hesitation detected at "${step}" - reduce cognitive load or provide clearer cues`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Onboarding is performing well - continue monitoring');
    }

    return recommendations;
  },

  // ─── Analyze Interaction Flow ───────────────────────────────────────────
  async analyzeInteractionFlow(dateRange: { start: Date; end: Date }): Promise<InteractionFlowAnalysis> {
    const sessionReplays = await SessionReplay.find({
      startTime: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Extract paths from page views
    const paths: string[][] = [];
    sessionReplays.forEach(replay => {
      const path = replay.pages.map(p => p.path);
      if (path.length > 0) {
        paths.push(path);
      }
    });

    // Find common paths
    const pathCounts = new Map<string, number>();
    paths.forEach(path => {
      const pathKey = path.join(' -> ');
      pathCounts.set(pathKey, (pathCounts.get(pathKey) || 0) + 1);
    });

    const commonPaths = Array.from(pathCounts.entries())
      .map(([path, frequency]) => ({
        path: path.split(' -> '),
        frequency,
        percentage: paths.length > 0 ? (frequency / paths.length) * 100 : 0,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Identify dead ends (pages where users exit without completing)
    const deadEndCounts = new Map<string, number>();
    sessionReplays.forEach(replay => {
      if (!replay.endTime || (replay.duration && replay.duration < 30000)) {
        // Short session - likely abandoned
        const lastPage = replay.pages[replay.pages.length - 1];
        if (lastPage) {
          deadEndCounts.set(lastPage.path, (deadEndCounts.get(lastPage.path) || 0) + 1);
        }
      }
    });

    const deadEnds = Array.from(deadEndCounts.entries())
      .map(([step, count]) => ({ step, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Identify loops (repeated page visits)
    const loopCounts = new Map<string, number>();
    sessionReplays.forEach(replay => {
      const pageVisits = new Map<string, number>();
      replay.pages.forEach(page => {
        pageVisits.set(page.path, (pageVisits.get(page.path) || 0) + 1);
      });

      pageVisits.forEach((count: number, page: string) => {
        if (count > 2) {
          loopCounts.set(page, (loopCounts.get(page) || 0) + 1);
        }
      });
    });

    const loops = Array.from(loopCounts.entries())
      .map(([step, loopCount]) => ({ step, loopCount }))
      .sort((a, b) => b.loopCount - a.loopCount)
      .slice(0, 5);

    // Determine optimal path (most common successful path)
    const optimalPath = commonPaths.length > 0 ? commonPaths[0].path : [];

    // Calculate deviation rate
    let deviationCount = 0;
    paths.forEach(path => {
      if (JSON.stringify(path) !== JSON.stringify(optimalPath)) {
        deviationCount++;
      }
    });
    const deviationRate = paths.length > 0 ? (deviationCount / paths.length) * 100 : 0;

    return {
      commonPaths,
      deadEnds,
      loops,
      optimalPath,
      deviationRate,
    };
  },

  // ─── Get First Session Metrics ─────────────────────────────────────────
  async getFirstSessionMetrics(userId: mongoose.Types.ObjectId): Promise<{
    sessionDuration: number;
    pagesVisited: number;
    interactions: number;
    frictionEvents: number;
    completedOnboarding: boolean;
  }> {
    const betaUser = await BetaUser.findOne({ userId });
    if (!betaUser) {
      throw new Error('User not found in beta');
    }

    const firstSession = await SessionReplay.findOne({
      betaUserId: betaUser._id,
    }).sort({ startTime: 1 });

    if (!firstSession) {
      return {
        sessionDuration: 0,
        pagesVisited: 0,
        interactions: 0,
        frictionEvents: 0,
        completedOnboarding: false,
      };
    }

    const onboardingData = await OnboardingAnalytics.findOne({ userId });
    const completedOnboarding = onboardingData?.completedAt !== undefined;

    return {
      sessionDuration: firstSession.duration ?? 0,
      pagesVisited: firstSession.pages.length,
      interactions: firstSession.interactions.length,
      frictionEvents: firstSession.frictionEvents.length,
      completedOnboarding,
    };
  },
};

export default onboardingDiagnostics;
