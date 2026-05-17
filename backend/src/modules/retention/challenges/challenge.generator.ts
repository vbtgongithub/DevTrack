// src/modules/retention/challenges/challenge.generator.ts — Challenge templates and assignment
// Phase-C2: Challenge generation with rarity and anti-farming

import type { ChallengeType, ChallengeRarity } from './challenge.model.js';

export interface ChallengeTemplate {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  rarity: ChallengeRarity;
  baseXp: number;
  badgeReward?: string;
  minStreak?: number;
  maxStreak?: number;
  requiresInactiveDays?: number;
}

// Daily challenge templates
const DAILY_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'daily_streak_3',
    type: 'daily',
    title: '3-Day Streak Builder',
    description: 'Log activity for 3 consecutive days',
    category: 'streak',
    targetValue: 3,
    rarity: 'common',
    baseXp: 75,
  },
  {
    id: 'daily_xp_200',
    type: 'daily',
    title: 'XP Hunter',
    description: 'Earn 200 XP today',
    category: 'xp',
    targetValue: 200,
    rarity: 'common',
    baseXp: 50,
  },
  {
    id: 'daily_problems_5',
    type: 'daily',
    title: 'Problem Solver',
    description: 'Solve 5 problems today',
    category: 'dsa',
    targetValue: 5,
    rarity: 'rare',
    baseXp: 100,
  },
  {
    id: 'daily_mixed',
    type: 'daily',
    title: 'Mixed Challenge',
    description: 'Complete any 3 activities today',
    category: 'mixed',
    targetValue: 3,
    rarity: 'common',
    baseXp: 60,
  },
];

// Weekly challenge templates
const WEEKLY_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'weekly_streak_7',
    type: 'weekly',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak this week',
    category: 'streak',
    targetValue: 7,
    rarity: 'rare',
    baseXp: 250,
  },
  {
    id: 'weekly_xp_1000',
    type: 'weekly',
    title: 'XP Champion',
    description: 'Earn 1000 XP this week',
    category: 'xp',
    targetValue: 1000,
    rarity: 'epic',
    baseXp: 350,
  },
  {
    id: 'weekly_beat_last',
    type: 'weekly',
    title: 'Beat Last Week',
    description: 'Earn more XP than last week',
    category: 'xp',
    targetValue: 1,
    rarity: 'rare',
    baseXp: 200,
    minStreak: 7,
  },
  {
    id: 'weekly_problems_20',
    type: 'weekly',
    title: 'Problem Machine',
    description: 'Solve 20 problems this week',
    category: 'dsa',
    targetValue: 20,
    rarity: 'epic',
    baseXp: 400,
  },
  {
    id: 'weekly_hard_5',
    type: 'weekly',
    title: 'Hard Mode',
    description: 'Solve 5 hard problems this week',
    category: 'dsa',
    targetValue: 5,
    rarity: 'legendary',
    baseXp: 500,
  },
];

// Milestone challenge templates
const MILESTONE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'milestone_50_problems',
    type: 'milestone',
    title: 'Half Century',
    description: 'Solve 50 total problems',
    category: 'dsa',
    targetValue: 50,
    rarity: 'rare',
    baseXp: 300,
  },
  {
    id: 'milestone_100_problems',
    type: 'milestone',
    title: 'Century Club',
    description: 'Solve 100 total problems',
    category: 'dsa',
    targetValue: 100,
    rarity: 'epic',
    baseXp: 600,
    badgeReward: 'century_club',
  },
  {
    id: 'milestone_1000_xp',
    type: 'milestone',
    title: 'XP Master',
    description: 'Earn 1000 total XP',
    category: 'xp',
    targetValue: 1000,
    rarity: 'rare',
    baseXp: 250,
  },
  {
    id: 'milestone_level_10',
    type: 'milestone',
    title: 'Level 10',
    description: 'Reach level 10',
    category: 'level',
    targetValue: 10,
    rarity: 'epic',
    baseXp: 500,
    badgeReward: 'level_10',
  },
];

// Comeback challenge templates
const COMEBACK_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'comeback_streak_restore',
    type: 'comeback',
    title: 'Streak Resurrection',
    description: 'Restore your streak to 3 days',
    category: 'streak',
    targetValue: 3,
    rarity: 'rare',
    baseXp: 200,
    requiresInactiveDays: 3,
  },
  {
    id: 'comeback_first_week',
    type: 'comeback',
    title: 'Welcome Back',
    description: 'Log activity 5 times in your first week back',
    category: 'activity',
    targetValue: 5,
    rarity: 'common',
    baseXp: 100,
    requiresInactiveDays: 7,
  },
  {
    id: 'comeback_xp_boost',
    type: 'comeback',
    title: 'XP Comeback',
    description: 'Earn 500 XP in your first week back',
    category: 'xp',
    targetValue: 500,
    rarity: 'epic',
    baseXp: 400,
    requiresInactiveDays: 7,
  },
];

// Hidden challenge templates (special conditions)
const HIDDEN_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'hidden_early_bird',
    type: 'hidden',
    title: 'Early Bird',
    description: 'Log activity before 7 AM',
    category: 'time',
    targetValue: 1,
    rarity: 'rare',
    baseXp: 75,
  },
  {
    id: 'hidden_night_owl',
    type: 'hidden',
    title: 'Night Owl',
    description: 'Log activity after 11 PM',
    category: 'time',
    targetValue: 1,
    rarity: 'rare',
    baseXp: 75,
  },
  {
    id: 'hidden_weekend_warrior',
    type: 'hidden',
    title: 'Weekend Warrior',
    description: 'Solve 10 problems on a weekend',
    category: 'dsa',
    targetValue: 10,
    rarity: 'epic',
    baseXp: 200,
  },
];

export interface ChallengeAssignmentOptions {
  userStreak: number;
  trustScore: number;
  daysInactive: number;
  recentCompletedChallenges: string[];
}

// Challenge generator
export const challengeGenerator = {
  // Get daily challenges for a user
  getDailyChallenges(options: ChallengeAssignmentOptions): ChallengeTemplate[] {
    return this.selectChallenges(DAILY_TEMPLATES, options, 2);
  },

  // Get weekly challenges for a user
  getWeeklyChallenges(options: ChallengeAssignmentOptions): ChallengeTemplate[] {
    return this.selectChallenges(WEEKLY_TEMPLATES, options, 2);
  },

  // Get milestone challenges based on user stats
  getMilestoneChallenges(currentProblems: number): ChallengeTemplate[] {
    const available = MILESTONE_TEMPLATES.filter(
      (t) => currentProblems < t.targetValue
    );
    return available.slice(0, 2);
  },

  // Get comeback challenges for returning user
  getComebackChallenges(options: ChallengeAssignmentOptions): ChallengeTemplate[] {
    if (options.daysInactive < 3) return [];

    return COMEBACK_TEMPLATES.filter(
      (t) => t.requiresInactiveDays && options.daysInactive >= t.requiresInactiveDays
    );
  },

  // Get hidden challenges (rare special triggers)
  getHiddenChallenges(): ChallengeTemplate[] {
    return HIDDEN_TEMPLATES.filter(() => Math.random() < 0.05); // 5% chance
  },

  // Select challenges based on user profile
  selectChallenges(
    templates: ChallengeTemplate[],
    options: ChallengeAssignmentOptions,
    count: number
  ): ChallengeTemplate[] {
    // Filter by trust score (don't give hard challenges to low-trust users)
    const eligible = templates.filter((t) => {
      if (options.trustScore < 50 && t.rarity !== 'common') return false;
      if (t.minStreak && options.userStreak < t.minStreak) return false;
      if (t.maxStreak && options.userStreak > t.maxStreak) return false;
      if (options.recentCompletedChallenges.includes(t.id)) return false;
      return true;
    });

    // Shuffle and select
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },

  // Calculate XP reward with trust and rarity scaling
  calculateXpReward(template: ChallengeTemplate, trustScore: number): number {
    const trustMultiplier = trustScore < 50 ? 0.5 : trustScore > 90 ? 1.2 : 1.0;
    const rarityMultiplier = {
      common: 1.0,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0,
    }[template.rarity];

    return Math.floor(template.baseXp * trustMultiplier * rarityMultiplier);
  },

  // Calculate expiration based on type
  calculateExpiration(type: ChallengeType): Date {
    const now = new Date();
    switch (type) {
      case 'daily':
        const endOfDay = new Date(now);
        endOfDay.setUTCHours(23, 59, 59, 999);
        return endOfDay;
      case 'weekly':
        const endOfWeek = new Date(now);
        const dayOfWeek = endOfWeek.getUTCDay();
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        endOfWeek.setUTCDate(endOfWeek.getUTCDate() + daysUntilSunday);
        endOfWeek.setUTCHours(23, 59, 59, 999);
        return endOfWeek;
      case 'comeback':
        const comebackEnd = new Date(now);
        comebackEnd.setDate(comebackEnd.getDate() + 7);
        comebackEnd.setUTCHours(23, 59, 59, 999);
        return comebackEnd;
      default:
        // Milestone/seasonal - no expiration
        const farFuture = new Date(now);
        farFuture.setFullYear(farFuture.getFullYear() + 1);
        return farFuture;
    }
  },
};

export default challengeGenerator;