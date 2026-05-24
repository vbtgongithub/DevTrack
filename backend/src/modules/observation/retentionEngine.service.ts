// ============================================================================
// retentionEngine.service.ts — Retention Psychology Engine
// ============================================================================
// Behavioral reinforcement system for emotional retention.
// No dark patterns. No notification spam. No dopamine overload.
//
// Provides: streak pressure, recovery missions, comeback rewards,
// milestone anticipation, near-level-up reinforcement, motivational messaging.
// ============================================================================

import { Types } from 'mongoose';
import {
  UserAnalytics,
  UserXp,
  DailyActivity,
  PlatformStats,
} from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import type { MomentumScore } from './momentumEngine.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetentionContext {
  userState: 'new' | 'active' | 'at_risk' | 'returning' | 'dormant';
  streakPressure: StreakPressure | null;
  recoveryMission: RecoveryMission | null;
  comebackReward: ComebackReward | null;
  milestoneAnticipation: MilestoneAnticipation[];
  nearLevelUp: NearLevelUp | null;
  motivationalMessage: MotivationalMessage;
}

export interface StreakPressure {
  level: 'none' | 'gentle' | 'moderate' | 'urgent' | 'critical';
  currentStreak: number;
  hoursRemaining: number;
  message: string;
  emoji: string;
}

export interface RecoveryMission {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number; // XP
  expiresInHours: number;
  type: 'solve_problems' | 'focus_session' | 'commit_code';
}

export interface ComebackReward {
  eligible: boolean;
  inactiveDays: number;
  bonusXp: number;
  message: string;
}

export interface MilestoneAnticipation {
  type: 'problems' | 'streak' | 'level' | 'commits' | 'projects';
  current: number;
  target: number;
  remaining: number;
  progressPercent: number;
  message: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface NearLevelUp {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercent: number;
  message: string;
}

export interface MotivationalMessage {
  tone: 'encouraging' | 'celebratory' | 'gentle-nudge' | 'supportive' | 'calm';
  text: string;
  subtext?: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class RetentionEngine {
  /**
   * Full retention context for the dashboard.
   */
  async getRetentionContext(
    userId: string,
    momentumScore?: MomentumScore
  ): Promise<RetentionContext> {
    const userObjId = new Types.ObjectId(userId);

    const [analytics, userXp, recentActivity] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }).lean(),
      UserXp.findOne({ userId: userObjId }).lean(),
      this.getRecentActivitySummary(userId),
    ]);

    const currentStreak = analytics?.currentStreak ?? 0;
    const bestStreak = analytics?.bestStreak ?? 0;
    const lastActiveDate = analytics?.lastActiveDate ?? null;
    const currentXp = (userXp as any)?.totalXp ?? 0;
    const currentLevel = (userXp as any)?.level ?? 1;
    const xpToNextLevel = (userXp as any)?.xpToNextLevel ?? 100;

    // Determine user state
    const userState = this.determineUserState(lastActiveDate, currentStreak, recentActivity.activeDays7d);

    // Build retention context
    const [
      streakPressure,
      recoveryMission,
      comebackReward,
      milestoneAnticipation,
      nearLevelUp,
      motivationalMessage,
    ] = await Promise.all([
      this.calculateStreakPressure(currentStreak, lastActiveDate, bestStreak),
      this.generateRecoveryMission(userState, currentStreak, momentumScore),
      this.checkComebackReward(lastActiveDate),
      this.detectMilestoneAnticipation(userId, currentStreak, currentLevel),
      this.checkNearLevelUp(currentLevel, currentXp, xpToNextLevel),
      this.generateMotivationalMessage(userState, currentStreak, momentumScore),
    ]);

    return {
      userState,
      streakPressure,
      recoveryMission,
      comebackReward,
      milestoneAnticipation,
      nearLevelUp,
      motivationalMessage,
    };
  }

  // ─── User State Determination ───────────────────────────────────────────

  private determineUserState(
    lastActiveDate: Date | null,
    currentStreak: number,
    activeDays7d: number
  ): RetentionContext['userState'] {
    if (!lastActiveDate) return 'new';

    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive >= 7) return 'dormant';
    if (daysSinceActive >= 3) return 'returning';
    if (currentStreak === 0 || activeDays7d <= 2) return 'at_risk';
    return 'active';
  }

  // ─── Streak Pressure ───────────────────────────────────────────────────

  private async calculateStreakPressure(
    currentStreak: number,
    lastActiveDate: Date | null,
    bestStreak: number
  ): Promise<StreakPressure | null> {
    if (currentStreak === 0) return null;

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const hoursRemaining = Math.max(0, Math.round((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)));

    // Check if today's activity has been recorded
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActiveDateStr = lastActiveDate ? new Date(lastActiveDate).toISOString().split('T')[0] : '';
    const isActiveToday = todayStr === lastActiveDateStr;

    if (isActiveToday) {
      return {
        level: 'none',
        currentStreak,
        hoursRemaining,
        message: `${currentStreak}-day streak secured! 🎯`,
        emoji: '✅',
      };
    }

    // Escalate pressure based on streak length and time remaining
    let level: StreakPressure['level'] = 'gentle';
    let message = '';
    let emoji = '';

    if (hoursRemaining <= 2) {
      level = 'critical';
      emoji = '🚨';
      message = `Only ${hoursRemaining}h left! Don't lose your ${currentStreak}-day streak!`;
    } else if (hoursRemaining <= 6) {
      level = 'urgent';
      emoji = '⚡';
      message = `${hoursRemaining}h remaining — your ${currentStreak}-day streak needs you!`;
    } else if (currentStreak >= 7) {
      level = 'moderate';
      emoji = '🔥';
      message = `Keep the fire alive! ${currentStreak} days and counting.`;
    } else {
      level = 'gentle';
      emoji = '💪';
      message = `Day ${currentStreak + 1} awaits. One action keeps your streak alive.`;
    }

    // Extra urgency if near best streak
    if (currentStreak >= bestStreak - 1 && currentStreak > 3) {
      message = `You're about to beat your best streak of ${bestStreak} days! ${message}`;
      if (level === 'gentle') level = 'moderate';
    }

    return { level, currentStreak, hoursRemaining, message, emoji };
  }

  // ─── Recovery Missions ──────────────────────────────────────────────────

  private async generateRecoveryMission(
    userState: RetentionContext['userState'],
    currentStreak: number,
    momentumScore?: MomentumScore
  ): Promise<RecoveryMission | null> {
    // Only generate for at_risk or returning users
    if (userState !== 'at_risk' && userState !== 'returning' && userState !== 'dormant') {
      return null;
    }

    if (userState === 'dormant') {
      return {
        id: 'recovery_comeback',
        title: 'Welcome Back Challenge',
        description: 'Solve any 1 problem to restart your journey and earn bonus XP.',
        target: 1,
        reward: 50,
        expiresInHours: 48,
        type: 'solve_problems',
      };
    }

    if (userState === 'returning') {
      return {
        id: 'recovery_rebuild',
        title: 'Momentum Rebuild',
        description: 'Complete 2 problems in 24 hours to earn a Recovery Badge.',
        target: 2,
        reward: 75,
        expiresInHours: 24,
        type: 'solve_problems',
      };
    }

    // at_risk
    const isLowMomentum = (momentumScore?.overall ?? 50) < 40;
    return {
      id: 'recovery_protect',
      title: isLowMomentum ? 'Quick Win' : 'Streak Shield',
      description: isLowMomentum
        ? 'Solve 1 easy problem to break out of the slump.'
        : 'Complete a 15-minute focus session to protect your streak.',
      target: 1,
      reward: 30,
      expiresInHours: 12,
      type: isLowMomentum ? 'solve_problems' : 'focus_session',
    };
  }

  // ─── Comeback Rewards ──────────────────────────────────────────────────

  private async checkComebackReward(lastActiveDate: Date | null): Promise<ComebackReward> {
    if (!lastActiveDate) {
      return { eligible: false, inactiveDays: 0, bonusXp: 0, message: '' };
    }

    const daysSinceActive = Math.floor(
      (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActive >= 3) {
      const bonusXp = Math.min(100, daysSinceActive * 15);
      return {
        eligible: true,
        inactiveDays: daysSinceActive,
        bonusXp,
        message: `Welcome back! 🎉 You've been away ${daysSinceActive} days. Complete any activity to earn +${bonusXp} bonus XP.`,
      };
    }

    return { eligible: false, inactiveDays: daysSinceActive, bonusXp: 0, message: '' };
  }

  // ─── Milestone Anticipation ─────────────────────────────────────────────

  private async detectMilestoneAnticipation(
    userId: string,
    currentStreak: number,
    currentLevel: number
  ): Promise<MilestoneAnticipation[]> {
    const milestones: MilestoneAnticipation[] = [];
    const userObjId = new Types.ObjectId(userId);

    // Streak milestones
    const streakMilestones = [7, 14, 30, 60, 100];
    for (const target of streakMilestones) {
      if (currentStreak < target && currentStreak >= target * 0.7) {
        const remaining = target - currentStreak;
        milestones.push({
          type: 'streak',
          current: currentStreak,
          target,
          remaining,
          progressPercent: Math.round((currentStreak / target) * 100),
          message: `${remaining} more day${remaining === 1 ? '' : 's'} to reach a ${target}-day streak!`,
          urgency: remaining <= 2 ? 'high' : remaining <= 5 ? 'medium' : 'low',
        });
        break;
      }
    }

    // Problem milestones
    const platformStats = await PlatformStats.find({ userId: userObjId }).lean();
    const totalSolved = platformStats.reduce((s, p) => s + (p.totalSolved || 0), 0);
    const problemMilestones = [10, 25, 50, 100, 200, 500];
    for (const target of problemMilestones) {
      if (totalSolved < target && totalSolved >= target * 0.8) {
        const remaining = target - totalSolved;
        milestones.push({
          type: 'problems',
          current: totalSolved,
          target,
          remaining,
          progressPercent: Math.round((totalSolved / target) * 100),
          message: `Only ${remaining} problem${remaining === 1 ? '' : 's'} to reach ${target} total!`,
          urgency: remaining <= 3 ? 'high' : 'medium',
        });
        break;
      }
    }

    // Level milestones
    const levelMilestones = [5, 10, 15];
    for (const target of levelMilestones) {
      if (currentLevel < target && currentLevel >= target - 1) {
        milestones.push({
          type: 'level',
          current: currentLevel,
          target,
          remaining: 1,
          progressPercent: Math.round((currentLevel / target) * 100),
          message: `You're about to hit Level ${target}!`,
          urgency: 'high',
        });
        break;
      }
    }

    return milestones.slice(0, 3);
  }

  // ─── Near Level Up ──────────────────────────────────────────────────────

  private async checkNearLevelUp(
    currentLevel: number,
    currentXp: number,
    xpToNextLevel: number
  ): Promise<NearLevelUp | null> {
    if (xpToNextLevel <= 0) return null;

    const progressPercent = Math.round(
      ((currentXp % xpToNextLevel) / xpToNextLevel) * 100
    );

    // Only show when close (>= 60% progress)
    if (progressPercent < 60) return null;

    const xpRemaining = xpToNextLevel - (currentXp % xpToNextLevel);

    return {
      currentLevel,
      currentXp,
      xpToNextLevel: xpRemaining,
      progressPercent,
      message: `${xpRemaining} XP to Level ${currentLevel + 1}! You're ${progressPercent}% there.`,
    };
  }

  // ─── Motivational Messaging ─────────────────────────────────────────────

  private async generateMotivationalMessage(
    userState: RetentionContext['userState'],
    currentStreak: number,
    momentumScore?: MomentumScore
  ): Promise<MotivationalMessage> {
    const momentumOverall = momentumScore?.overall ?? 50;

    if (userState === 'dormant') {
      return {
        tone: 'supportive',
        text: 'Every expert was once a beginner.',
        subtext: 'Your journey restarts with one step.',
        emoji: '🌱',
      };
    }

    if (userState === 'returning') {
      return {
        tone: 'encouraging',
        text: 'Welcome back, developer!',
        subtext: 'The best time to start again is right now.',
        emoji: '🎉',
      };
    }

    if (userState === 'at_risk') {
      return {
        tone: 'gentle-nudge',
        text: 'Small steps lead to big breakthroughs.',
        subtext: 'Even 10 minutes of focus counts.',
        emoji: '💡',
      };
    }

    // Active users — messages based on momentum
    if (momentumOverall >= 80) {
      const messages = [
        { text: 'Exceptional performance this week!', subtext: "You're in the top tier.", emoji: '🚀' },
        { text: 'Your consistency is legendary.', subtext: 'Keep this energy going.', emoji: '⚡' },
        { text: 'Momentum is through the roof!', subtext: `${currentStreak}-day streak strong.`, emoji: '🔥' },
      ];
      const pick = messages[Math.floor(Date.now() / 86400000) % messages.length];
      return { tone: 'celebratory', ...pick };
    }

    if (momentumOverall >= 50) {
      const messages = [
        { text: 'Solid progress today.', subtext: 'Keep building momentum.', emoji: '💪' },
        { text: "You're on the right track.", subtext: 'Consistency beats intensity.', emoji: '📈' },
      ];
      const pick = messages[Math.floor(Date.now() / 86400000) % messages.length];
      return { tone: 'encouraging', ...pick };
    }

    return {
      tone: 'calm',
      text: 'Ready to get started?',
      subtext: 'A single problem solved is a win.',
      emoji: '🎯',
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private async getRecentActivitySummary(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activities = await DailyActivity.find({
      userId: userObjId,
      date: { $gte: last7d },
    }).lean();

    return {
      activeDays7d: activities.filter(a => a.count > 0).length,
      totalCount7d: activities.reduce((s, a) => s + a.count, 0),
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const retentionEngine = new RetentionEngine();
