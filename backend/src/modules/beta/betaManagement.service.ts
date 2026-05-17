// src/modules/beta/betaManagement.service.ts — Beta Management Service
// Phase-J: Controlled Beta Infrastructure - Invite-only beta system and cohort management

import mongoose from 'mongoose';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { BetaCohort } from '../../db/models/betaCohort.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';
import crypto from 'crypto';

export interface BetaInvite {
  email: string;
  inviteCode: string;
  cohortId: string;
  expiresAt: Date;
}

export const betaManagement = {
  // ─── Create Beta Cohort ────────────────────────────────────────────────
  async createCohort(
    name: string,
    description: string,
    type: 'onboarding' | 'feature_test' | 'ux_experiment' | 'general',
    options: {
      targetSize?: number;
      featureFlags?: Record<string, boolean>;
      betaFeatures?: string[];
      onboardingVariant?: string;
      priority?: number;
    } = {}
  ): Promise<string> {
    const cohortId = `cohort_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const cohort = await BetaCohort.create({
      cohortId,
      name,
      description,
      type,
      status: 'draft',
      targetSize: options.targetSize || 50,
      currentSize: 0,
      featureFlags: options.featureFlags || {},
      betaFeatures: options.betaFeatures || [],
      onboardingVariant: options.onboardingVariant,
      priority: options.priority || 0,
    });

    logger.info('[beta] Cohort created', { cohortId, name, type });

    return cohortId;
  },

  // ─── Activate Cohort ────────────────────────────────────────────────────
  async activateCohort(cohortId: string): Promise<void> {
    const cohort = await BetaCohort.findOne({ cohortId });
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    cohort.status = 'active';
    cohort.startDate = new Date();
    await cohort.save();

    logger.info('[beta] Cohort activated', { cohortId });
  },

  // ─── Generate Beta Invite ───────────────────────────────────────────────
  async generateInvite(
    email: string,
    cohortId: string,
    expiresInDays: number = 30
  ): Promise<BetaInvite> {
    const inviteCode = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store in Redis for quick lookup
    const redis = getRedisClient();
    await redis.setex(`beta_invite:${inviteCode}`, 86400 * expiresInDays, JSON.stringify({
      email,
      cohortId,
      expiresAt: expiresAt.toISOString(),
    }));

    logger.info('[beta] Invite generated', { email, cohortId, inviteCode });

    return {
      email,
      inviteCode,
      cohortId,
      expiresAt,
    };
  },

  // ─── Accept Beta Invite ─────────────────────────────────────────────────
  async acceptInvite(
    userId: mongoose.Types.ObjectId,
    email: string,
    inviteCode: string
  ): Promise<void> {
    const redis = getRedisClient();
    const inviteData = await redis.get(`beta_invite:${inviteCode}`);

    if (!inviteData) {
      throw new Error('Invalid or expired invite code');
    }

    const invite = JSON.parse(inviteData);

    if (invite.email !== email) {
      throw new Error('Email does not match invite');
    }

    // Check if user already in beta
    const existingBetaUser = await BetaUser.findOne({ userId });
    if (existingBetaUser) {
      throw new Error('User already in beta program');
    }

    // Get cohort
    const cohort = await BetaCohort.findOne({ cohortId: invite.cohortId });
    if (!cohort || cohort.status !== 'active') {
      throw new Error('Cohort not available');
    }

    // Check cohort capacity
    if (cohort.currentSize >= cohort.targetSize) {
      throw new Error('Cohort is at capacity');
    }

    // Create beta user
    await BetaUser.create({
      userId,
      email,
      inviteCode,
      cohortId: invite.cohortId,
      status: 'active',
      invitedAt: new Date(invite.invitedAt || Date.now()),
      activatedAt: new Date(),
      featureFlags: cohort.featureFlags,
      betaFeatures: cohort.betaFeatures,
      diagnosticsEnabled: true,
    });

    // Update cohort size
    cohort.currentSize++;
    await cohort.save();

    // Remove invite from Redis
    await redis.del(`beta_invite:${inviteCode}`);

    logger.info('[beta] Invite accepted', { userId, email, cohortId: invite.cohortId });
  },

  // ─── Get User Beta Status ───────────────────────────────────────────────
  async getUserBetaStatus(userId: mongoose.Types.ObjectId): Promise<{
    isBetaUser: boolean;
    cohortId?: string;
    status?: string;
    featureFlags?: Record<string, boolean>;
    betaFeatures?: string[];
    diagnosticsEnabled?: boolean;
  }> {
    const betaUser = await BetaUser.findOne({ userId });

    if (!betaUser) {
      return { isBetaUser: false };
    }

    return {
      isBetaUser: true,
      cohortId: betaUser.cohortId,
      status: betaUser.status,
      featureFlags: (() => {
        const flags = betaUser.featureFlags;
        if (typeof flags === 'object' && flags !== null && !Array.isArray(flags)) {
          if (flags instanceof Map) {
            const obj: Record<string, boolean> = {};
            flags.forEach((value: boolean, key: string) => {
              obj[key] = value;
            });
            return obj;
          }
          return flags as Record<string, boolean>;
        }
        return {};
      })(),
      betaFeatures: betaUser.betaFeatures,
      diagnosticsEnabled: betaUser.diagnosticsEnabled,
    };
  },

  // ─── Check Feature Flag ─────────────────────────────────────────────────
  async checkFeatureFlag(userId: mongoose.Types.ObjectId, flag: string): Promise<boolean> {
    const betaUser = await BetaUser.findOne({ userId });

    if (!betaUser || betaUser.status !== 'active') {
      return false;
    }

    const flags = betaUser.featureFlags;
    if (typeof flags === 'object' && flags !== null && !Array.isArray(flags)) {
      if (flags instanceof Map) {
        return flags.get(flag) === true;
      }
      return (flags as Record<string, boolean>)[flag] === true;
    }
    return false;
  },

  // ─── Get Cohort Users ────────────────────────────────────────────────────
  async getCohortUsers(cohortId: string): Promise<Array<{
    userId: mongoose.Types.ObjectId;
    email: string;
    status: string;
    activatedAt?: Date;
    lastActiveAt?: Date;
    sessionCount: number;
  }>> {
    const betaUsers = await BetaUser.find({ cohortId });

    return betaUsers.map(u => ({
      userId: u.userId,
      email: u.email,
      status: u.status,
      activatedAt: u.activatedAt,
      lastActiveAt: u.lastActiveAt,
      sessionCount: u.sessionCount,
    }));
  },

  // ─── Update User Activity ───────────────────────────────────────────────
  async updateUserActivity(userId: mongoose.Types.ObjectId): Promise<void> {
    const betaUser = await BetaUser.findOne({ userId });
    if (!betaUser) return;

    betaUser.lastActiveAt = new Date();
    betaUser.sessionCount++;
    await betaUser.save();
  },

  // ─── Suspend Beta User ─────────────────────────────────────────────────
  async suspendBetaUser(userId: mongoose.Types.ObjectId, reason?: string): Promise<void> {
    const betaUser = await BetaUser.findOne({ userId });
    if (!betaUser) {
      throw new Error('Beta user not found');
    }

    betaUser.status = 'suspended';
    if (reason) {
      betaUser.notes = reason;
    }
    await betaUser.save();

    logger.warn('[beta] User suspended', { userId, reason });
  },

  // ─── Graduate Beta User ────────────────────────────────────────────────
  async graduateBetaUser(userId: mongoose.Types.ObjectId): Promise<void> {
    const betaUser = await BetaUser.findOne({ userId });
    if (!betaUser) {
      throw new Error('Beta user not found');
    }

    betaUser.status = 'graduated';
    await betaUser.save();

    logger.info('[beta] User graduated', { userId });
  },

  // ─── Get Beta Statistics ─────────────────────────────────────────────────
  async getBetaStatistics(): Promise<{
    totalBetaUsers: number;
    activeBetaUsers: number;
    totalCohorts: number;
    activeCohorts: number;
    averageSessionsPerUser: number;
    totalFeedback: number;
  }> {
    const totalBetaUsers = await BetaUser.countDocuments();
    const activeBetaUsers = await BetaUser.countDocuments({ status: 'active' });
    const totalCohorts = await BetaCohort.countDocuments();
    const activeCohorts = await BetaCohort.countDocuments({ status: 'active' });

    const activeUsers = await BetaUser.find({ status: 'active' });
    const totalSessions = activeUsers.reduce((sum, u) => sum + u.sessionCount, 0);
    const averageSessionsPerUser = activeBetaUsers > 0 ? totalSessions / activeBetaUsers : 0;

    const totalFeedback = await BetaUser.aggregate([
      { $group: { _id: null, total: { $sum: '$feedbackCount' } } },
    ]);

    return {
      totalBetaUsers,
      activeBetaUsers,
      totalCohorts,
      activeCohorts,
      averageSessionsPerUser,
      totalFeedback: totalFeedback[0]?.total || 0,
    };
  },
};

export default betaManagement;
