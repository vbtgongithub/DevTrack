// src/modules/retention/goals/goal.generator.ts — Goal generation algorithms
// Phase-C1: Adaptive goal generation with trust-aware scaling

import type { IGoal } from './goal.model.js';
import type { GoalType, GoalCategory, GoalDifficulty } from './goal.model.js';

export interface UserStats {
  trustScore: number;
  currentStreak: number;
  totalXp: number;
  currentLevel: number;
  dsaSolveCount: number;
  weeklyConsistencyScore: number;
  avgGoalCompletionRate: number;
  recentGoalDifficulties: number[]; // 1-3 scale
  weeklyXpHistory: Array<{ weekStart: Date; xp: number }>;
}

interface GoalTemplate {
  title: string;
  description: string;
  category: GoalCategory;
  targetValue: number;
  difficulty: GoalDifficulty;
  baseXp: number;
  isStreakLinked: boolean;
  isMomentumSensitive: boolean;
}

// Daily goal templates
const DAILY_TEMPLATES: GoalTemplate[] = [
  {
    title: 'Solve 3 Medium Problems',
    description: 'Complete 3 medium difficulty DSA problems today',
    category: 'dsa',
    targetValue: 3,
    difficulty: 'medium',
    baseXp: 150,
    isStreakLinked: true,
    isMomentumSensitive: true,
  },
  {
    title: 'Earn 150 XP',
    description: 'Earn 150 XP through any activity today',
    category: 'xp',
    targetValue: 150,
    difficulty: 'medium',
    baseXp: 50,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
  {
    title: 'Maintain Your Streak',
    description: 'Log activity today to preserve your streak',
    category: 'streak',
    targetValue: 1,
    difficulty: 'easy',
    baseXp: 25,
    isStreakLinked: true,
    isMomentumSensitive: false,
  },
  {
    title: 'Solve 1 Hard Problem',
    description: 'Complete one hard difficulty problem',
    category: 'dsa',
    targetValue: 1,
    difficulty: 'hard',
    baseXp: 100,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
  {
    title: 'Complete 5 Easy Problems',
    description: 'Solve 5 easy difficulty problems today',
    category: 'dsa',
    targetValue: 5,
    difficulty: 'easy',
    baseXp: 75,
    isStreakLinked: false,
    isMomentumSensitive: false,
  },
  {
    title: 'Solve 2 Graph Problems',
    description: 'Complete 2 graph algorithm problems',
    category: 'dsa',
    targetValue: 2,
    difficulty: 'hard',
    baseXp: 120,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
];

// Weekly goal templates
const WEEKLY_TEMPLATES: GoalTemplate[] = [
  {
    title: 'Solve 15 Medium Problems',
    description: 'Complete 15 medium difficulty problems this week',
    category: 'dsa',
    targetValue: 15,
    difficulty: 'medium',
    baseXp: 500,
    isStreakLinked: true,
    isMomentumSensitive: true,
  },
  {
    title: 'Earn 1000 XP This Week',
    description: 'Earn 1000 XP through any activities this week',
    category: 'xp',
    targetValue: 1000,
    difficulty: 'hard',
    baseXp: 200,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
  {
    title: 'Solve 5 Hard Problems',
    description: 'Complete 5 hard difficulty problems this week',
    category: 'dsa',
    targetValue: 5,
    difficulty: 'hard',
    baseXp: 400,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
  {
    title: 'Maintain 7-Day Streak',
    description: 'Log activity every day this week to maintain streak',
    category: 'streak',
    targetValue: 7,
    difficulty: 'hard',
    baseXp: 350,
    isStreakLinked: true,
    isMomentumSensitive: false,
  },
  {
    title: 'Beat Last Week\'s XP',
    description: 'Earn more XP than you did last week',
    category: 'xp',
    targetValue: 1,
    difficulty: 'medium',
    baseXp: 150,
    isStreakLinked: false,
    isMomentumSensitive: true,
  },
];

// Goal generation functions
export const goalGenerator = {
  // Generate daily goals for a user
  generateDailyGoals(userStats: UserStats): GoalTemplate[] {
    const goals = this.selectGoals(DAILY_TEMPLATES, userStats, 3);
    return goals.map((template) => this.adjustDifficulty(template, userStats));
  },

  // Generate weekly goals for a user
  generateWeeklyGoals(userStats: UserStats): GoalTemplate[] {
    const goals = this.selectGoals(WEEKLY_TEMPLATES, userStats, 2);
    return goals.map((template) => this.adjustDifficulty(template, userStats));
  },

  // Select appropriate goals based on user history
  selectGoals(templates: GoalTemplate[], userStats: UserStats, count: number): GoalTemplate[] {
    // Shuffle and select
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Ensure variety in categories
    const categories = selected.map((g) => g.category);
    if (!categories.includes('dsa')) {
      // Replace one with DSA goal if missing
      const dsaGoals = shuffled.filter((g) => g.category === 'dsa');
      if (dsaGoals.length > 0) {
        const idx = selected.findIndex((g) => g.category === 'xp');
        if (idx >= 0) selected[idx] = dsaGoals[0];
      }
    }

    return selected;
  },

  // Adjust goal difficulty based on user performance
  adjustDifficulty(template: GoalTemplate, userStats: UserStats): GoalTemplate {
    const adjusted = { ...template };

    // Calculate user skill level from history
    const avgDifficulty = userStats.recentGoalDifficulties.length > 0
      ? userStats.recentGoalDifficulties.reduce((a, b) => a + b, 0) / userStats.recentGoalDifficulties.length
      : 2;

    // Adjust target based on completion rate
    const completionRate = userStats.avgGoalCompletionRate;
    const multiplier = completionRate > 0.8 ? 1.3 : completionRate > 0.5 ? 1.0 : 0.7;

    // Adjust based on trust score (abuse prevention)
    const trustMultiplier = userStats.trustScore < 50 ? 0.5 : userStats.trustScore > 90 ? 1.2 : 1.0;

    // Apply streak momentum (easier goals when building streak)
    const streakMultiplier = userStats.currentStreak >= 7 && userStats.currentStreak < 14 ? 0.8 : 1.0;

    // Calculate final target value
    adjusted.targetValue = Math.max(
      1,
      Math.floor(template.targetValue * multiplier * trustMultiplier * streakMultiplier)
    );

    // Adjust difficulty rating
    if (userStats.trustScore < 50) {
      adjusted.difficulty = 'easy';
    } else if (userStats.trustScore > 90 && completionRate > 0.7) {
      adjusted.difficulty = 'hard';
    } else if (adjusted.targetValue > template.targetValue * 1.3) {
      adjusted.difficulty = 'hard';
    } else if (adjusted.targetValue < template.targetValue * 0.7) {
      adjusted.difficulty = 'easy';
    }

    // Scale XP reward based on difficulty
    const difficultyMultiplier = adjusted.difficulty === 'hard' ? 1.5 : adjusted.difficulty === 'easy' ? 0.7 : 1.0;
    adjusted.baseXp = Math.floor(template.baseXp * difficultyMultiplier * trustMultiplier);

    return adjusted;
  },

  // Calculate XP reward with trust scaling
  calculateXpReward(baseXp: number, trustScore: number, difficulty: GoalDifficulty): number {
    const trustMultiplier = 0.5 + (trustScore / 200); // 0.75 to 1.0
    const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'easy' ? 0.7 : 1.0;
    return Math.floor(baseXp * trustMultiplier * difficultyMultiplier);
  },

  // Check if goal is streak-linked
  isStreakGoal(category: GoalCategory): boolean {
    return category === 'streak';
  },

  // Check if goal is momentum-sensitive
  isMomentumGoal(category: GoalCategory): boolean {
    return category === 'xp' || category === 'dsa';
  },

  // Calculate expiration time
  calculateExpiration(type: GoalType): Date {
    const now = new Date();
    if (type === 'daily') {
      // End of today (user's local midnight would be ideal, using UTC for now)
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);
      return endOfDay;
    } else {
      // End of week (Sunday UTC)
      const endOfWeek = new Date(now);
      const dayOfWeek = endOfWeek.getUTCDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      endOfWeek.setUTCDate(endOfWeek.getUTCDate() + daysUntilSunday);
      endOfWeek.setUTCHours(23, 59, 59, 999);
      return endOfWeek;
    }
  },
};

export default goalGenerator;