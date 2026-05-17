// src/modules/beta/betaOperations.service.ts — Beta Operations Service
// Phase-K: Closed Beta Operations System - Beta admin workflows, invite management, cohort segmentation, rollout dashboards, feature exposure controls

import mongoose from 'mongoose';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { BetaCohort } from '../../db/models/betaCohort.model.js';
import { logger } from '../../shared/logger.js';

export interface BetaInvite {
  inviteCode: string;
  email: string;
  cohortId: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

export interface RolloutDashboard {
  featureName: string;
  rolloutPercentage: number;
  activeUsers: number;
  satisfaction: number;
  errorRate: number;
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export const betaOperations = {
  // ─── Generate Beta Invite ─────────────────────────────────────────────────────
  async generateBetaInvite(email: string, cohortId: string, expiresInDays: number = 7): Promise<BetaInvite> {
    const inviteCode = this.generateInviteCode();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite: BetaInvite = {
      inviteCode,
      email,
      cohortId,
      status: 'pending',
      createdAt: new Date(),
      expiresAt,
    };

    // In a real implementation, this would be stored in Redis for fast lookup
    logger.info('[beta-ops] Beta invite generated', { inviteCode, email, cohortId });

    return invite;
  },

  // ─── Generate Invite Code ───────────────────────────────────────────────────────
  generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // ─── Accept Beta Invite ────────────────────────────────────────────────────────
  async acceptBetaInvite(inviteCode: string, userId: mongoose.Types.ObjectId, email: string): Promise<boolean> {
    // In a real implementation, this would validate against Redis
    const cohortId = 'default_cohort'; // Would come from invite lookup

    const existingUser = await BetaUser.findOne({ userId });
    if (existingUser) {
      logger.warn('[beta-ops] User already in beta', { userId });
      return false;
    }

    await BetaUser.create({
      userId,
      email,
      inviteCode,
      cohortId,
      status: 'active',
      invitedAt: new Date(),
      activatedAt: new Date(),
      featureFlags: {},
      betaFeatures: [],
      feedbackCount: 0,
      sessionCount: 0,
      diagnosticsEnabled: true,
    });

    logger.info('[beta-ops] Beta invite accepted', { userId, inviteCode, cohortId });

    return true;
  },

  // ─── Segment Cohort ───────────────────────────────────────────────────────────
  async segmentCohort(cohortId: string, criteria: {
    targetSize: number;
    acquisitionChannel?: string;
    engagementLevel?: 'high' | 'medium' | 'low';
  }): Promise<void> {
    const cohort = await BetaCohort.findOne({ cohortId });
    if (!cohort) {
      await BetaCohort.create({
        cohortId,
        type: 'controlled',
        status: 'active',
        targetSize: criteria.targetSize,
        featureFlags: {},
        betaFeatures: [],
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    logger.info('[beta-ops] Cohort segmented', { cohortId, criteria });
  },

  // ─── Get Rollout Dashboard ─────────────────────────────────────────────────────
  async getRolloutDashboard(featureName: string): Promise<RolloutDashboard> {
    const betaUsers = await BetaUser.find({ status: 'active' });
    const activeUsers = betaUsers.length;

    // In a real implementation, this would aggregate actual metrics
    const satisfaction = 75 + Math.random() * 20;
    const errorRate = Math.random() * 5;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 3) status = 'warning';
    if (errorRate > 5) status = 'critical';

    const recommendations = this.generateRolloutRecommendations(satisfaction, errorRate, activeUsers);

    return {
      featureName,
      rolloutPercentage: 25, // Would come from feature gate service
      activeUsers,
      satisfaction,
      errorRate,
      status,
      recommendations,
    };
  },

  // ─── Generate Rollout Recommendations ───────────────────────────────────────────
  generateRolloutRecommendations(satisfaction: number, errorRate: number, activeUsers: number): string[] {
    const recommendations: string[] = [];

    if (satisfaction < 60) {
      recommendations.push('Low satisfaction - pause rollout and investigate');
    }

    if (errorRate > 3) {
      recommendations.push('Elevated error rate - review before expanding');
    }

    if (activeUsers < 10) {
      recommendations.push('Low active user count - increase cohort size before expansion');
    }

    if (recommendations.length === 0) {
      recommendations.push('Rollout is healthy - consider gradual expansion');
    }

    return recommendations;
  },

  // ─── Control Feature Exposure ────────────────────────────────────────────────
  async controlFeatureExposure(featureName: string, exposurePercentage: number): Promise<void> {
    // In a real implementation, this would update the feature gate service
    logger.info('[beta-ops] Feature exposure controlled', { featureName, exposurePercentage });
  },

  // ─── Get Beta User Lifecycle ─────────────────────────────────────────────────
  async getBetaUserLifecycle(userId: mongoose.Types.ObjectId): Promise<{
    status: string;
    cohortId: string;
    activatedAt: Date;
    sessionCount: number;
    feedbackCount: number;
    lastActiveAt: Date;
    recommendations: string[];
  }> {
    const betaUser = await BetaUser.findOne({ userId });

    if (!betaUser) {
      throw new Error('User not in beta');
    }

    const recommendations = this.generateLifecycleRecommendations(betaUser);

    return {
      status: betaUser.status,
      cohortId: betaUser.cohortId,
      activatedAt: betaUser.activatedAt || betaUser.invitedAt,
      sessionCount: betaUser.sessionCount,
      feedbackCount: betaUser.feedbackCount,
      lastActiveAt: betaUser.lastActiveAt || betaUser.activatedAt || betaUser.invitedAt,
      recommendations,
    };
  },

  // ─── Generate Lifecycle Recommendations ────────────────────────────────────────
  generateLifecycleRecommendations(betaUser: any): string[] {
    const recommendations: string[] = [];

    const daysSinceActivation = betaUser.activatedAt
      ? (Date.now() - betaUser.activatedAt.getTime()) / (24 * 60 * 60 * 1000)
      : 0;

    if (betaUser.sessionCount === 0 && daysSinceActivation > 3) {
      recommendations.push('User has not activated - send gentle reminder');
    }

    if (betaUser.feedbackCount === 0 && betaUser.sessionCount > 5) {
      recommendations.push('User is active but no feedback - request feedback');
    }

    if (betaUser.sessionCount > 10 && betaUser.feedbackCount < 2) {
      recommendations.push('High engagement but low feedback - request feedback');
    }

    if (recommendations.length === 0) {
      recommendations.push('User is progressing normally');
    }

    return recommendations;
  },

  // ─── Get Beta Statistics ─────────────────────────────────────────────────────
  async getBetaStatistics(): Promise<{
    totalInvited: number;
    totalActive: number;
    totalSuspended: number;
    totalGraduated: number;
    activationRate: number;
    averageSessionCount: number;
    averageFeedbackCount: number;
  }> {
    const stats = await BetaUser.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgSessions: { $avg: '$sessionCount' },
          avgFeedback: { $avg: '$feedbackCount' },
        },
      },
    ]);

    const totalInvited = await BetaUser.countDocuments();
    const totalActive = stats.find(s => s._id === 'active')?.count || 0;
    const totalSuspended = stats.find(s => s._id === 'suspended')?.count || 0;
    const totalGraduated = stats.find(s => s._id === 'graduated')?.count || 0;

    const activeStats = stats.find(s => s._id === 'active');
    const averageSessionCount = activeStats?.avgSessions || 0;
    const averageFeedbackCount = activeStats?.avgFeedback || 0;

    const activationRate = totalInvited > 0 ? (totalActive / totalInvited) * 100 : 0;

    return {
      totalInvited,
      totalActive,
      totalSuspended,
      totalGraduated,
      activationRate,
      averageSessionCount,
      averageFeedbackCount,
    };
  },
};

export default betaOperations;
