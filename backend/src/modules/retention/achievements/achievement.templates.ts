// src/modules/retention/achievements/achievement.templates.ts — Badge definitions
// Phase-C2: Achievement templates with rarity tiers and dependencies

import type { AchievementRarity, AchievementCategory } from './achievement.model.js';

export interface AchievementTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  isHidden: boolean;
  isPrestige: boolean;
  prerequisites: string[];
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'streak' | 'problems' | 'xp' | 'level' | 'challenges' | 'goals' | 'special';
  value: number;
  operator?: 'gte' | 'eq' | 'lte';
}

// ─── Streak Achievements ──────────────────────────────────────────────────
const STREAK_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    xpReward: 25,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'streak', value: 3, operator: 'gte' },
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    xpReward: 75,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['streak_3'],
    condition: { type: 'streak', value: 7, operator: 'gte' },
  },
  {
    id: 'streak_14',
    name: 'Fortnight Force',
    description: 'Maintain a 14-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'rare',
    xpReward: 150,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['streak_7'],
    condition: { type: 'streak', value: 14, operator: 'gte' },
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'epic',
    xpReward: 300,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['streak_14'],
    condition: { type: 'streak', value: 30, operator: 'gte' },
  },
  {
    id: 'streak_100',
    name: 'Century Champion',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 1000,
    isHidden: false,
    isPrestige: true,
    prerequisites: ['streak_30'],
    condition: { type: 'streak', value: 100, operator: 'gte' },
  },
];

// ─── Problem Solving Achievements ───────────────────────────────────────────
const PROBLEM_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'problems_10',
    name: 'First Steps',
    description: 'Solve 10 problems',
    icon: '🎯',
    category: 'problems',
    rarity: 'common',
    xpReward: 25,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'problems', value: 10, operator: 'gte' },
  },
  {
    id: 'problems_50',
    name: 'Problem Solver',
    description: 'Solve 50 problems',
    icon: '🎯',
    category: 'problems',
    rarity: 'rare',
    xpReward: 100,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['problems_10'],
    condition: { type: 'problems', value: 50, operator: 'gte' },
  },
  {
    id: 'problems_100',
    name: 'Algorithm Ace',
    description: 'Solve 100 problems',
    icon: '🎯',
    category: 'problems',
    rarity: 'epic',
    xpReward: 250,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['problems_50'],
    condition: { type: 'problems', value: 100, operator: 'gte' },
  },
  {
    id: 'problems_500',
    name: 'DSA Master',
    description: 'Solve 500 problems',
    icon: '🏆',
    category: 'problems',
    rarity: 'legendary',
    xpReward: 1000,
    isHidden: true,
    isPrestige: true,
    prerequisites: ['problems_100'],
    condition: { type: 'problems', value: 500, operator: 'gte' },
  },
];

// ─── XP Achievements ──────────────────────────────────────────────────────
const XP_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'xp_500',
    name: 'XP Hunter',
    description: 'Earn 500 XP',
    icon: '⚡',
    category: 'xp',
    rarity: 'common',
    xpReward: 25,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'xp', value: 500, operator: 'gte' },
  },
  {
    id: 'xp_2500',
    name: 'XP Champion',
    description: 'Earn 2500 XP',
    icon: '⚡',
    category: 'xp',
    rarity: 'rare',
    xpReward: 100,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['xp_500'],
    condition: { type: 'xp', value: 2500, operator: 'gte' },
  },
  {
    id: 'xp_10000',
    name: 'XP Legend',
    icon: '⚡',
    category: 'xp',
    rarity: 'legendary',
    xpReward: 500,
    description: 'Earn 10000 XP',
    isHidden: true,
    isPrestige: true,
    prerequisites: ['xp_2500'],
    condition: { type: 'xp', value: 10000, operator: 'gte' },
  },
];

// ─── Level Achievements ───────────────────────────────────────────────────
const LEVEL_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⬆️',
    category: 'level',
    rarity: 'common',
    xpReward: 50,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'level', value: 5, operator: 'gte' },
  },
  {
    id: 'level_10',
    name: 'Level Master',
    description: 'Reach level 10',
    icon: '⬆️',
    category: 'level',
    rarity: 'rare',
    xpReward: 150,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['level_5'],
    condition: { type: 'level', value: 10, operator: 'gte' },
  },
  {
    id: 'level_15',
    name: 'Elite Coder',
    description: 'Reach level 15',
    icon: '💎',
    category: 'level',
    rarity: 'epic',
    xpReward: 500,
    isHidden: false,
    isPrestige: true,
    prerequisites: ['level_10'],
    condition: { type: 'level', value: 15, operator: 'gte' },
  },
];

// ─── Challenge/Goal Achievements ──────────────────────────────────────────
const CHALLENGE_GOAL_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'first_goal',
    name: 'Goal Getter',
    description: 'Complete your first goal',
    icon: '🎯',
    category: 'goal',
    rarity: 'common',
    xpReward: 25,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'goals', value: 1, operator: 'gte' },
  },
  {
    id: 'first_challenge',
    name: 'Challenge Accepted',
    description: 'Complete your first challenge',
    icon: '🏆',
    category: 'challenge',
    rarity: 'common',
    xpReward: 25,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'challenges', value: 1, operator: 'gte' },
  },
  {
    id: 'challenge_10',
    name: 'Challenge Seeker',
    description: 'Complete 10 challenges',
    icon: '🏆',
    category: 'challenge',
    rarity: 'rare',
    xpReward: 100,
    isHidden: false,
    isPrestige: false,
    prerequisites: ['first_challenge'],
    condition: { type: 'challenges', value: 10, operator: 'gte' },
  },
];

// ─── Special Achievements ─────────────────────────────────────────────────
const SPECIAL_ACHIEVEMENTS: AchievementTemplate[] = [
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Return after 7+ days of inactivity',
    icon: '🌟',
    category: 'special',
    rarity: 'rare',
    xpReward: 100,
    isHidden: false,
    isPrestige: false,
    prerequisites: [],
    condition: { type: 'special', value: 7, operator: 'gte' },
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join during the initial launch period',
    icon: '🚀',
    category: 'special',
    rarity: 'legendary',
    xpReward: 500,
    isHidden: true,
    isPrestige: true,
    prerequisites: [],
    condition: { type: 'special', value: 1, operator: 'eq' },
  },
];

// ─── All Templates ─────────────────────────────────────────────────────────

export const ACHIEVEMENT_TEMPLATES: AchievementTemplate[] = [
  ...STREAK_ACHIEVEMENTS,
  ...PROBLEM_ACHIEVEMENTS,
  ...XP_ACHIEVEMENTS,
  ...LEVEL_ACHIEVEMENTS,
  ...CHALLENGE_GOAL_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
];

// Lookup functions
export function getTemplateById(id: string): AchievementTemplate | undefined {
  return ACHIEVEMENT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: AchievementCategory): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByRarity(rarity: AchievementRarity): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES.filter((t) => t.rarity === rarity);
}

export function getHiddenTemplates(): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES.filter((t) => t.isHidden);
}

export function getPrestigeTemplates(): AchievementTemplate[] {
  return ACHIEVEMENT_TEMPLATES.filter((t) => t.isPrestige);
}

export default ACHIEVEMENT_TEMPLATES;