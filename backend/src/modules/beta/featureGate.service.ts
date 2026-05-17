// src/modules/beta/featureGate.service.ts — Feature Gate Service
// Phase-J: Controlled Beta Infrastructure - Beta feature gates and rollout monitoring

import mongoose from 'mongoose';
import { BetaUser } from '../../db/models/betaUser.model.js';
import { BetaCohort } from '../../db/models/betaCohort.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface FeatureGateConfig {
  featureName: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  betaOnly: boolean;
  cohortWhitelist?: string[];
  userWhitelist?: string[];
  description?: string;
}

export interface RolloutStatus {
  featureName: string;
  enabled: boolean;
  rolloutPercentage: number;
  activeUsers: number;
  totalBetaUsers: number;
  cohortBreakdown: Array<{ cohortId: string; cohortName: string; enabled: boolean; userCount: number }>;
  recommendations: string[];
}

export const featureGate = {
  // ─── Configure Feature Gate ────────────────────────────────────────────
  async configureFeatureGate(config: FeatureGateConfig): Promise<void> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${config.featureName}`;

    await redis.setex(gateKey, 86400, JSON.stringify(config));

    logger.info('[feature-gate] Feature gate configured', { featureName: config.featureName, enabled: config.enabled });
  },

  // ─── Check Feature Access ───────────────────────────────────────────────
  async checkFeatureAccess(
    userId: mongoose.Types.ObjectId,
    featureName: string
  ): Promise<{ enabled: boolean; reason?: string }> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${featureName}`;
    const gateData = await redis.get(gateKey);

    if (!gateData) {
      // Feature not configured, default to disabled
      return { enabled: false, reason: 'Feature not configured' };
    }

    const config: FeatureGateConfig = JSON.parse(gateData);

    // Check if feature is globally disabled
    if (!config.enabled) {
      return { enabled: false, reason: 'Feature globally disabled' };
    }

    // Check if feature is beta-only
    if (config.betaOnly) {
      const betaUser = await BetaUser.findOne({ userId, status: 'active' });
      if (!betaUser) {
        return { enabled: false, reason: 'Feature is beta-only' };
      }

      // Check cohort whitelist
      if (config.cohortWhitelist && config.cohortWhitelist.length > 0) {
        if (!config.cohortWhitelist.includes(betaUser.cohortId)) {
          return { enabled: false, reason: 'User cohort not in whitelist' };
        }
      }
    }

    // Check user whitelist
    if (config.userWhitelist && config.userWhitelist.length > 0) {
      if (!config.userWhitelist.includes(userId.toString())) {
        return { enabled: false, reason: 'User not in whitelist' };
      }
    }

    // Check rollout percentage (for gradual rollout)
    if (config.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId, featureName);
      const enabled = hash % 100 < config.rolloutPercentage;
      if (!enabled) {
        return { enabled: false, reason: 'User not in rollout percentage' };
      }
    }

    return { enabled: true };
  },

  // ─── Hash User ID for Consistent Rollout ───────────────────────────────
  hashUserId(userId: mongoose.Types.ObjectId, featureName: string): number {
    const str = `${userId.toString()}_${featureName}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },

  // ─── Update Rollout Percentage ───────────────────────────────────────────
  async updateRolloutPercentage(featureName: string, newPercentage: number): Promise<void> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${featureName}`;
    const gateData = await redis.get(gateKey);

    if (!gateData) {
      throw new Error('Feature gate not found');
    }

    const config: FeatureGateConfig = JSON.parse(gateData);
    config.rolloutPercentage = Math.min(100, Math.max(0, newPercentage));

    await redis.setex(gateKey, 86400, JSON.stringify(config));

    logger.info('[feature-gate] Rollout percentage updated', { featureName, newPercentage });
  },

  // ─── Get Rollout Status ─────────────────────────────────────────────────
  async getRolloutStatus(featureName: string): Promise<RolloutStatus> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${featureName}`;
    const gateData = await redis.get(gateKey);

    if (!gateData) {
      throw new Error('Feature gate not found');
    }

    const config: FeatureGateConfig = JSON.parse(gateData);

    // Get active users count
    const activeBetaUsers = await BetaUser.countDocuments({ status: 'active' });
    const totalBetaUsers = await BetaUser.countDocuments();

    // Get cohort breakdown
    const cohortBreakdown: Array<{ cohortId: string; cohortName: string; enabled: boolean; userCount: number }> = [];

    if (config.cohortWhitelist && config.cohortWhitelist.length > 0) {
      for (const cohortId of config.cohortWhitelist) {
        const cohort = await BetaCohort.findOne({ cohortId });
        const userCount = await BetaUser.countDocuments({ cohortId, status: 'active' });

        cohortBreakdown.push({
          cohortId,
          cohortName: cohort?.name || 'Unknown',
          enabled: true,
          userCount,
        });
      }
    } else {
      // All cohorts
      const cohorts = await BetaCohort.find({ status: 'active' });
      for (const cohort of cohorts) {
        const userCount = await BetaUser.countDocuments({ cohortId: cohort.cohortId, status: 'active' });
        cohortBreakdown.push({
          cohortId: cohort.cohortId,
          cohortName: cohort.name,
          enabled: true,
          userCount,
        });
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (config.rolloutPercentage === 100 && config.betaOnly) {
      recommendations.push('Consider removing beta-only flag for full rollout');
    }

    if (config.rolloutPercentage < 50 && activeBetaUsers > 20) {
      recommendations.push('Rollout percentage is low - consider increasing if stability confirmed');
    }

    if (config.rolloutPercentage === 100 && !config.betaOnly) {
      recommendations.push('Feature is fully rolled out - consider removing feature gate');
    }

    return {
      featureName,
      enabled: config.enabled,
      rolloutPercentage: config.rolloutPercentage,
      activeUsers: activeBetaUsers,
      totalBetaUsers,
      cohortBreakdown,
      recommendations,
    };
  },

  // ─── Disable Feature ───────────────────────────────────────────────────
  async disableFeature(featureName: string): Promise<void> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${featureName}`;
    const gateData = await redis.get(gateKey);

    if (!gateData) {
      throw new Error('Feature gate not found');
    }

    const config: FeatureGateConfig = JSON.parse(gateData);
    config.enabled = false;

    await redis.setex(gateKey, 86400, JSON.stringify(config));

    logger.warn('[feature-gate] Feature disabled', { featureName });
  },

  // ─── Enable Feature ────────────────────────────────────────────────────
  async enableFeature(featureName: string): Promise<void> {
    const redis = getRedisClient();
    const gateKey = `feature_gate:${featureName}`;
    const gateData = await redis.get(gateKey);

    if (!gateData) {
      throw new Error('Feature gate not found');
    }

    const config: FeatureGateConfig = JSON.parse(gateData);
    config.enabled = true;

    await redis.setex(gateKey, 86400, JSON.stringify(config));

    logger.info('[feature-gate] Feature enabled', { featureName });
  },

  // ─── List All Feature Gates ─────────────────────────────────────────────
  async listFeatureGates(): Promise<Array<{ featureName: string; enabled: boolean; rolloutPercentage: number; betaOnly: boolean }>> {
    const redis = getRedisClient();
    const keys = await redis.keys('feature_gate:*');

    const gates: Array<{ featureName: string; enabled: boolean; rolloutPercentage: number; betaOnly: boolean }> = [];

    for (const key of keys) {
      const gateData = await redis.get(key);
      if (gateData) {
        const config: FeatureGateConfig = JSON.parse(gateData);
        gates.push({
          featureName: config.featureName,
          enabled: config.enabled,
          rolloutPercentage: config.rolloutPercentage,
          betaOnly: config.betaOnly,
        });
      }
    }

    return gates;
  },
};

export default featureGate;
