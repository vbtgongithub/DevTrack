// src/modules/runtime-orchestration/activation/activationFramework.service.ts — Progressive Activation Framework
// Phase-F: Feature-gated retention activation with staged rollout

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type ActivationLevel = 0 | 1 | 2 | 3 | 4;
export type ActivationStatus = 'pending' | 'rolling_out' | 'active' | 'rolling_back' | 'disabled';

export interface FeatureActivation {
  featureId: string;
  name: string;
  level: ActivationLevel;
  status: ActivationStatus;
  rolloutPercent: number;
  trustThreshold: number;
  cooldownMs: number;
}

export interface ActivationTransition {
  id: string;
  userId: string;
  fromLevel: ActivationLevel;
  toLevel: ActivationLevel;
  triggeredBy: string;
  timestamp: Date;
  successful: boolean;
}

export interface CohortAllocation {
  cohortId: string;
  level: ActivationLevel;
  userIds: string[];
  allocatedAt: Date;
}

const LEVEL_FEATURES: Record<ActivationLevel, string[]> = {
  0: ['xp_system', 'streak_system'],
  1: ['goals', 'basic_achievements'],
  2: ['challenges', 'retention_nudges', 'notification_arbitration'],
  3: ['adaptive_progression', 'momentum_systems'],
  4: ['behavioral_intelligence', 'emotional_pacing', 'advanced_orchestration'],
};

const ACTIVATION_KEY = 'activation:features';
const USER_LEVELS_KEY = 'activation:user_levels';
const COHORT_KEY = 'activation:cohorts';
const TRANSITIONS_KEY = 'activation:transitions';
const AUDIT_KEY = 'activation:audit';

export const activationFramework = {
  // ─── Get feature activation configuration ───────────────────────────────
  async getFeatureConfig(): Promise<Record<string, FeatureActivation>> {
    const redis = getRedisClient();
    const cached = await redis.get(ACTIVATION_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.getDefaultConfig();
  },

  // ─── Get default activation configuration ─────────────────────────────
  getDefaultConfig(): Record<string, FeatureActivation> {
    return {
      xp_system: {
        featureId: 'xp_system',
        name: 'XP System',
        level: 0,
        status: 'active',
        rolloutPercent: 100,
        trustThreshold: 0,
        cooldownMs: 0,
      },
      streak_system: {
        featureId: 'streak_system',
        name: 'Streak System',
        level: 0,
        status: 'active',
        rolloutPercent: 100,
        trustThreshold: 0,
        cooldownMs: 0,
      },
      goals: {
        featureId: 'goals',
        name: 'Goal System',
        level: 1,
        status: 'rolling_out',
        rolloutPercent: 50,
        trustThreshold: 50,
        cooldownMs: 86400000,
      },
      basic_achievements: {
        featureId: 'basic_achievements',
        name: 'Basic Achievements',
        level: 1,
        status: 'rolling_out',
        rolloutPercent: 50,
        trustThreshold: 50,
        cooldownMs: 86400000,
      },
      challenges: {
        featureId: 'challenges',
        name: 'Challenge System',
        level: 2,
        status: 'rolling_out',
        rolloutPercent: 25,
        trustThreshold: 70,
        cooldownMs: 172800000,
      },
      retention_nudges: {
        featureId: 'retention_nudges',
        name: 'Retention Nudges',
        level: 2,
        status: 'rolling_out',
        rolloutPercent: 25,
        trustThreshold: 70,
        cooldownMs: 172800000,
      },
      adaptive_progression: {
        featureId: 'adaptive_progression',
        name: 'Adaptive Progression',
        level: 3,
        status: 'pending',
        rolloutPercent: 10,
        trustThreshold: 80,
        cooldownMs: 604800000,
      },
      momentum_systems: {
        featureId: 'momentum_systems',
        name: 'Momentum Systems',
        level: 3,
        status: 'pending',
        rolloutPercent: 10,
        trustThreshold: 80,
        cooldownMs: 604800000,
      },
      behavioral_intelligence: {
        featureId: 'behavioral_intelligence',
        name: 'Behavioral Intelligence',
        level: 4,
        status: 'pending',
        rolloutPercent: 5,
        trustThreshold: 90,
        cooldownMs: 2592000000,
      },
      emotional_pacing: {
        featureId: 'emotional_pacing',
        name: 'Emotional Pacing',
        level: 4,
        status: 'pending',
        rolloutPercent: 5,
        trustThreshold: 90,
        cooldownMs: 2592000000,
      },
    };
  },

  // ─── Get user activation level ────────────────────────────────────────
  async getUserActivationLevel(userId: string): Promise<ActivationLevel> {
    const redis = getRedisClient();
    const level = await redis.hget(USER_LEVELS_KEY, userId);

    if (level) {
      return parseInt(level, 10) as ActivationLevel;
    }

    return 0;
  },

  // ─── Set user activation level ────────────────────────────────────────
  async setUserActivationLevel(
    userId: string,
    level: ActivationLevel,
    triggeredBy: string
  ): Promise<void> {
    const redis = getRedisClient();
    const oldLevel = await this.getUserActivationLevel(userId);

    await redis.hset(USER_LEVELS_KEY, userId, String(level));

    // Record transition
    const transition: ActivationTransition = {
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      fromLevel: oldLevel,
      toLevel: level,
      triggeredBy,
      timestamp: new Date(),
      successful: true,
    };

    await redis.rpush(TRANSITIONS_KEY, JSON.stringify(transition));

    logger.info('[activation] User level updated', { userId, oldLevel, newLevel: level, triggeredBy });
  },

  // ─── Check if feature is active for user ──────────────────────────────
  async isFeatureActive(userId: string, featureId: string): Promise<boolean> {
    const config = await this.getFeatureConfig();
    const feature = config[featureId];

    if (!feature || feature.status === 'disabled') {
      return false;
    }

    const userLevel = await this.getUserActivationLevel(userId);
    if (userLevel < feature.level) {
      return false;
    }

    if (feature.rolloutPercent < 100) {
      const trustScore = await this.getUserTrustScore(userId);
      if (trustScore < feature.trustThreshold) {
        return false;
      }

      // Check rollout percentage
      const hash = this.hashUserId(userId);
      const bucket = hash % 100;
      if (bucket >= feature.rolloutPercent) {
        return false;
      }
    }

    return true;
  },

  // ─── Get user trust score ─────────────────────────────────────────────
  async getUserTrustScore(userId: string): Promise<number> {
    const redis = getRedisClient();
    const score = await redis.hget('trust:scores', userId);
    return score ? parseFloat(score) : 100;
  },

  // ─── Hash user ID to bucket ───────────────────────────────────────────
  hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  },

  // ─── Get features available at level ───────────────────────────────────
  getFeaturesAtLevel(level: ActivationLevel): string[] {
    return LEVEL_FEATURES[level] || [];
  },

  // ─── Update feature rollout ───────────────────────────────────────────
  async updateFeatureRollout(
    featureId: string,
    rolloutPercent: number,
    updatedBy: string
  ): Promise<boolean> {
    const config = await this.getFeatureConfig();
    const feature = config[featureId];

    if (!feature) {
      return false;
    }

    feature.rolloutPercent = rolloutPercent;
    if (rolloutPercent === 0) {
      feature.status = 'disabled';
    } else if (rolloutPercent === 100) {
      feature.status = 'active';
    } else {
      feature.status = 'rolling_out';
    }

    const redis = getRedisClient();
    await redis.set(ACTIVATION_KEY, JSON.stringify(config), 'EX', 86400 * 30);

    await this.logAudit('rollout_update', { featureId, rolloutPercent, updatedBy });

    return true;
  },

  // ─── Update feature status ─────────────────────────────────────────────
  async updateFeatureStatus(
    featureId: string,
    status: ActivationStatus,
    updatedBy: string
  ): Promise<boolean> {
    const config = await this.getFeatureConfig();
    const feature = config[featureId];

    if (!feature) {
      return false;
    }

    feature.status = status;

    const redis = getRedisClient();
    await redis.set(ACTIVATION_KEY, JSON.stringify(config), 'EX', 86400 * 30);

    await this.logAudit('status_update', { featureId, status, updatedBy });

    logger.info('[activation] Feature status updated', { featureId, status, updatedBy });

    return true;
  },

  // ─── Assign user to cohort ─────────────────────────────────────────────
  async assignUserToCohort(userId: string, cohortId: string): Promise<void> {
    const redis = getRedisClient();
    const cohortKey = `${COHORT_KEY}:${cohortId}`;

    await redis.sadd(cohortKey, userId);
  },

  // ─── Get user cohort ──────────────────────────────────────────────────
  async getUserCohort(userId: string): Promise<string | null> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${COHORT_KEY}:*`);

    for (const key of keys) {
      const isMember = await redis.sismember(key, userId);
      if (isMember) {
        return key.split(':').pop() || null;
      }
    }

    return null;
  },

  // ─── Rollback user activation level ───────────────────────────────────
  async rollbackUserLevel(userId: string, triggeredBy: string): Promise<void> {
    const currentLevel = await this.getUserActivationLevel(userId);
    const newLevel = Math.max(0, currentLevel - 1) as ActivationLevel;

    await this.setUserActivationLevel(userId, newLevel, triggeredBy);

    await this.logAudit('rollback', { userId, fromLevel: currentLevel, toLevel: newLevel, triggeredBy });
  },

  // ─── Get activation audit log ─────────────────────────────────────────
  async getAuditLog(limit: number = 50): Promise<Array<{ timestamp: Date; action: string; details: Record<string, unknown> }>> {
    const redis = getRedisClient();
    const entries = await redis.lrange(AUDIT_KEY, -limit, -1);

    return entries.map(e => JSON.parse(e)).reverse();
  },

  // ─── Log audit entry ──────────────────────────────────────────────────
  async logAudit(action: string, details: Record<string, unknown>): Promise<void> {
    const redis = getRedisClient();
    const entry = {
      timestamp: new Date(),
      action,
      details,
    };

    await redis.rpush(AUDIT_KEY, JSON.stringify(entry));
    await redis.ltrim(AUDIT_KEY, -100, -1);
  },

  // ─── Get activation summary ───────────────────────────────────────────
  async getActivationSummary(): Promise<{
    levelDistribution: Record<ActivationLevel, number>;
    featureStatus: Record<string, ActivationStatus>;
    pendingRollouts: string[];
  }> {
    const redis = getRedisClient();
    const userLevels = await redis.hgetall(USER_LEVELS_KEY);

    const levelDistribution: Record<ActivationLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const level of Object.values(userLevels)) {
      const l = parseInt(level, 10) as ActivationLevel;
      levelDistribution[l] = (levelDistribution[l] || 0) + 1;
    }

    const config = await this.getFeatureConfig();
    const featureStatus: Record<string, ActivationStatus> = {};
    const pendingRollouts: string[] = [];

    for (const [id, feature] of Object.entries(config)) {
      featureStatus[id] = feature.status;
      if (feature.status === 'rolling_out') {
        pendingRollouts.push(id);
      }
    }

    return { levelDistribution, featureStatus, pendingRollouts };
  },

  // ─── Emergency rollback all users ─────────────────────────────────────
  async emergencyRollback(level: ActivationLevel, triggeredBy: string): Promise<number> {
    const redis = getRedisClient();
    const userLevels = await redis.hgetall(USER_LEVELS_KEY);

    let rolledBack = 0;
    for (const [userId, currentLevel] of Object.entries(userLevels)) {
      if (parseInt(currentLevel, 10) > level) {
        await this.setUserActivationLevel(userId, level, triggeredBy);
        rolledBack++;
      }
    }

    await this.logAudit('emergency_rollback', { toLevel: level, triggeredBy, usersAffected: rolledBack });

    logger.warn('[activation] Emergency rollback executed', { toLevel: level, usersAffected: rolledBack });

    return rolledBack;
  },
};

export default activationFramework;