// src/modules/retention-v2/economy/liveEconomyControl.service.ts — Live Economy Control Panel
// Phase-D: Operational tuning infrastructure for retention systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';


// Economy tuning parameters
export interface EconomyTuning {
  // XP multipliers
  globalXpMultiplier: number;
  trustXpMultiplier: number;
  momentumXpMultiplier: number;
  comebackXpMultiplier: number;

  // Reward pacing
  rewardPacing: 'fast' | 'balanced' | 'slow';
  dailyXpCap: number;

  // Challenge intensity
  challengeIntensity: number; // 0-100
  challengeFrequency: number; // challenges per day

  // Onboarding
  onboardingPacing: number; // 0-100
  beginnerXpBonus: number;

  // Streak
  streakForgiveness: number; // hours of grace
  streakPressureReduction: number; // 0-100

  // Fatigue
  fatigueSuppressionThreshold: number;
  burnoutProtectionLevel: number;
}

// Default tuning (production baseline)
export const DEFAULT_TUNING: EconomyTuning = {
  globalXpMultiplier: 1.0,
  trustXpMultiplier: 1.0,
  momentumXpMultiplier: 1.0,
  comebackXpMultiplier: 1.5,
  rewardPacing: 'balanced',
  dailyXpCap: 500,
  challengeIntensity: 50,
  challengeFrequency: 2,
  onboardingPacing: 70,
  beginnerXpBonus: 1.5,
  streakForgiveness: 12,
  streakPressureReduction: 0,
  fatigueSuppressionThreshold: 50,
  burnoutProtectionLevel: 30,
};

// Tuning presets for different scenarios
export const TUNING_PRESETS = {
  launch: {
    ...DEFAULT_TUNING,
    globalXpMultiplier: 1.2,
    rewardPacing: 'fast',
    beginnerXpBonus: 2.0,
  } as EconomyTuning,
  retention_focus: {
    ...DEFAULT_TUNING,
    rewardPacing: 'balanced',
    streakForgiveness: 24,
    streakPressureReduction: 30,
  } as EconomyTuning,
  prevent_burnout: {
    ...DEFAULT_TUNING,
    dailyXpCap: 300,
    challengeIntensity: 30,
    fatigueSuppressionThreshold: 30,
    burnoutProtectionLevel: 50,
  } as EconomyTuning,
  engagement_boost: {
    ...DEFAULT_TUNING,
    globalXpMultiplier: 1.3,
    rewardPacing: 'fast',
    challengeIntensity: 70,
  } as EconomyTuning,
};

const TUNING_KEYS = {
  current: 'economy:tuning:current',
  history: (version: number) => `economy:tuning:history:${version}`,
  auditLog: 'economy:tuning:audit',
  lock: 'economy:tuning:lock',
};

export const liveEconomyControl = {
  // ─── Get current tuning ─────────────────────────────────────────────────
  async getCurrentTuning(): Promise<EconomyTuning> {
    const redis = getRedisClient();
    const cached = await redis.get(TUNING_KEYS.current);

    if (cached) {
      return JSON.parse(cached) as EconomyTuning;
    }

    return DEFAULT_TUNING;
  },

  // ─── Apply tuning change ─────────────────────────────────────────────────
  async applyTuning(newTuning: Partial<EconomyTuning>, changedBy: string): Promise<EconomyTuning> {
    const redis = getRedisClient();

    // Check lock (prevent concurrent changes)
    const lockKey = TUNING_KEYS.lock;
    const isLocked = await redis.setnx(lockKey, '1');
    if (!isLocked) {
      throw new Error('Tuning is currently locked by another operation');
    }

    try {
      // Get current and merge
      const current = await this.getCurrentTuning();
      const updated = { ...current, ...newTuning };

      // Validate tuning values
      this.validateTuning(updated);

      // Store history before updating
      const version = await this.incrementVersion();
      await redis.set(
        TUNING_KEYS.history(version),
        JSON.stringify({ tuning: current, changedAt: new Date(), version }),
        'EX', 60 * 60 * 24 * 30 // 30 days
      );

      // Apply new tuning
      await redis.set(TUNING_KEYS.current, JSON.stringify(updated));

      // Audit log
      await this.logAudit('update', changedBy, newTuning);

      logger.info('[economy] Tuning updated', {
        changedBy,
        changes: Object.keys(newTuning),
        version,
      });

      return updated;
    } finally {
      await redis.del(lockKey);
    }
  },

  // ─── Apply preset ──────────────────────────────────────────────────────
  async applyPreset(presetName: keyof typeof TUNING_PRESETS, changedBy: string): Promise<EconomyTuning> {
    const preset = TUNING_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    return this.applyTuning(preset, changedBy);
  },

  // ─── Rollback to previous tuning ───────────────────────────────────────
  async rollback(changedBy: string): Promise<EconomyTuning> {
    const redis = getRedisClient();
    const current = await this.getCurrentTuning();

    // Get version number
    const versionStr = await redis.get('economy:tuning:version');
    const version = versionStr ? parseInt(versionStr, 10) : 1;

    if (version <= 1) {
      throw new Error('No previous version to rollback to');
    }

    // Get previous version
    const historyKey = TUNING_KEYS.history(version - 1);
    const historyData = await redis.get(historyKey);

    if (!historyData) {
      throw new Error('History not available for rollback');
    }

    const history = JSON.parse(historyData);
    const previousTuning = history.tuning;

    // Apply previous tuning
    await this.applyTuning(previousTuning, changedBy);

    logger.info('[economy] Tuning rolled back', { changedBy, toVersion: version - 1 });

    return previousTuning;
  },

  // ─── Get tuning history ─────────────────────────────────────────────────
  async getTuningHistory(limit: number = 10): Promise<Array<{
    version: number;
    tuning: EconomyTuning;
    changedAt: Date;
  }>> {
    const redis = getRedisClient();
    const versionStr = await redis.get('economy:tuning:version');
    const currentVersion = versionStr ? parseInt(versionStr, 10) : 1;

    const history = [];
    for (let i = Math.max(1, currentVersion - limit + 1); i <= currentVersion; i++) {
      const data = await redis.get(TUNING_KEYS.history(i));
      if (data) {
        const parsed = JSON.parse(data);
        history.push({
          version: i,
          tuning: parsed.tuning,
          changedAt: new Date(parsed.changedAt),
        });
      }
    }

    return history.reverse();
  },

  // ─── Validate tuning values ─────────────────────────────────────────────
  validateTuning(tuning: EconomyTuning): void {
    const errors: string[] = [];

    if (tuning.globalXpMultiplier < 0.5 || tuning.globalXpMultiplier > 3.0) {
      errors.push('globalXpMultiplier must be between 0.5 and 3.0');
    }
    if (tuning.dailyXpCap < 100 || tuning.dailyXpCap > 2000) {
      errors.push('dailyXpCap must be between 100 and 2000');
    }
    if (tuning.challengeIntensity < 0 || tuning.challengeIntensity > 100) {
      errors.push('challengeIntensity must be between 0 and 100');
    }
    if (tuning.fatigueSuppressionThreshold < 0 || tuning.fatigueSuppressionThreshold > 100) {
      errors.push('fatigueSuppressionThreshold must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  },

  // ─── Increment version counter ─────────────────────────────────────────
  async incrementVersion(): Promise<number> {
    const redis = getRedisClient();
    const versionStr = await redis.get('economy:tuning:version');
    const version = versionStr ? parseInt(versionStr, 10) + 1 : 1;

    await redis.set('economy:tuning:version', String(version));
    return version;
  },

  // ─── Audit logging ─────────────────────────────────────────────────────
  async logAudit(action: string, changedBy: string, changes: Record<string, unknown>): Promise<void> {
    const redis = getRedisClient();
    const logEntry = {
      action,
      changedBy,
      changes,
      timestamp: new Date().toISOString(),
    };

    await redis.lpush(TUNING_KEYS.auditLog, JSON.stringify(logEntry));
    await redis.ltrim(TUNING_KEYS.auditLog, 0, 99); // Keep last 100
  },

  // ─── Get audit log ─────────────────────────────────────────────────────
  async getAuditLog(limit: number = 20): Promise<Array<{
    action: string;
    changedBy: string;
    changes: Record<string, unknown>;
    timestamp: string;
  }>> {
    const redis = getRedisClient();
    const logs = await redis.lrange(TUNING_KEYS.auditLog, 0, limit - 1);
    return logs.map((l) => JSON.parse(l));
  },

  // ─── Get tuning for feature flag ───────────────────────────────────────
  async getTuningForExperiment(experimentId: string): Promise<EconomyTuning> {
    const tuning = await this.getCurrentTuning();

    // Would check experiment variant and apply overrides
    // For now, return current tuning
    return tuning;
  },
};

export default liveEconomyControl;