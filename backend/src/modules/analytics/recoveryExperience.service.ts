// src/modules/analytics/recoveryExperience.service.ts — Empty State + Recovery Experience
// Phase-I: Empty State + Recovery Experience - Comeback flows, recovery states, and motivation preservation

import mongoose from 'mongoose';
import { UserAnalytics } from '../../db/models/userAnalytics.model.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

export interface RecoveryState {
  userId: string;
  state: 'active' | 'at_risk' | 'inactive' | 'dormant' | 'churned';
  lastActiveDate: Date;
  daysInactive: number;
  streakBeforeInactive: number;
  recoveryAttempts: number;
  lastRecoveryAttempt?: Date;
  recoverySuccessRate: number;
  motivationLevel: 'high' | 'medium' | 'low';
  recommendedAction: string;
}

export interface ComebackFlow {
  userId: string;
  flowType: 'streak_recovery' | 'goal_restart' | 'gentle_nudge' | 'celebration';
  triggeredAt: Date;
  completedAt?: Date;
  steps: Array<{
    step: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  success: boolean;
  timeToComplete?: number;
}

export const recoveryExperience = {
  // ─── Determine Recovery State ───────────────────────────────────────────
  async determineRecoveryState(userId: string): Promise<RecoveryState> {
    const userAnalytics = await UserAnalytics.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!userAnalytics) {
      return {
        userId,
        state: 'inactive',
        lastActiveDate: new Date(),
        daysInactive: 0,
        streakBeforeInactive: 0,
        recoveryAttempts: 0,
        recoverySuccessRate: 0,
        motivationLevel: 'low',
        recommendedAction: 'Complete initial onboarding',
      };
    }

    const lastActiveDate = userAnalytics.lastActiveDate || new Date();
    const daysInactive = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    const streakBeforeInactive = userAnalytics.currentStreak || 0;

    // Determine state based on inactivity
    let state: 'active' | 'at_risk' | 'inactive' | 'dormant' | 'churned';
    if (daysInactive === 0) {
      state = 'active';
    } else if (daysInactive <= 2) {
      state = 'at_risk';
    } else if (daysInactive <= 7) {
      state = 'inactive';
    } else if (daysInactive <= 30) {
      state = 'dormant';
    } else {
      state = 'churned';
    }

    // Get recovery attempts from Redis
    const redis = getRedisClient();
    const recoveryKey = `recovery:${userId}`;
    const recoveryData = await redis.get(recoveryKey);
    const recoveryInfo = recoveryData ? JSON.parse(recoveryData) : { attempts: 0, successes: 0, lastAttempt: null };

    const recoveryAttempts = recoveryInfo.attempts || 0;
    const recoverySuccessRate = recoveryInfo.attempts > 0 ? (recoveryInfo.successes / recoveryInfo.attempts) * 100 : 0;

    // Determine motivation level
    let motivationLevel: 'high' | 'medium' | 'low';
    if (streakBeforeInactive >= 7) {
      motivationLevel = 'high';
    } else if (streakBeforeInactive >= 3) {
      motivationLevel = 'medium';
    } else {
      motivationLevel = 'low';
    }

    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(state, daysInactive, streakBeforeInactive, motivationLevel);

    return {
      userId,
      state,
      lastActiveDate,
      daysInactive,
      streakBeforeInactive,
      recoveryAttempts,
      lastRecoveryAttempt: recoveryInfo.lastAttempt,
      recoverySuccessRate,
      motivationLevel,
      recommendedAction,
    };
  },

  // ─── Generate Recommended Action ───────────────────────────────────────
  generateRecommendedAction(
    state: 'active' | 'at_risk' | 'inactive' | 'dormant' | 'churned',
    daysInactive: number,
    streakBeforeInactive: number,
    motivationLevel: 'high' | 'medium' | 'low'
  ): string {
    switch (state) {
      case 'active':
        return 'Continue current engagement - no action needed';
      case 'at_risk':
        return 'Send gentle reminder about streak preservation';
      case 'inactive':
        if (streakBeforeInactive > 0) {
          return 'Trigger streak recovery flow with encouragement';
        }
        return 'Send gentle nudge with low-friction action';
      case 'dormant':
        if (motivationLevel === 'high') {
          return 'Send personalized comeback message highlighting past achievements';
        }
        return 'Send re-engagement email with new features';
      case 'churned':
        return 'Send win-back campaign with value proposition';
      default:
        return 'No action recommended';
    }
  },

  // ─── Trigger Comeback Flow ───────────────────────────────────────────
  async triggerComebackFlow(
    userId: string,
    flowType: 'streak_recovery' | 'goal_restart' | 'gentle_nudge' | 'celebration'
  ): Promise<string> {
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const flow: ComebackFlow = {
      userId,
      flowType,
      triggeredAt: new Date(),
      steps: this.getFlowSteps(flowType),
      success: false,
    };

    // Store in Redis
    const redis = getRedisClient();
    await redis.setex(`comeback_flow:${flowId}`, 86400 * 7, JSON.stringify(flow));

    // Track recovery attempt
    const recoveryKey = `recovery:${userId}`;
    const recoveryData = await redis.get(recoveryKey);
    const recoveryInfo = recoveryData ? JSON.parse(recoveryData) : { attempts: 0, successes: 0, lastAttempt: null };
    recoveryInfo.attempts++;
    recoveryInfo.lastAttempt = new Date();
    await redis.setex(recoveryKey, 86400 * 90, JSON.stringify(recoveryInfo));

    logger.info('[recovery] Comeback flow triggered', { userId, flowType, flowId });

    return flowId;
  },

  // ─── Get Flow Steps ───────────────────────────────────────────────────
  getFlowSteps(flowType: string): Array<{ step: string; completed: boolean }> {
    switch (flowType) {
      case 'streak_recovery':
        return [
          { step: 'View streak recovery message', completed: false },
          { step: 'Complete one problem', completed: false },
          { step: 'Restore streak', completed: false },
        ];
      case 'goal_restart':
        return [
          { step: 'Review previous goals', completed: false },
          { step: 'Set new goal', completed: false },
          { step: 'Complete first task', completed: false },
        ];
      case 'gentle_nudge':
        return [
          { step: 'View nudge message', completed: false },
          { step: 'Take suggested action', completed: false },
        ];
      case 'celebration':
        return [
          { step: 'View achievement celebration', completed: false },
          { step: 'Share achievement (optional)', completed: false },
        ];
      default:
        return [{ step: 'View message', completed: false }];
    }
  },

  // ─── Complete Flow Step ───────────────────────────────────────────────
  async completeFlowStep(flowId: string, stepIndex: number): Promise<void> {
    const redis = getRedisClient();
    const flowData = await redis.get(`comeback_flow:${flowId}`);
    if (!flowData) return;

    const flow: ComebackFlow = JSON.parse(flowData);
    if (stepIndex >= flow.steps.length) return;

    flow.steps[stepIndex].completed = true;
    flow.steps[stepIndex].completedAt = new Date();

    // Check if all steps completed
    const allCompleted = flow.steps.every(s => s.completed);
    if (allCompleted && !flow.completedAt) {
      flow.success = true;
      flow.completedAt = new Date();
      flow.timeToComplete = flow.completedAt.getTime() - flow.triggeredAt.getTime();

      // Track recovery success
      const recoveryKey = `recovery:${flow.userId}`;
      const recoveryData = await redis.get(recoveryKey);
      const recoveryInfo = recoveryData ? JSON.parse(recoveryData) : { attempts: 0, successes: 0, lastAttempt: null };
      recoveryInfo.successes++;
      await redis.setex(recoveryKey, 86400 * 90, JSON.stringify(recoveryInfo));

      logger.info('[recovery] Comeback flow completed successfully', { flowId, userId: flow.userId });
    }

    await redis.setex(`comeback_flow:${flowId}`, 86400 * 7, JSON.stringify(flow));
  },

  // ─── Get Empty State Content ───────────────────────────────────────────
  async getEmptyStateContent(userId: string, context: 'workspace' | 'dashboard' | 'goals'): Promise<{
    title: string;
    subtitle: string;
    actionText: string;
    secondaryActionText?: string;
    tone: 'encouraging' | 'neutral' | 'celebratory';
  }> {
    const recoveryState = await this.determineRecoveryState(userId);

    switch (context) {
      case 'workspace':
        return this.getWorkspaceEmptyState(recoveryState);
      case 'dashboard':
        return this.getDashboardEmptyState(recoveryState);
      case 'goals':
        return this.getGoalsEmptyState(recoveryState);
      default:
        return {
          title: 'Welcome to DevTrack',
          subtitle: 'Start your journey by setting up your first goal',
          actionText: 'Get Started',
          tone: 'encouraging',
        };
    }
  },

  // ─── Get Workspace Empty State ───────────────────────────────────────
  getWorkspaceEmptyState(recoveryState: RecoveryState): {
    title: string;
    subtitle: string;
    actionText: string;
    secondaryActionText?: string;
    tone: 'encouraging' | 'neutral' | 'celebratory';
  } {
    if (recoveryState.state === 'active') {
      return {
        title: 'Your workspace is ready',
        subtitle: 'Select a problem to begin practicing',
        actionText: 'Browse Problems',
        tone: 'encouraging',
      };
    }

    if (recoveryState.streakBeforeInactive > 0) {
      return {
        title: 'Your momentum is waiting',
        subtitle: `You had a ${recoveryState.streakBeforeInactive}-day streak. One problem brings it back.`,
        actionText: 'Restore Streak',
        secondaryActionText: 'Browse Problems',
        tone: 'encouraging',
      };
    }

    return {
      title: 'Start your practice session',
      subtitle: 'Choose a problem and begin your journey',
      actionText: 'Browse Problems',
      tone: 'encouraging',
    };
  },

  // ─── Get Dashboard Empty State ────────────────────────────────────────
  getDashboardEmptyState(recoveryState: RecoveryState): {
    title: string;
    subtitle: string;
    actionText: string;
    secondaryActionText?: string;
    tone: 'encouraging' | 'neutral' | 'celebratory';
  } {
    if (recoveryState.state === 'active') {
      return {
        title: 'Your dashboard is ready',
        subtitle: 'Track your progress and achievements here',
        actionText: 'View Progress',
        tone: 'encouraging',
      };
    }

    if (recoveryState.daysInactive > 7) {
      return {
        title: 'Welcome back',
        subtitle: 'Your progress is preserved. Pick up where you left off.',
        actionText: 'Resume Journey',
        tone: 'encouraging',
      };
    }

    return {
      title: 'Set up your dashboard',
      subtitle: 'Configure your goals and preferences',
      actionText: 'Get Started',
      tone: 'encouraging',
    };
  },

  // ─── Get Goals Empty State ────────────────────────────────────────────
  getGoalsEmptyState(recoveryState: RecoveryState): {
    title: string;
    subtitle: string;
    actionText: string;
    secondaryActionText?: string;
    tone: 'encouraging' | 'neutral' | 'celebratory';
  } {
    if (recoveryState.state === 'active' && recoveryState.streakBeforeInactive > 0) {
      return {
        title: 'Keep your momentum going',
        subtitle: 'Set new goals to maintain your streak',
        actionText: 'Set New Goal',
        tone: 'encouraging',
      };
    }

    if (recoveryState.streakBeforeInactive > 0) {
      return {
        title: 'Rebuild your momentum',
        subtitle: 'Setting a new goal will help you get back on track',
        actionText: 'Set Recovery Goal',
        tone: 'encouraging',
      };
    }

    return {
      title: 'Start with a goal',
      subtitle: 'Setting a goal helps you stay focused and motivated',
      actionText: 'Create Your First Goal',
      tone: 'encouraging',
    };
  },

  // ─── Track Recovery Success ─────────────────────────────────────────
  async trackRecoverySuccess(userId: string, flowId: string): Promise<void> {
    const redis = getRedisClient();
    const flowData = await redis.get(`comeback_flow:${flowId}`);
    if (!flowData) return;

    const flow: ComebackFlow = JSON.parse(flowData);
    if (flow.success) {
      const recoveryKey = `recovery:${userId}`;
      const recoveryData = await redis.get(recoveryKey);
      const recoveryInfo = recoveryData ? JSON.parse(recoveryData) : { attempts: 0, successes: 0, lastAttempt: null };
      recoveryInfo.successes++;
      await redis.setex(recoveryKey, 86400 * 90, JSON.stringify(recoveryInfo));

      logger.info('[recovery] Recovery success tracked', { userId, flowId });
    }
  },
};

export default recoveryExperience;
