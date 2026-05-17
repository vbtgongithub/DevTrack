// src/modules/runtime-orchestration/killSwitch/killSwitch.service.ts — Global Retention Kill Switch System
// Phase-F: Operational kill switches for ALL behavioral systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type SwitchTarget =
  | 'notifications'
  | 'challenge_generation'
  | 'xp_multipliers'
  | 'adaptive_rewards'
  | 'pacing_systems'
  | 'fatigue_systems'
  | 'retention_nudges'
  | 'experiments'
  | 'behavioral_triggers'
  | 'social_competition'
  | 'goal_generation'
  | 'achievement_system'
  | 'streak_bonuses'
  | 'leaderboard_updates'
  | 'orchestration';

export type SwitchState = 'active' | 'disabled' | 'suppressed' | 'emergency';

export interface KillSwitch {
  id: string;
  target: SwitchTarget;
  name: string;
  description: string;
  state: SwitchState;
  activatedAt?: Date;
  activatedBy?: string;
  reason?: string;
  affectedUsers?: number;
}

export interface KillSwitchAudit {
  id: string;
  switchId: string;
  action: 'activated' | 'deactivated' | 'suppressed' | 'emergency_stop';
  timestamp: Date;
  activatedBy: string;
  reason: string;
  affectedSystems: SwitchTarget[];
}

const SWITCH_KEY = 'kill_switch:active';
const SWITCHES_KEY = 'kill_switches:registry';
const AUDIT_KEY = 'kill_switch:audit';
const EMERGENCY_KEY = 'kill_switch:emergency';

export const killSwitchService = {
  // ─── Get all kill switches ─────────────────────────────────────────────
  async getAllSwitches(): Promise<KillSwitch[]> {
    const redis = getRedisClient();
    const cached = await redis.get(SWITCHES_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return this.getDefaultSwitches();
  },

  // ─── Get default switch configuration ───────────────────────────────────
  getDefaultSwitches(): KillSwitch[] {
    return [
      {
        id: 'switch_notifications',
        target: 'notifications',
        name: 'Notifications Kill Switch',
        description: 'Disable all retention notifications',
        state: 'active',
      },
      {
        id: 'switch_challenges',
        target: 'challenge_generation',
        name: 'Challenge Generation Kill Switch',
        description: 'Disable new challenge generation',
        state: 'active',
      },
      {
        id: 'switch_xp_multipliers',
        target: 'xp_multipliers',
        name: 'XP Multipliers Kill Switch',
        description: 'Disable XP multiplier bonuses',
        state: 'active',
      },
      {
        id: 'switch_adaptive_rewards',
        target: 'adaptive_rewards',
        name: 'Adaptive Rewards Kill Switch',
        description: 'Disable adaptive reward scaling',
        state: 'active',
      },
      {
        id: 'switch_pacing',
        target: 'pacing_systems',
        name: 'Pacing Systems Kill Switch',
        description: 'Disable progression pacing',
        state: 'active',
      },
      {
        id: 'switch_fatigue',
        target: 'fatigue_systems',
        name: 'Fatigue Systems Kill Switch',
        description: 'Disable fatigue suppression',
        state: 'active',
      },
      {
        id: 'switch_retention_nudges',
        target: 'retention_nudges',
        name: 'Retention Nudges Kill Switch',
        description: 'Disable retention trigger nudges',
        state: 'active',
      },
      {
        id: 'switch_experiments',
        target: 'experiments',
        name: 'Experiments Kill Switch',
        description: 'Disable all feature experiments',
        state: 'active',
      },
      {
        id: 'switch_behavioral_triggers',
        target: 'behavioral_triggers',
        name: 'Behavioral Triggers Kill Switch',
        description: 'Disable automated behavioral triggers',
        state: 'active',
      },
      {
        id: 'switch_social',
        target: 'social_competition',
        name: 'Social Competition Kill Switch',
        description: 'Disable social/leaderboard features',
        state: 'active',
      },
      {
        id: 'switch_goals',
        target: 'goal_generation',
        name: 'Goal Generation Kill Switch',
        description: 'Disable goal generation',
        state: 'active',
      },
      {
        id: 'switch_achievements',
        target: 'achievement_system',
        name: 'Achievement System Kill Switch',
        description: 'Disable achievement evaluation',
        state: 'active',
      },
      {
        id: 'switch_streak_bonuses',
        target: 'streak_bonuses',
        name: 'Streak Bonuses Kill Switch',
        description: 'Disable streak bonus rewards',
        state: 'active',
      },
      {
        id: 'switch_leaderboards',
        target: 'leaderboard_updates',
        name: 'Leaderboard Updates Kill Switch',
        description: 'Disable leaderboard position updates',
        state: 'active',
      },
      {
        id: 'switch_orchestration',
        target: 'orchestration',
        name: 'Orchestration Kill Switch',
        description: 'Disable full retention orchestration',
        state: 'active',
      },
    ];
  },

  // ─── Check if target is enabled ───────────────────────────────────────
  async isEnabled(target: SwitchTarget): Promise<boolean> {
    const redis = getRedisClient();
    const disabled = await redis.sismember(SWITCH_KEY, target);

    return disabled === 0;
  },

  // ─── Activate kill switch ───────────────────────────────────────────────
  async activate(
    switchId: string,
    activatedBy: string,
    reason: string,
    target?: SwitchTarget
  ): Promise<KillSwitch | null> {
    const switches = await this.getAllSwitches();
    const switchConfig = switches.find(s => s.id === switchId);

    if (!switchConfig && !target) {
      return null;
    }

    const targetSwitch = target
      ? switches.find(s => s.target === target)
      : switchConfig;

    if (!targetSwitch) {
      return null;
    }

    targetSwitch.state = 'disabled';
    targetSwitch.activatedAt = new Date();
    targetSwitch.activatedBy = activatedBy;
    targetSwitch.reason = reason;

    // Save updated switches
    const redis = getRedisClient();
    await redis.set(SWITCHES_KEY, JSON.stringify(switches), 'EX', 86400 * 30);

    // Add to disabled set
    await redis.sadd(SWITCH_KEY, targetSwitch.target);

    // Record audit
    await this.logAudit('activated', targetSwitch.id, activatedBy, reason, [targetSwitch.target]);

    // Check if emergency
    const isEmergency = ['notifications', 'xp_multipliers', 'orchestration'].includes(targetSwitch.target);
    if (isEmergency) {
      await redis.set(EMERGENCY_KEY, 'true', 'EX', 3600);
    }

    logger.warn('[kill_switch] Activated', {
      switchId: targetSwitch.id,
      target: targetSwitch.target,
      activatedBy,
      reason,
    });

    return targetSwitch;
  },

  // ─── Deactivate kill switch ─────────────────────────────────────────────
  async deactivate(
    switchId: string,
    deactivatedBy: string,
    reason: string
  ): Promise<KillSwitch | null> {
    const switches = await this.getAllSwitches();
    const switchConfig = switches.find(s => s.id === switchId);

    if (!switchConfig) {
      return null;
    }

    switchConfig.state = 'active';
    switchConfig.activatedAt = undefined;
    switchConfig.activatedBy = undefined;
    switchConfig.reason = undefined;

    const redis = getRedisClient();
    await redis.set(SWITCHES_KEY, JSON.stringify(switches), 'EX', 86400 * 30);
    await redis.srem(SWITCH_KEY, switchConfig.target);

    await this.logAudit('deactivated', switchId, deactivatedBy, reason, [switchConfig.target]);

    logger.info('[kill_switch] Deactivated', { switchId, deactivatedBy });

    return switchConfig;
  },

  // ─── Suppress switch (soft disable) ────────────────────────────────────
  async suppress(
    switchId: string,
    suppressedBy: string,
    reason: string
  ): Promise<KillSwitch | null> {
    const switches = await this.getAllSwitches();
    const switchConfig = switches.find(s => s.id === switchId);

    if (!switchConfig) {
      return null;
    }

    switchConfig.state = 'suppressed';

    const redis = getRedisClient();
    await redis.set(SWITCHES_KEY, JSON.stringify(switches), 'EX', 86400 * 30);

    await this.logAudit('suppressed', switchId, suppressedBy, reason, [switchConfig.target]);

    return switchConfig;
  },

  // ─── Emergency stop all ─────────────────────────────────────────────────
  async emergencyStop(stoppedBy: string, reason: string): Promise<{
    stopped: number;
    systems: SwitchTarget[];
  }> {
    const switches = await this.getAllSwitches();
    const redis = getRedisClient();

    const systems: SwitchTarget[] = [];
    let stopped = 0;

    for (const s of switches) {
      if (s.state !== 'disabled') {
        s.state = 'disabled';
        s.activatedAt = new Date();
        s.activatedBy = stoppedBy;
        s.reason = reason;
        await redis.sadd(SWITCH_KEY, s.target);
        systems.push(s.target);
        stopped++;
      }
    }

    await redis.set(SWITCHES_KEY, JSON.stringify(switches), 'EX', 86400 * 30);
    await redis.set(EMERGENCY_KEY, 'true', 'EX', 3600);

    await this.logAudit('emergency_stop', 'all', stoppedBy, reason, systems);

    logger.error('[kill_switch] Emergency stop all', { stoppedBy, stopped, systems } as any);

    return { stopped, systems };
  },

  // ─── Check if emergency stop is active ──────────────────────────────────
  async isEmergencyActive(): Promise<boolean> {
    const redis = getRedisClient();
    const emergency = await redis.get(EMERGENCY_KEY);
    return emergency === 'true';
  },

  // ─── Get disabled systems ─────────────────────────────────────────────
  async getDisabledSystems(): Promise<SwitchTarget[]> {
    const redis = getRedisClient();
    const members = await redis.smembers(SWITCH_KEY);
    return members as SwitchTarget[];
  },

  // ─── Log audit entry ───────────────────────────────────────────────────
  async logAudit(
    action: string,
    switchId: string,
    activatedBy: string,
    reason: string,
    affectedSystems: SwitchTarget[]
  ): Promise<void> {
    const redis = getRedisClient();
    const entry: KillSwitchAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      switchId,
      action: action as KillSwitchAudit['action'],
      timestamp: new Date(),
      activatedBy,
      reason,
      affectedSystems,
    };

    await redis.rpush(AUDIT_KEY, JSON.stringify(entry));
    await redis.ltrim(AUDIT_KEY, -200, -1);
  },

  // ─── Get audit log ────────────────────────────────────────────────────
  async getAuditLog(limit: number = 50): Promise<KillSwitchAudit[]> {
    const redis = getRedisClient();
    const entries = await redis.lrange(AUDIT_KEY, -limit, -1);

    return entries.map(e => JSON.parse(e)).reverse();
  },

  // ─── Get kill switch summary ───────────────────────────────────────────
  async getSummary(): Promise<{
    total: number;
    active: number;
    disabled: number;
    suppressed: number;
    emergency: boolean;
  }> {
    const switches = await this.getAllSwitches();

    return {
      total: switches.length,
      active: switches.filter(s => s.state === 'active').length,
      disabled: switches.filter(s => s.state === 'disabled').length,
      suppressed: switches.filter(s => s.state === 'suppressed').length,
      emergency: await this.isEmergencyActive(),
    };
  },
};

export default killSwitchService;