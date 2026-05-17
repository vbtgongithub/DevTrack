// src/modules/retention/onboarding/onboarding.service.ts — Onboarding Calibration Engine
// Phase-C3: High-retention onboarding with dopamine pacing and beginner protection

import { Types } from 'mongoose';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { eventOrchestration } from '../orchestration/index.js';
import { goalGenerator } from '../goals/index.js';

export type OnboardingPhase = 'none' | 'first_session' | 'first_week' | 'calibrating' | 'established';

export interface OnboardingState {
  userId: string;
  phase: OnboardingPhase;
  startedAt: Date;
  firstGoalCompleted: boolean;
  firstChallengeCompleted: boolean;
  firstAchievementUnlocked: boolean;
  currentStreakStarted: boolean;
  levelProgress: number; // How many levels gained
}

export interface DopaminePacingSchedule {
  day: number;
  activityType: string;
  expectedXp: number;
  expectedProgress: string;
}

// Redis keys
const ONBOARDING_KEYS = {
  state: (userId: string) => `onboarding:state:${userId}`,
  mission: (userId: string) => `onboarding:missions:${userId}`,
};

// Onboarding phases with durations (in hours)
const PHASE_DURATIONS: Record<OnboardingPhase, number> = {
  none: 0,
  first_session: 2,
  first_week: 168, // 7 days
  calibrating: 336, // 14 days
  established: Infinity,
};

// First-week mission templates
const FIRST_WEEK_MISSIONS = [
  { day: 1, title: 'First Step', description: 'Solve your first problem', target: 1, xp: 25 },
  { day: 1, title: 'Get Moving', description: 'Earn 25 XP', target: 25, xp: 10 },
  { day: 2, title: 'Double Down', description: 'Solve 2 problems', target: 2, xp: 40 },
  { day: 2, title: 'Keep Going', description: 'Earn 50 XP', target: 50, xp: 20 },
  { day: 3, title: 'Streak Starter', description: 'Log activity for 3 days', target: 3, xp: 50 },
  { day: 3, title: 'Problem Solver', description: 'Solve 3 problems', target: 3, xp: 60 },
  { day: 5, title: 'Week Warrior', description: 'Maintain a 7-day streak', target: 7, xp: 100 },
  { day: 7, title: 'First Week Champion', description: 'Solve 10 problems this week', target: 10, xp: 150 },
];

export const onboardingService = {
  // ─── Start onboarding for new user ───────────────────────────────────────
  async startOnboarding(userId: string): Promise<OnboardingState> {
    const state: OnboardingState = {
      userId,
      phase: 'first_session',
      startedAt: new Date(),
      firstGoalCompleted: false,
      firstChallengeCompleted: false,
      firstAchievementUnlocked: false,
      currentStreakStarted: false,
      levelProgress: 0,
    };

    // Cache in Redis for fast access
    const redis = getRedisClient();
    await redis.set(
      ONBOARDING_KEYS.state(userId),
      JSON.stringify(state),
      'EX',
      60 * 60 * 24 * 30 // 30 days
    );

    // Assign first-day missions
    await this.assignDayMissions(userId, 1);

    // Emit onboarding started event
    const event = eventOrchestration.createEvent(
      'daily_login',
      userId,
      { phase: 'first_session', onboardingStarted: true },
      'user'
    );
    await eventOrchestration.handleEvent(event);

    logger.info('[onboarding] Started for user', { userId, phase: state.phase });

    return state;
  },

  // ─── Get current onboarding state ────────────────────────────────────────
  async getOnboardingState(userId: string): Promise<OnboardingState | null> {
    const redis = getRedisClient();
    const cached = await redis.get(ONBOARDING_KEYS.state(userId));

    if (cached) {
      return JSON.parse(cached) as OnboardingState;
    }

    // Check if onboarding exists in database
    const analytics = await UserAnalytics.findOne({ userId: new Types.ObjectId(userId) });
    if (!analytics || analytics.currentStreak > 0) {
      return null; // User is past onboarding
    }

    // Create default state
    return {
      userId,
      phase: 'first_session',
      startedAt: new Date(),
      firstGoalCompleted: false,
      firstChallengeCompleted: false,
      firstAchievementUnlocked: false,
      currentStreakStarted: false,
      levelProgress: 0,
    };
  },

  // ─── Advance onboarding phase ───────────────────────────────────────────
  async advancePhase(userId: string, milestone: string): Promise<void> {
    const state = await this.getOnboardingState(userId);
    if (!state) return;

    let newPhase: OnboardingPhase = state.phase;

    switch (milestone) {
      case 'first_activity':
        state.currentStreakStarted = true;
        newPhase = 'first_session';
        break;
      case 'first_goal':
        state.firstGoalCompleted = true;
        newPhase = 'first_week';
        break;
      case 'first_challenge':
        state.firstChallengeCompleted = true;
        break;
      case 'first_achievement':
        state.firstAchievementUnlocked = true;
        break;
      case 'streak_3':
        newPhase = 'first_week';
        break;
      case 'streak_7':
        newPhase = 'calibrating';
        break;
      case 'level_3':
        state.levelProgress = Math.max(state.levelProgress, 3);
        break;
    }

    // Update state
    const redis = getRedisClient();
    await redis.set(
      ONBOARDING_KEYS.state(userId),
      JSON.stringify(state),
      'EX',
      60 * 60 * 24 * 30
    );

    logger.info('[onboarding] Phase advanced', { userId, milestone, newPhase });
  },

  // ─── Assign missions for specific day ───────────────────────────────────
  async assignDayMissions(userId: string, day: number): Promise<void> {
    const missions = FIRST_WEEK_MISSIONS.filter((m) => m.day <= day);

    const redis = getRedisClient();
    await redis.set(
      ONBOARDING_KEYS.mission(userId),
      JSON.stringify(missions),
      'EX',
      60 * 60 * 24 * 14
    );

    logger.info('[onboarding] Missions assigned', { userId, day, count: missions.length });
  },

  // ─── Get current missions ────────────────────────────────────────────────
  async getCurrentMissions(userId: string): Promise<typeof FIRST_WEEK_MISSIONS> {
    const redis = getRedisClient();
    const cached = await redis.get(ONBOARDING_KEYS.mission(userId));

    if (cached) {
      return JSON.parse(cached) as typeof FIRST_WEEK_MISSIONS;
    }

    return [];
  },

  // ─── Calculate dopamine pacing schedule ───────────────────────────────────
  calculateDopaminePacing(): DopaminePacingSchedule[] {
    // First week: spaced for maximum engagement
    const schedule: DopaminePacingSchedule[] = [
      { day: 1, activityType: 'quick_win', expectedXp: 25, expectedProgress: 'First problem solved!' },
      { day: 1, activityType: 'momentum', expectedXp: 25, expectedProgress: 'Started earning XP' },
      { day: 2, activityType: 'building', expectedXp: 50, expectedProgress: 'Building consistency' },
      { day: 3, activityType: 'milestone', expectedXp: 75, expectedProgress: 'First streak milestone' },
      { day: 5, activityType: 'challenge', expectedXp: 100, expectedProgress: 'Week streak achieved' },
      { day: 7, activityType: 'celebration', expectedXp: 150, expectedProgress: 'First week complete!' },
    ];

    return schedule;
  },

  // ─── Get beginner-friendly goal ─────────────────────────────────────────
  async getBeginnerGoal(userId: string): Promise<{ title: string; target: number; xp: number } | null> {
    const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });

    // Only for users under level 3
    if (!userXp || userXp.currentLevel > 3) return null;

    // Easy beginner goals
    const beginnerGoals = [
      { title: 'Solve 1 Easy Problem', target: 1, xp: 15 },
      { title: 'Earn 25 XP', target: 25, xp: 10 },
      { title: 'Log Your First Activity', target: 1, xp: 10 },
      { title: 'Solve 2 Easy Problems', target: 2, xp: 25 },
      { title: 'Complete 3 Problems', target: 3, xp: 35 },
    ];

    return beginnerGoals[Math.floor(Math.random() * beginnerGoals.length)];
  },

  // ─── Apply beginner XP bonus ────────────────────────────────────────────
  applyBeginnerBonus(baseXp: number, userId: string): number {
    // This is handled by progression economy with trust multipliers
    // But we apply an extra 50% bonus for first 7 days
    return Math.floor(baseXp * 1.5);
  },

  // ─── Check if onboarding is complete ───────────────────────────────────
  async isOnboardingComplete(userId: string): Promise<boolean> {
    const state = await this.getOnboardingState(userId);
    if (!state) return true; // No onboarding = established

    // Complete when established phase reached
    return state.phase === 'established';
  },

  // ─── Transition to established phase ────────────────────────────────────
  async completeOnboarding(userId: string): Promise<void> {
    const state = await this.getOnboardingState(userId);
    if (!state) return;

    state.phase = 'established';

    const redis = getRedisClient();
    await redis.set(
      ONBOARDING_KEYS.state(userId),
      JSON.stringify(state),
      'EX',
      60 * 60 * 24 * 30
    );

    // Emit completion event
    const event = eventOrchestration.createEvent(
      'achievement_unlocked',
      userId,
      { onboardingComplete: true, stats: state },
      'system'
    );
    await eventOrchestration.handleEvent(event);

    logger.info('[onboarding] Completed for user', { userId });
  },
};

export default onboardingService;