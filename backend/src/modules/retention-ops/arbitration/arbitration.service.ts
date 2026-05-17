// src/modules/retention-ops/arbitration/arbitration.service.ts — Adaptive System Arbitration Engine
// Phase-E: Coordinate all adaptive systems coherently

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type AdaptiveSystem = 'goals' | 'challenges' | 'achievements' | 'notifications' | 'onboarding' | 'rewards' | 'comeback' | 'fatigue' | 'economy';
export type AdaptationAction = 'increase' | 'decrease' | 'maintain' | 'pause' | 'resume' | 'reset';

export interface SystemState {
  system: AdaptiveSystem;
  currentLevel: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastAdjusted: Date;
  adjustmentCount: number;
}

export interface ConflictResolution {
  source: AdaptiveSystem;
  target: AdaptiveSystem;
  conflictType: 'timing' | 'intensity' | 'reward' | 'pressure';
  resolution: 'prioritize_source' | 'prioritize_target' | 'compromise' | 'delay';
  appliedAt: Date;
}

export interface ArbitrationDecision {
  id: string;
  system: AdaptiveSystem;
  action: AdaptationAction;
  magnitude: number;
  reason: string;
  conflictsResolved: ConflictResolution[];
  appliedAt: Date;
}

const STATE_KEY_PREFIX = 'arbitration:system:';
const DECISION_KEY = 'arbitration:decisions:latest';
const CONFLICT_KEY = 'arbitration:conflicts';

export const arbitrationService = {
  // ─── Get all system states ───────────────────────────────────────────────
  async getSystemStates(): Promise<Record<AdaptiveSystem, SystemState>> {
    const redis = getRedisClient();
    const states: Record<AdaptiveSystem, SystemState> = {} as Record<AdaptiveSystem, SystemState>;
    const systems: AdaptiveSystem[] = ['goals', 'challenges', 'achievements', 'notifications', 'onboarding', 'rewards', 'comeback', 'fatigue', 'economy'];

    for (const system of systems) {
      const key = STATE_KEY_PREFIX + system;
      const cached = await redis.get(key);

      if (cached) {
        states[system] = JSON.parse(cached);
      } else {
        states[system] = {
          system,
          currentLevel: 50,
          trend: 'stable',
          lastAdjusted: new Date(),
          adjustmentCount: 0,
        };
      }
    }

    return states;
  },

  // ─── Update system state ───────────────────────────────────────────────
  async updateSystemState(system: AdaptiveSystem, level: number, trend: 'increasing' | 'decreasing' | 'stable'): Promise<void> {
    const redis = getRedisClient();
    const key = STATE_KEY_PREFIX + system;

    let state: SystemState;
    const cached = await redis.get(key);

    if (cached) {
      state = JSON.parse(cached);
    } else {
      state = {
        system,
        currentLevel: 50,
        trend: 'stable',
        lastAdjusted: new Date(),
        adjustmentCount: 0,
      };
    }

    state.currentLevel = level;
    state.trend = trend;
    state.lastAdjusted = new Date();
    state.adjustmentCount += 1;

    await redis.set(key, JSON.stringify(state), 'EX', 86400 * 7);

    logger.info('[arbitration] System state updated', { system, level, trend });
  },

  // ─── Detect conflicts between systems ───────────────────────────────────
  async detectConflicts(): Promise<ConflictResolution[]> {
    const states = await this.getSystemStates();
    const conflicts: ConflictResolution[] = [];

    if (states.notifications.currentLevel > 70 && states.goals.currentLevel > 70) {
      conflicts.push({
        source: 'notifications',
        target: 'goals',
        conflictType: 'intensity',
        resolution: 'prioritize_target',
        appliedAt: new Date(),
      });
    }

    if (states.challenges.currentLevel > 75 && states.economy.currentLevel > 75) {
      conflicts.push({
        source: 'challenges',
        target: 'economy',
        conflictType: 'reward',
        resolution: 'compromise',
        appliedAt: new Date(),
      });
    }

    if (states.onboarding.currentLevel > 60 && states.fatigue.currentLevel > 60) {
      conflicts.push({
        source: 'onboarding',
        target: 'fatigue',
        conflictType: 'intensity',
        resolution: 'prioritize_target',
        appliedAt: new Date(),
      });
    }

    if (states.rewards.currentLevel > 80 && states.challenges.currentLevel > 80) {
      conflicts.push({
        source: 'rewards',
        target: 'challenges',
        conflictType: 'timing',
        resolution: 'delay',
        appliedAt: new Date(),
      });
    }

    if (states.comeback.currentLevel > 70 && states.notifications.currentLevel > 50) {
      conflicts.push({
        source: 'comeback',
        target: 'notifications',
        conflictType: 'pressure',
        resolution: 'prioritize_source',
        appliedAt: new Date(),
      });
    }

    if (conflicts.length > 0) {
      await this.storeConflicts(conflicts);
    }

    return conflicts;
  },

  // ─── Store conflicts ────────────────────────────────────────────────────
  async storeConflicts(conflicts: ConflictResolution[]): Promise<void> {
    const redis = getRedisClient();
    const existing = await redis.lrange(CONFLICT_KEY, 0, 99);
    const existingParsed = existing.map((c: string) => JSON.parse(c));

    const allConflicts = [...existingParsed, ...conflicts].slice(-100);

    await redis.del(CONFLICT_KEY);
    for (const conflict of allConflicts) {
      await redis.rpush(CONFLICT_KEY, JSON.stringify(conflict));
    }
    await redis.expire(CONFLICT_KEY, 86400 * 30);
  },

  // ─── Make arbitration decision ─────────────────────────────────────────
  async makeDecision(system: AdaptiveSystem, action: AdaptationAction, magnitude: number, reason: string): Promise<ArbitrationDecision> {
    const conflicts = await this.detectConflicts();
    const filteredConflicts = conflicts.filter((c: ConflictResolution) => c.source === system || c.target === system);

    const decision: ArbitrationDecision = {
      id: `decision_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      system,
      action,
      magnitude,
      reason,
      conflictsResolved: filteredConflicts,
      appliedAt: new Date(),
    };

    const redis = getRedisClient();
    await redis.rpush(DECISION_KEY, JSON.stringify(decision));
    await redis.expire(DECISION_KEY, 86400 * 7);

    await this.updateSystemState(system, this.applyActionMagnitude(system, action, magnitude), this.actionToTrend(action));

    logger.info('[arbitration] Decision made', { system, action, magnitude, reason });

    return decision;
  },

  // ─── Apply action magnitude to system level ────────────────────────────
  applyActionMagnitude(system: AdaptiveSystem, action: AdaptationAction, magnitude: number): number {
    const states = this.getSystemStatesSync();

    if (action === 'increase') return Math.min(100, (states[system]?.currentLevel || 50) + magnitude);
    if (action === 'decrease') return Math.max(0, (states[system]?.currentLevel || 50) - magnitude);
    if (action === 'pause') return 0;
    if (action === 'resume') return 50;
    if (action === 'reset') return 50;

    return states[system]?.currentLevel || 50;
  },

  // ─── Convert action to trend ───────────────────────────────────────────
  actionToTrend(action: AdaptationAction): 'increasing' | 'decreasing' | 'stable' {
    if (action === 'increase' || action === 'resume') return 'increasing';
    if (action === 'decrease' || action === 'pause') return 'decreasing';
    return 'stable';
  },

  // ─── Get system states sync (cached) ──────────────────────────────────
  getSystemStatesSync(): Partial<Record<AdaptiveSystem, SystemState>> {
    return {};
  },

  // ─── Get recent decisions ───────────────────────────────────────────────
  async getRecentDecisions(limit: number = 10): Promise<ArbitrationDecision[]> {
    const redis = getRedisClient();
    const decisions = await redis.lrange(DECISION_KEY, -limit, -1);

    return decisions.map((d: string) => JSON.parse(d)).reverse();
  },

  // ─── Get conflict history ───────────────────────────────────────────────
  async getConflictHistory(days: number = 7): Promise<ConflictResolution[]> {
    const redis = getRedisClient();
    const conflicts = await redis.lrange(CONFLICT_KEY, 0, -1);

    const sevenDaysAgo = Date.now() - days * 24 * 60 * 60 * 1000;
    return conflicts
      .map((c: string) => JSON.parse(c))
      .filter((c: any) => new Date(c.appliedAt).getTime() > sevenDaysAgo);
  },

  // ─── Get orchestration recommendation ─────────────────────────────────
  async getOrchestrationRecommendation(): Promise<{
    priority: AdaptiveSystem[];
    actions: Array<{ system: AdaptiveSystem; action: AdaptationAction; reason: string }>;
  }> {
    const states = await this.getSystemStates();
    const actions: Array<{ system: AdaptiveSystem; action: AdaptationAction; reason: string }> = [];
    const priority: AdaptiveSystem[] = [];

    if (states.fatigue.currentLevel > 75) {
      actions.push({ system: 'fatigue', action: 'increase', reason: 'High fatigue detected' });
      priority.push('fatigue');
    }

    if (states.notifications.currentLevel > 70) {
      actions.push({ system: 'notifications', action: 'decrease', reason: 'Notification pressure high' });
      priority.push('notifications');
    }

    if (states.goals.currentLevel > 80) {
      actions.push({ system: 'goals', action: 'decrease', reason: 'Goal intensity too high' });
      priority.push('goals');
    }

    if (states.onboarding.currentLevel > 60) {
      actions.push({ system: 'onboarding', action: 'decrease', reason: 'Onboarding friction detected' });
      priority.push('onboarding');
    }

    if (states.economy.currentLevel < 30) {
      actions.push({ system: 'economy', action: 'increase', reason: 'Economy too restrictive' });
      priority.push('economy');
    }

    return { priority, actions };
  },

  // ─── Resolve conflict automatically ────────────────────────────────────
  async resolveConflict(source: AdaptiveSystem, target: AdaptiveSystem, conflictType: ConflictResolution['conflictType']): Promise<ConflictResolution> {
    const states = await this.getSystemStates();

    const resolution: ConflictResolution = {
      source,
      target,
      conflictType,
      resolution: 'compromise',
      appliedAt: new Date(),
    };

    if (conflictType === 'intensity') {
      if (states[source].currentLevel > states[target].currentLevel) {
        resolution.resolution = 'prioritize_target';
      } else {
        resolution.resolution = 'prioritize_source';
      }
    }

    if (conflictType === 'reward') {
      resolution.resolution = 'compromise';
    }

    if (conflictType === 'pressure') {
      if (target === 'fatigue') {
        resolution.resolution = 'prioritize_target';
      } else {
        resolution.resolution = 'compromise';
      }
    }

    await this.makeDecision(source, 'maintain', 0, `Resolved conflict with ${target}: ${resolution.resolution}`);

    return resolution;
  },
};

export default arbitrationService;