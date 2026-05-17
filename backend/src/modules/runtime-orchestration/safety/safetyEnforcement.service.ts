// src/modules/runtime-orchestration/safety/safetyEnforcement.service.ts — Safe Behavioral Execution System
// Phase-F: Safeguards against engagement overload and emotional exhaustion

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type SafetyPolicy =
  | 'notification_rate_limit'
  | 'reward_pacing'
  | 'emotional_saturation'
  | 'fatigue_escalation'
  | 'progression_cap'
  | 'cooldown_enforcement'
  | 'anti_addiction';

export interface SafetyViolation {
  id: string;
  userId: string;
  policy: SafetyPolicy;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolved: boolean;
  resolution?: string;
}

export interface SafetyState {
  userId: string;
  notificationRate: number;
  rewardPacing: number;
  emotionalSaturation: number;
  fatigueLevel: number;
  cooldownStatus: string;
  overallSafety: 'safe' | 'warning' | 'danger';
}

const SAFETY_VIOLATIONS_KEY = 'safety:violations';
const SAFETY_STATE_KEY_PREFIX = 'safety:state:';
const POLICIES_KEY = 'safety:policies';

export const safetyEnforcement = {
  // ─── Evaluate safety for user ─────────────────────────────────────────
  async evaluateSafety(userId: string): Promise<SafetyState> {
    const redis = getRedisClient();

    const [notificationRate, rewardPacing, emotionalSaturation, fatigueLevel, cooldownStatus] = await Promise.all([
      this.getNotificationRate(userId),
      this.getRewardPacing(userId),
      this.getEmotionalSaturation(userId),
      this.getFatigueLevel(userId),
      this.getCooldownStatus(userId),
    ]);

    const overallSafety = this.calculateOverallSafety({
      notificationRate,
      rewardPacing,
      emotionalSaturation,
      fatigueLevel,
    });

    const state: SafetyState = {
      userId,
      notificationRate,
      rewardPacing,
      emotionalSaturation,
      fatigueLevel,
      cooldownStatus,
      overallSafety,
    };

    // Cache state
    await redis.set(SAFETY_STATE_KEY_PREFIX + userId, JSON.stringify(state), 'EX', 300);

    return state;
  },

  // ─── Get notification rate ─────────────────────────────────────────────
  async getNotificationRate(userId: string): Promise<number> {
    const redis = getRedisClient();
    const key = `user:${userId}:notifications:last_24h`;
    const count = await redis.get(key);

    return count ? parseInt(count, 10) : 0;
  },

  // ─── Get reward pacing ────────────────────────────────────────────────
  async getRewardPacing(userId: string): Promise<number> {
    const redis = getRedisClient();
    const key = `user:${userId}:rewards:last_24h`;
    const count = await redis.get(key);

    return count ? parseInt(count, 10) : 0;
  },

  // ─── Get emotional saturation ─────────────────────────────────────────
  async getEmotionalSaturation(userId: string): Promise<number> {
    const redis = getRedisClient();
    const key = `user:${userId}:emotional_saturation`;
    const saturation = await redis.get(key);

    return saturation ? parseInt(saturation, 10) : 30;
  },

  // ─── Get fatigue level ────────────────────────────────────────────────
  async getFatigueLevel(userId: string): Promise<number> {
    const redis = getRedisClient();
    const key = `user:${userId}:fatigue`;
    const level = await redis.get(key);

    return level ? parseInt(level, 10) : 20;
  },

  // ─── Get cooldown status ───────────────────────────────────────────────
  async getCooldownStatus(userId: string): Promise<string> {
    const redis = getRedisClient();
    const key = `user:${userId}:cooldown`;
    const status = await redis.get(key);

    return status || 'inactive';
  },

  // ─── Calculate overall safety ─────────────────────────────────────────
  calculateOverallSafety(state: {
    notificationRate: number;
    rewardPacing: number;
    emotionalSaturation: number;
    fatigueLevel: number;
  }): 'safe' | 'warning' | 'danger' {
    const dangerScore =
      (state.notificationRate > 50 ? 1 : 0) +
      (state.rewardPacing > 30 ? 1 : 0) +
      (state.emotionalSaturation > 70 ? 1 : 0) +
      (state.fatigueLevel > 70 ? 1 : 0);

    if (dangerScore >= 3) return 'danger';
    if (dangerScore >= 1) return 'warning';
    return 'safe';
  },

  // ─── Enforce safety policies ─────────────────────────────────────────
  async enforcePolicies(userId: string): Promise<{
    enforced: string[];
    suppressed: string[];
  }> {
    const state = await this.evaluateSafety(userId);
    const enforced: string[] = [];
    const suppressed: string[] = [];

    // Check notification rate limit
    if (state.notificationRate > 50) {
      suppressed.push('notifications');
      enforced.push('notification_rate_limit');
    }

    // Check reward pacing
    if (state.rewardPacing > 30) {
      suppressed.push('rewards');
      enforced.push('reward_pacing');
    }

    // Check emotional saturation
    if (state.emotionalSaturation > 70) {
      suppressed.push('challenges');
      suppressed.push('goals');
      enforced.push('emotional_saturation');
    }

    // Check fatigue escalation
    if (state.fatigueLevel > 70) {
      suppressed.push('notifications');
      suppressed.push('challenges');
      suppressed.push('retention_nudges');
      enforced.push('fatigue_escalation');
    }

    // Apply cooldowns
    if (state.cooldownStatus !== 'inactive') {
      await this.applyCooldown(userId, enforced);
    }

    if (enforced.length > 0) {
      await this.recordViolations(userId, enforced, state);
    }

    return { enforced, suppressed };
  },

  // ─── Apply cooldown ───────────────────────────────────────────────────
  async applyCooldown(userId: string, policies: string[]): Promise<void> {
    const redis = getRedisClient();
    const cooldownKey = `user:${userId}:cooldown`;

    const cooldownTypes: Record<string, number> = {
      notification_rate_limit: 3600000,
      reward_pacing: 7200000,
      emotional_saturation: 14400000,
      fatigue_escalation: 21600000,
    };

    const maxCooldown = Math.max(...policies.map(p => cooldownTypes[p] || 3600000));

    await redis.set(cooldownKey, 'active', 'PX', maxCooldown);
  },

  // ─── Record safety violations ─────────────────────────────────────────
  async recordViolations(userId: string, policies: string[], state: SafetyState): Promise<void> {
    const redis = getRedisClient();

    for (const policy of policies) {
      const violation: SafetyViolation = {
        id: `violation_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId,
        policy: policy as SafetyPolicy,
        severity: state.overallSafety === 'danger' ? 'high' : 'medium',
        description: `Safety policy triggered: ${policy}`,
        detectedAt: new Date(),
        resolved: false,
      };

      await redis.rpush(SAFETY_VIOLATIONS_KEY, JSON.stringify(violation));
    }
  },

  // ─── Get active safety policies ───────────────────────────────────────
  async getPolicies(): Promise<Record<SafetyPolicy, { active: boolean; threshold: number }>> {
    const redis = getRedisClient();
    const cached = await redis.get(POLICIES_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.getDefaultPolicies();
  },

  // ─── Get default policies ──────────────────────────────────────────────
  getDefaultPolicies(): Record<SafetyPolicy, { active: boolean; threshold: number }> {
    return {
      notification_rate_limit: { active: true, threshold: 50 },
      reward_pacing: { active: true, threshold: 30 },
      emotional_saturation: { active: true, threshold: 70 },
      fatigue_escalation: { active: true, threshold: 70 },
      progression_cap: { active: true, threshold: 10000 },
      cooldown_enforcement: { active: true, threshold: 1 },
      anti_addiction: { active: true, threshold: 1 },
    };
  },

  // ─── Update policy threshold ───────────────────────────────────────────
  async updatePolicyThreshold(policy: SafetyPolicy, threshold: number): Promise<void> {
    const policies = await this.getPolicies();
    policies[policy].threshold = threshold;

    const redis = getRedisClient();
    await redis.set(POLICIES_KEY, JSON.stringify(policies), 'EX', 86400 * 30);

    logger.info('[safety] Policy threshold updated', { policy, threshold });
  },

  // ─── Get recent violations ─────────────────────────────────────────────
  async getRecentViolations(hours: number = 24): Promise<SafetyViolation[]> {
    const redis = getRedisClient();
    const violations = await redis.lrange(SAFETY_VIOLATIONS_KEY, 0, 99);

    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    return violations
      .map(v => JSON.parse(v))
      .filter(v => new Date(v.detectedAt).getTime() > cutoff);
  },

  // ─── Resolve violation ────────────────────────────────────────────────
  async resolveViolation(violationId: string, resolution: string): Promise<boolean> {
    const redis = getRedisClient();
    const violations = await redis.lrange(SAFETY_VIOLATIONS_KEY, 0, -1);

    for (let i = 0; i < violations.length; i++) {
      const violation: SafetyViolation = JSON.parse(violations[i]);
      if (violation.id === violationId) {
        violation.resolved = true;
        violation.resolution = resolution;
        violations[i] = JSON.stringify(violation);
        await redis.del(SAFETY_VIOLATIONS_KEY);
        for (const v of violations) {
          await redis.rpush(SAFETY_VIOLATIONS_KEY, v);
        }
        return true;
      }
    }

    return false;
  },

  // ─── Get safety dashboard ─────────────────────────────────────────────
  async getSafetyDashboard(): Promise<{
    totalViolations: number;
    activeUsers: number;
    warningUsers: number;
    dangerUsers: number;
    policies: Record<SafetyPolicy, { active: boolean; threshold: number }>;
  }> {
    const violations = await this.getRecentViolations(24);
    const policies = await this.getPolicies();

    return {
      totalViolations: violations.filter(v => !v.resolved).length,
      activeUsers: 0,
      warningUsers: 0,
      dangerUsers: 0,
      policies,
    };
  },
};

export default safetyEnforcement;