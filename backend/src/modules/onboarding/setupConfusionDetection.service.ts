// src/modules/onboarding/setupConfusionDetection.service.ts — Setup Confusion Detection Service
// Phase-J: Onboarding + Activation Optimization - Setup confusion detection and first-session activation

import mongoose from 'mongoose';
import { OnboardingAnalytics } from '../../db/models/onboardingAnalytics.model.js';
import { SessionReplay } from '../../db/models/sessionReplay.model.js';
import { logger } from '../../shared/logger.js';

export interface ConfusionDetection {
  totalUsers: number;
  confusedUsers: number;
  confusionRate: number;
  commonConfusionPoints: Array<{ point: string; count: number; percentage: number }>;
  setupIssues: Array<{ issue: string; count: number }>;
  recommendations: string[];
}

export interface FirstSessionActivation {
  averageTimeToFirstAction: number;
  averageTimeToFirstProblem: number;
  averageTimeToFirstCompletion: number;
  confusionEventsPerSession: number;
  helpRequestsPerSession: number;
  activationQuality: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export const setupConfusionDetection = {
  // ─── Detect Setup Confusion ────────────────────────────────────────────────
  async detectSetupConfusion(dateRange: { start: Date; end: Date }): Promise<ConfusionDetection> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    const totalUsers = onboardingData.length;

    // Identify confused users (high confusion events or setup friction)
    const confusedUsers = onboardingData.filter(o => {
      const confusionEvents = o.firstSessionMetrics?.confusionEvents || 0;
      const setupIssues = o.setupFriction?.platformSyncIssues || 0 + o.setupFriction?.authenticationIssues || 0 + o.setupFriction?.configurationErrors || 0;
      return confusionEvents > 3 || setupIssues > 1;
    });

    const confusionRate = totalUsers > 0 ? (confusedUsers.length / totalUsers) * 100 : 0;

    // Identify common confusion points
    const confusionPoints = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.dropOffReason) {
        confusionPoints.set(o.dropOffReason, (confusionPoints.get(o.dropOffReason) || 0) + 1);
      }
    });

    const commonConfusionPoints = Array.from(confusionPoints.entries())
      .map(([point, count]) => ({
        point,
        count,
        percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Identify setup issues
    const setupIssues = new Map<string, number>();
    onboardingData.forEach(o => {
      if (o.setupFriction?.platformSyncIssues > 0) {
        setupIssues.set('platform_sync', (setupIssues.get('platform_sync') || 0) + o.setupFriction.platformSyncIssues);
      }
      if (o.setupFriction?.authenticationIssues > 0) {
        setupIssues.set('authentication', (setupIssues.get('authentication') || 0) + o.setupFriction.authenticationIssues);
      }
      if (o.setupFriction?.configurationErrors > 0) {
        setupIssues.set('configuration', (setupIssues.get('configuration') || 0) + o.setupFriction.configurationErrors);
      }
    });

    const setupIssuesArray = Array.from(setupIssues.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count);

    // Generate recommendations
    const recommendations = this.generateConfusionRecommendations(
      confusionRate,
      commonConfusionPoints,
      setupIssuesArray
    );

    return {
      totalUsers,
      confusedUsers: confusedUsers.length,
      confusionRate,
      commonConfusionPoints,
      setupIssues: setupIssuesArray,
      recommendations,
    };
  },

  // ─── Generate Confusion Recommendations ────────────────────────────────────
  generateConfusionRecommendations(
    confusionRate: number,
    confusionPoints: Array<{ point: string; count: number; percentage: number }>,
    setupIssues: Array<{ issue: string; count: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (confusionRate > 30) {
      recommendations.push('CRITICAL: High confusion rate - major onboarding redesign needed');
    } else if (confusionRate > 15) {
      recommendations.push('Concerning confusion rate - review onboarding clarity');
    }

    confusionPoints.slice(0, 3).forEach(({ point }) => {
      recommendations.push(`Address confusion at "${point}" - improve guidance and reduce ambiguity`);
    });

    setupIssues.slice(0, 3).forEach(({ issue }) => {
      recommendations.push(`Fix ${issue} issues - improve setup reliability and error messages`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Setup confusion is low - continue monitoring');
    }

    return recommendations;
  },

  // ─── Analyze First Session Activation ───────────────────────────────────────
  async analyzeFirstSessionActivation(dateRange: { start: Date; end: Date }): Promise<FirstSessionActivation> {
    const onboardingData = await OnboardingAnalytics.find({
      startedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });

    // Calculate average time to first action
    const withFirstAction = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstAction > 0);
    const averageTimeToFirstAction = withFirstAction.length > 0
      ? withFirstAction.reduce((sum, o) => sum + (o.firstSessionMetrics?.timeToFirstAction || 0), 0) / withFirstAction.length
      : 0;

    // Calculate average time to first problem
    const withFirstProblem = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstProblem > 0);
    const averageTimeToFirstProblem = withFirstProblem.length > 0
      ? withFirstProblem.reduce((sum, o) => sum + (o.firstSessionMetrics?.timeToFirstProblem || 0), 0) / withFirstProblem.length
      : 0;

    // Calculate average time to first completion
    const withFirstCompletion = onboardingData.filter(o => o.firstSessionMetrics?.timeToFirstCompletion > 0);
    const averageTimeToFirstCompletion = withFirstCompletion.length > 0
      ? withFirstCompletion.reduce((sum, o) => sum + (o.firstSessionMetrics?.timeToFirstCompletion || 0), 0) / withFirstCompletion.length
      : 0;

    // Calculate average confusion events per session
    const averageConfusionEvents = onboardingData.length > 0
      ? onboardingData.reduce((sum, o) => sum + (o.firstSessionMetrics?.confusionEvents || 0), 0) / onboardingData.length
      : 0;

    // Calculate average help requests per session
    const averageHelpRequests = onboardingData.length > 0
      ? onboardingData.reduce((sum, o) => sum + (o.firstSessionMetrics?.helpRequests || 0), 0) / onboardingData.length
      : 0;

    // Determine activation quality
    const activationQuality = this.determineActivationQuality(
      averageTimeToFirstAction,
      averageConfusionEvents,
      averageHelpRequests
    );

    // Generate recommendations
    const recommendations = this.generateActivationRecommendations(
      averageTimeToFirstAction,
      averageTimeToFirstProblem,
      averageConfusionEvents,
      averageHelpRequests,
      activationQuality
    );

    return {
      averageTimeToFirstAction,
      averageTimeToFirstProblem,
      averageTimeToFirstCompletion,
      confusionEventsPerSession: averageConfusionEvents,
      helpRequestsPerSession: averageHelpRequests,
      activationQuality,
      recommendations,
    };
  },

  // ─── Determine Activation Quality ───────────────────────────────────────────
  determineActivationQuality(
    timeToFirstAction: number,
    confusionEvents: number,
    helpRequests: number
  ): 'high' | 'medium' | 'low' {
    if (timeToFirstAction < 30000 && confusionEvents < 2 && helpRequests < 1) {
      return 'high';
    }
    if (timeToFirstAction < 60000 && confusionEvents < 4 && helpRequests < 2) {
      return 'medium';
    }
    return 'low';
  },

  // ─── Generate Activation Recommendations ─────────────────────────────────────
  generateActivationRecommendations(
    timeToFirstAction: number,
    timeToFirstProblem: number,
    confusionEvents: number,
    helpRequests: number,
    activationQuality: 'high' | 'medium' | 'low'
  ): string[] {
    const recommendations: string[] = [];

    if (activationQuality === 'low') {
      recommendations.push('Poor activation quality - major onboarding improvements needed');
    }

    if (timeToFirstAction > 60000) {
      recommendations.push('Long time to first action - reduce cognitive load and improve initial guidance');
    }

    if (timeToFirstProblem > 120000) {
      recommendations.push('Long time to first problem - improve problem discovery and accessibility');
    }

    if (confusionEvents > 3) {
      recommendations.push('High confusion events - improve UX clarity and reduce ambiguity');
    }

    if (helpRequests > 2) {
      recommendations.push('High help requests - improve self-service guidance and reduce need for support');
    }

    if (recommendations.length === 0) {
      recommendations.push('First session activation is healthy - continue monitoring');
    }

    return recommendations;
  },

  // ─── Get Session Replay Analysis ─────────────────────────────────────────────
  async getSessionReplayAnalysis(userId: mongoose.Types.ObjectId): Promise<{
    sessionId: string;
    confusionEvents: number;
    hesitationPoints: number;
    errorEvents: number;
    totalFriction: number;
    recommendations: string[];
  }> {
    const sessionReplays = await SessionReplay.find({ userId }).sort({ startTime: -1 }).limit(1);

    if (sessionReplays.length === 0) {
      return {
        sessionId: '',
        confusionEvents: 0,
        hesitationPoints: 0,
        errorEvents: 0,
        totalFriction: 0,
        recommendations: ['No session replay data available'],
      };
    }

    const replay = sessionReplays[0];

    const confusionEvents = replay.frictionEvents.filter(f => f.type === 'confusion').length;
    const hesitationPoints = replay.frictionEvents.filter(f => f.type === 'hesitation').length;
    const errorEvents = replay.frictionEvents.filter(f => f.type === 'error').length;
    const totalFriction = replay.frictionEvents.length;

    const recommendations = this.generateReplayRecommendations(
      confusionEvents,
      hesitationPoints,
      errorEvents,
      totalFriction
    );

    return {
      sessionId: replay.sessionId,
      confusionEvents,
      hesitationPoints,
      errorEvents,
      totalFriction,
      recommendations,
    };
  },

  // ─── Generate Replay Recommendations ────────────────────────────────────────
  generateReplayRecommendations(
    confusionEvents: number,
    hesitationPoints: number,
    errorEvents: number,
    totalFriction: number
  ): string[] {
    const recommendations: string[] = [];

    if (confusionEvents > 3) {
      recommendations.push('High confusion events - review UX for clarity issues');
    }

    if (hesitationPoints > 5) {
      recommendations.push('Frequent hesitation - reduce cognitive load and improve decision clarity');
    }

    if (errorEvents > 2) {
      recommendations.push('Error events detected - improve error handling and prevention');
    }

    if (totalFriction > 10) {
      recommendations.push('High overall friction - comprehensive UX review needed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Session appears smooth - no major friction detected');
    }

    return recommendations;
  },
};

export default setupConfusionDetection;
