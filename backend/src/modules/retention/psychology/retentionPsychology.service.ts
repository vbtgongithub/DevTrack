// src/modules/retention/psychology/retentionPsychology.service.ts — Retention Psychology Engine
// Phase-C3: Psychologically optimized trigger detection and behavioral nudges

import { Types } from 'mongoose';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { eventOrchestration } from '../orchestration/index.js';
import { momentumAnalytics } from '../analytics/index.js';

export interface StreakRiskReport {
  risk: 'low' | 'medium' | 'high' | 'critical';
  daysUntilLoss: number;
  currentStreak: number;
  message: string;
}

export interface NearGoalTrigger {
  goalType: string;
  goalId: string;
  currentProgress: number;
  xpNeeded: number;
  message: string;
}

export interface BurnoutRiskReport {
  probability: number;
  warning: string;
  recommendedAction: string;
}

export interface ComebackTrigger {
  daysInactive: number;
  previousStreak: number;
  bonusMultiplier: number;
  message: string;
}

export interface RetentionTrigger {
  type: 'streak_risk' | 'near_goal' | 'momentum_spike' | 'momentum_dip' | 'burnout_warning' | 'comeback' | 'level_up';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, unknown>;
  expiresAt: Date;
}

// Redis keys
const PSYCHOLOGY_KEYS = {
  triggerCooldown: (userId: string, triggerType: string) => `psychology:cooldown:${userId}:${triggerType}`,
  activeTriggers: (userId: string) => `psychology:triggers:${userId}`,
};

export const retentionPsychology = {
  // ─── Detect streak risk ───────────────────────────────────────────────────
  async detectStreakRisk(userId: string): Promise<StreakRiskReport | null> {
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    if (!analytics || analytics.currentStreak < 3) return null;

    const lastActive = analytics.lastActiveDate;
    if (!lastActive) return { risk: 'critical', daysUntilLoss: 0, currentStreak: analytics.currentStreak, message: 'No recent activity!' };

    const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    const daysUntilLoss = Math.max(0, Math.floor(24 - hoursSinceActive) / 24);

    // Risk based on streak length and time since last activity
    let risk: StreakRiskReport['risk'] = 'low';
    let message = 'Keep your streak going!';

    if (hoursSinceActive >= 20) {
      risk = 'critical';
      message = 'Last chance to save your streak!';
    } else if (hoursSinceActive >= 12) {
      risk = 'high';
      message = `${Math.ceil(daysUntilLoss * 24)} hours left to preserve your streak!`;
    } else if (hoursSinceActive >= 6) {
      risk = 'medium';
      message = "Don't forget to log today's activity";
    }

    // Don't report low risk for short streaks
    if (risk === 'low' && analytics.currentStreak < 7) return null;

    return {
      risk,
      daysUntilLoss: Math.ceil(daysUntilLoss),
      currentStreak: analytics.currentStreak,
      message,
    };
  },

  // ─── Detect near-goal state ───────────────────────────────────────────────
  async detectNearGoals(userId: string): Promise<NearGoalTrigger[]> {
    const triggers: NearGoalTrigger[] = [];

    // Check XP progress (near level up)
    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
    if (userXp && userXp.xpToNextLevel > 0 && userXp.xpToNextLevel <= 50) {
      triggers.push({
        goalType: 'level',
        goalId: `level_${userXp.currentLevel}`,
        currentProgress: 100 - (userXp.xpToNextLevel / 100),
        xpNeeded: userXp.xpToNextLevel,
        message: `Just ${userXp.xpToNextLevel} XP away from level ${userXp.currentLevel + 1}!`,
      });
    }

    // Check streak progress
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    if (analytics && analytics.currentStreak > 0) {
      const nextMilestone = Math.ceil((analytics.currentStreak + 1) / 7) * 7;
      const daysToMilestone = nextMilestone - analytics.currentStreak;

      if (daysToMilestone <= 2) {
        triggers.push({
          goalType: 'streak',
          goalId: 'streak_milestone',
          currentProgress: (analytics.currentStreak / nextMilestone) * 100,
          xpNeeded: 0,
          message: `${daysToMilestone} ${daysToMilestone === 1 ? 'day' : 'days'} to a ${nextMilestone}-day streak milestone!`,
        });
      }
    }

    return triggers;
  },

  // ─── Detect burnout risk ───────────────────────────────────────────────────
  async detectBurnoutRisk(userId: string): Promise<BurnoutRiskReport | null> {
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    if (!analytics) return null;

    const report = await momentumAnalytics.getMomentumReport(userId);
    if (!report) return null;

    if (report.burnoutProbability < 30) return null;

    let warning = 'Your activity is very high.';
    let recommendedAction = 'Consider taking a short break to prevent burnout.';

    if (report.burnoutProbability >= 70) {
      warning = 'High burnout risk detected!';
      recommendedAction = 'Take a break today. Your streak will be protected.';
    }

    return {
      probability: report.burnoutProbability,
      warning,
      recommendedAction,
    };
  },

  // ─── Detect comeback opportunity ─────────────────────────────────────────
  async detectComebackOpportunity(userId: string): Promise<ComebackTrigger | null> {
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    if (!analytics || !analytics.lastActiveDate) return null;

    const daysInactive = Math.floor(
      (Date.now() - analytics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only trigger for users inactive 3-30 days
    if (daysInactive < 3 || daysInactive > 30) return null;

    const previousStreak = analytics.currentStreak;
    const bestStreak = analytics.bestStreak;

    // Calculate comeback bonus
    let bonusMultiplier = 1.0;
    if (daysInactive >= 7) bonusMultiplier = 1.5;
    if (daysInactive >= 14) bonusMultiplier = 2.0;
    if (previousStreak >= 7) bonusMultiplier += 0.25;
    if (bestStreak >= 14) bonusMultiplier += 0.25;

    let message = "Welcome back! Start your comeback today.";
    if (daysInactive >= 7) {
      message = `You've been away ${daysInactive} days. Start fresh and earn a comeback bonus!`;
    }

    return {
      daysInactive,
      previousStreak,
      bonusMultiplier,
      message,
    };
  },

  // ─── Generate all retention triggers for user ─────────────────────────────
  async generateTriggers(userId: string): Promise<RetentionTrigger[]> {
    const triggers: RetentionTrigger[] = [];

    // Check cooldown before generating
    const redis = getRedisClient();

    // Streak risk
    const streakRisk = await this.detectStreakRisk(userId);
    if (streakRisk && streakRisk.risk !== 'low') {
      const canTrigger = await this.checkCooldown(userId, 'streak_risk');
      if (canTrigger) {
        triggers.push({
          type: 'streak_risk',
          priority: streakRisk.risk === 'critical' ? 'critical' : 'high',
          message: streakRisk.message,
          data: {
            streakDays: streakRisk.currentStreak,
            daysUntilLoss: streakRisk.daysUntilLoss,
          },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        });
        await this.setCooldown(userId, 'streak_risk', 30 * 60 * 1000);
      }
    }

    // Near goals
    const nearGoals = await this.detectNearGoals(userId);
    for (const goal of nearGoals) {
      const canTrigger = await this.checkCooldown(userId, `near_goal_${goal.goalType}`);
      if (canTrigger) {
        triggers.push({
          type: 'near_goal',
          priority: 'medium',
          message: goal.message,
          data: goal as any,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });
        await this.setCooldown(userId, `near_goal_${goal.goalType}`, 60 * 60 * 1000);
      }
    }

    // Burnout warning
    const burnoutRisk = await this.detectBurnoutRisk(userId);
    if (burnoutRisk && burnoutRisk.probability >= 50) {
      const canTrigger = await this.checkCooldown(userId, 'burnout_warning');
      if (canTrigger) {
        triggers.push({
          type: 'burnout_warning',
          priority: 'medium',
          message: burnoutRisk.warning,
          data: {
            probability: burnoutRisk.probability,
            recommendedAction: burnoutRisk.recommendedAction,
          },
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        await this.setCooldown(userId, 'burnout_warning', 60 * 60 * 1000);
      }
    }

    // Comeback opportunity
    const comeback = await this.detectComebackOpportunity(userId);
    if (comeback) {
      const canTrigger = await this.checkCooldown(userId, 'comeback');
      if (canTrigger) {
        triggers.push({
          type: 'comeback',
          priority: 'high',
          message: comeback.message,
          data: {
            daysInactive: comeback.daysInactive,
            previousStreak: comeback.previousStreak,
            bonusMultiplier: comeback.bonusMultiplier,
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });
        await this.setCooldown(userId, 'comeback', 24 * 60 * 60 * 1000);
      }
    }

    return triggers;
  },

  // ─── Check trigger cooldown ───────────────────────────────────────────────
  async checkCooldown(userId: string, triggerType: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = PSYCHOLOGY_KEYS.triggerCooldown(userId, triggerType);
    const exists = await redis.exists(key);
    return !exists;
  },

  // ─── Set trigger cooldown ─────────────────────────────────────────────────
  async setCooldown(userId: string, triggerType: string, durationMs: number): Promise<void> {
    const redis = getRedisClient();
    const key = PSYCHOLOGY_KEYS.triggerCooldown(userId, triggerType);
    await redis.set(key, '1', 'PX', durationMs);
  },

  // ─── Execute triggers (send notifications) ───────────────────────────────
  async executeTriggers(userId: string): Promise<void> {
    const triggers = await this.generateTriggers(userId);

    for (const trigger of triggers) {
      // Create orchestration event for each trigger
      const eventType = ({
        streak_risk: 'streak_at_risk',
        near_goal: 'near_goal',
        burnout_warning: 'burnout_warning',
        comeback: 'comeback_started',
      } as Record<string, string>)[trigger.type] || 'daily_login';

      const event = eventOrchestration.createEvent(
        eventType as any,
        userId,
        trigger.data,
        'system'
      );
      await eventOrchestration.handleEvent(event);
    }

    logger.debug('[psychology] Triggers executed', { userId, count: triggers.length });
  },
};

export default retentionPsychology;