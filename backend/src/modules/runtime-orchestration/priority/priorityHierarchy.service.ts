// src/modules/runtime-orchestration/priority/priorityHierarchy.service.ts — Behavioral Priority Hierarchy System
// Phase-F: Global behavioral hierarchy and runtime arbitration

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export type SystemPriority = 0 | 1 | 2 | 3 | 4 | 5;
export type BehavioralSystem =
  | 'safety'
  | 'fatigue_suppression'
  | 'xp_system'
  | 'streak_system'
  | 'goals'
  | 'challenges'
  | 'achievements'
  | 'notifications'
  | 'experiments'
  | 'leaderboards'
  | 'retention_triggers'
  | 'pacing';

export interface PriorityRule {
  id: string;
  sourceSystem: BehavioralSystem;
  targetSystem: BehavioralSystem;
  action: 'suppress' | 'delay' | 'reduce' | 'block';
  condition: string;
  cooldownMs: number;
  active: boolean;
}

export interface PriorityViolation {
  id: string;
  timestamp: Date;
  higherPriority: BehavioralSystem;
  lowerPriority: BehavioralSystem;
  action: string;
  resolved: boolean;
}

const SYSTEM_PRIORITIES: Record<BehavioralSystem, SystemPriority> = {
  safety: 0,
  fatigue_suppression: 1,
  xp_system: 2,
  streak_system: 2,
  goals: 3,
  challenges: 3,
  achievements: 3,
  notifications: 4,
  experiments: 5,
  leaderboards: 4,
  retention_triggers: 3,
  pacing: 2,
};

const PRIORITY_KEY = 'priority:hierarchy';
const VIOLATIONS_KEY = 'priority:violations';
const COOLDOWN_KEY_PREFIX = 'priority:cooldown:';

export const priorityHierarchy = {
  // ─── Get system priority ────────────────────────────────────────────────
  getSystemPriority(system: BehavioralSystem): SystemPriority {
    return SYSTEM_PRIORITIES[system] ?? 5;
  },

  // ─── Check if higher priority can suppress lower ────────────────────────
  async canSuppress(higher: BehavioralSystem, lower: BehavioralSystem): Promise<{
    allowed: boolean;
    reason: string;
    cooldownRemaining: number;
  }> {
    const higherPriority = this.getSystemPriority(higher);
    const lowerPriority = this.getSystemPriority(lower);

    if (higherPriority >= lowerPriority) {
      return {
        allowed: false,
        reason: 'Higher or equal priority cannot suppress lower',
        cooldownRemaining: 0,
      };
    }

    const redis = getRedisClient();
    const cooldownKey = COOLDOWN_KEY_PREFIX + higher + ':' + lower;
    const lastAction = await redis.get(cooldownKey);

    if (lastAction) {
      const lastTime = parseInt(lastAction, 10);
      const cooldownMs = 60000; // 1 minute cooldown
      const remaining = Math.max(0, cooldownMs - (Date.now() - lastTime));

      if (remaining > 0) {
        return {
          allowed: false,
          reason: 'Cooldown period active',
          cooldownRemaining: remaining,
        };
      }
    }

    return {
      allowed: true,
      reason: 'Suppression allowed',
      cooldownRemaining: 0,
    };
  },

  // ─── Execute suppression action ────────────────────────────────────────
  async executeSuppression(
    higher: BehavioralSystem,
    lower: BehavioralSystem,
    action: 'suppress' | 'delay' | 'reduce' | 'block'
  ): Promise<boolean> {
    const canSuppress = await this.canSuppress(higher, lower);

    if (!canSuppress.allowed) {
      logger.debug('[priority] Suppression denied', {
        higher,
        lower,
        reason: canSuppress.reason,
      });
      return false;
    }

    const redis = getRedisClient();
    const cooldownKey = COOLDOWN_KEY_PREFIX + higher + ':' + lower;
    await redis.set(cooldownKey, String(Date.now()), 'EX', 60);

    logger.info('[priority] Suppression executed', {
      higher,
      lower,
      action,
    });

    return true;
  },

  // ─── Get all active priority rules ─────────────────────────────────────
  async getPriorityRules(): Promise<PriorityRule[]> {
    const redis = getRedisClient();
    const rulesJson = await redis.get(PRIORITY_KEY);

    if (!rulesJson) {
      return this.getDefaultRules();
    }

    return JSON.parse(rulesJson);
  },

  // ─── Get default priority rules ─────────────────────────────────────────
  getDefaultRules(): PriorityRule[] {
    return [
      {
        id: 'rule_1',
        sourceSystem: 'fatigue_suppression',
        targetSystem: 'notifications',
        action: 'suppress',
        condition: 'fatigue_level > 70',
        cooldownMs: 300000,
        active: true,
      },
      {
        id: 'rule_2',
        sourceSystem: 'fatigue_suppression',
        targetSystem: 'challenges',
        action: 'delay',
        condition: 'fatigue_level > 60',
        cooldownMs: 600000,
        active: true,
      },
      {
        id: 'rule_3',
        sourceSystem: 'safety',
        targetSystem: 'xp_system',
        action: 'block',
        condition: 'trust_score < 30',
        cooldownMs: 0,
        active: true,
      },
      {
        id: 'rule_4',
        sourceSystem: 'fatigue_suppression',
        targetSystem: 'experiments',
        action: 'suppress',
        condition: 'fatigue_level > 80',
        cooldownMs: 3600000,
        active: true,
      },
      {
        id: 'rule_5',
        sourceSystem: 'streak_system',
        targetSystem: 'retention_triggers',
        action: 'reduce',
        condition: 'streak > 30',
        cooldownMs: 600000,
        active: true,
      },
      {
        id: 'rule_6',
        sourceSystem: 'safety',
        targetSystem: 'leaderboards',
        action: 'block',
        condition: 'trust_score < 50',
        cooldownMs: 0,
        active: true,
      },
    ];
  },

  // ─── Add priority rule ─────────────────────────────────────────────────
  async addRule(rule: PriorityRule): Promise<void> {
    const rules = await this.getPriorityRules();
    rules.push(rule);

    const redis = getRedisClient();
    await redis.set(PRIORITY_KEY, JSON.stringify(rules), 'EX', 86400 * 30);

    logger.info('[priority] Rule added', { ruleId: rule.id });
  },

  // ─── Update rule active status ─────────────────────────────────────────
  async setRuleActive(ruleId: string, active: boolean): Promise<boolean> {
    const rules = await this.getPriorityRules();
    const rule = rules.find(r => r.id === ruleId);

    if (!rule) {
      return false;
    }

    rule.active = active;

    const redis = getRedisClient();
    await redis.set(PRIORITY_KEY, JSON.stringify(rules), 'EX', 86400 * 30);

    return true;
  },

  // ─── Evaluate and apply rules for user ────────────────────────────────
  async evaluateRules(userId: string, context: Record<string, unknown>): Promise<{
    appliedRules: string[];
    suppressedSystems: BehavioralSystem[];
  }> {
    const rules = await this.getPriorityRules();
    const activeRules = rules.filter(r => r.active);
    const appliedRules: string[] = [];
    const suppressedSystems: BehavioralSystem[] = [];

    for (const rule of activeRules) {
      if (this.evaluateCondition(rule.condition, context)) {
        const executed = await this.executeSuppression(
          rule.sourceSystem,
          rule.targetSystem,
          rule.action
        );

        if (executed) {
          appliedRules.push(rule.id);
          suppressedSystems.push(rule.targetSystem);
          await this.recordViolation(rule.sourceSystem, rule.targetSystem, rule.action);
        }
      }
    }

    return { appliedRules, suppressedSystems };
  },

  // ─── Evaluate condition string ────────────────────────────────────────
  evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
      const variables: Record<string, unknown> = { ...context };
      const conditionFn = new Function(...Object.keys(variables), `return ${condition}`);
      return conditionFn(...Object.values(variables));
    } catch {
      return false;
    }
  },

  // ─── Record priority violation ────────────────────────────────────────
  async recordViolation(
    higher: BehavioralSystem,
    lower: BehavioralSystem,
    action: string
  ): Promise<void> {
    const redis = getRedisClient();
    const violation: PriorityViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      higherPriority: higher,
      lowerPriority: lower,
      action,
      resolved: false,
    };

    await redis.rpush(VIOLATIONS_KEY, JSON.stringify(violation));
  },

  // ─── Get recent violations ────────────────────────────────────────────
  async getRecentViolations(hours: number = 24): Promise<PriorityViolation[]> {
    const redis = getRedisClient();
    const violations = await redis.lrange(VIOLATIONS_KEY, 0, 99);

    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    return violations
      .map(v => JSON.parse(v))
      .filter(v => new Date(v.timestamp).getTime() > cutoff);
  },

  // ─── Get priority hierarchy summary ───────────────────────────────────
  async getHierarchySummary(): Promise<Record<BehavioralSystem, SystemPriority>> {
    return SYSTEM_PRIORITIES;
  },

  // ─── Resolve violation ────────────────────────────────────────────────
  async resolveViolation(violationId: string): Promise<boolean> {
    const redis = getRedisClient();
    const violations = await redis.lrange(VIOLATIONS_KEY, 0, -1);

    for (let i = 0; i < violations.length; i++) {
      const violation: PriorityViolation = JSON.parse(violations[i]);
      if (violation.id === violationId) {
        violation.resolved = true;
        violations[i] = JSON.stringify(violation);
        await redis.del(VIOLATIONS_KEY);
        for (const v of violations) {
          await redis.rpush(VIOLATIONS_KEY, v);
        }
        return true;
      }
    }

    return false;
  },
};

export default priorityHierarchy;