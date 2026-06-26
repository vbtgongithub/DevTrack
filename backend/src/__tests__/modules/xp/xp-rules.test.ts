// src/__tests__/modules/xp/xp-rules.test.ts
// Unit tests for XP rules — pure function coverage for level calculations,
// milestone XP, difficulty rewards, and streak multipliers.

import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  getXpLevelInfo,
  xpToNextLevel,
  xpInCurrentLevel,
  xpProgressPercent,
  calculateMilestoneXp,
  xpForDifficulty,
  calculateStreakBonus,
  calculateStreakMultiplier,
  XP_REWARDS,
  XP_LEVEL_THRESHOLDS,
  MAX_LEVEL,
} from '../../../modules/xp/rules.js';

describe('XP Rules — calculateLevel', () => {
  it('should return level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('should return level 1 for XP below level 2 threshold', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('should return level 2 at exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('should return level 5 at exactly 850 XP', () => {
    expect(calculateLevel(850)).toBe(5);
  });

  it('should return level 10 at exactly 4000 XP', () => {
    expect(calculateLevel(4000)).toBe(10);
  });

  it('should cap at MAX_LEVEL for very high XP', () => {
    expect(calculateLevel(999999)).toBe(MAX_LEVEL);
  });

  it('should return MAX_LEVEL at exactly the max threshold', () => {
    expect(calculateLevel(XP_LEVEL_THRESHOLDS[MAX_LEVEL])).toBe(MAX_LEVEL);
  });
});

describe('XP Rules — getXpLevelInfo', () => {
  it('should return level 1 info for 0 XP', () => {
    const info = getXpLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.isMaxLevel).toBe(false);
    expect(info.xpToNextLevel).toBe(100); // Need 100 XP to reach level 2
    expect(info.progressPercent).toBeGreaterThanOrEqual(0);
  });

  it('should return 100% progress at max level', () => {
    const info = getXpLevelInfo(XP_LEVEL_THRESHOLDS[MAX_LEVEL]);
    expect(info.level).toBe(MAX_LEVEL);
    expect(info.isMaxLevel).toBe(true);
    expect(info.progressPercent).toBe(100);
    expect(info.xpToNextLevel).toBe(0);
  });

  it('should calculate mid-level progress correctly', () => {
    // Level 2: prevLevelEntry is level 1 (threshold=0), nextLevelEntry is level 3 (threshold=250)
    // At 175 XP: progress = (175 - 0) / (250 - 0) * 100 = 70%
    const info = getXpLevelInfo(175);
    expect(info.level).toBe(2);
    expect(info.isMaxLevel).toBe(false);
    expect(info.progressPercent).toBe(70);
  });

  it('should return correct xpInCurrentLevel', () => {
    // At 150 XP: level 2 (starts at 100), so xpInCurrentLevel should be based on prev level threshold
    const info = getXpLevelInfo(150);
    expect(info.level).toBe(2);
    expect(info.xpInCurrentLevel).toBeGreaterThan(0);
  });
});

describe('XP Rules — xpToNextLevel', () => {
  it('should return XP needed to reach next level', () => {
    // At level 1, 0 XP: need 100 to reach level 2
    expect(xpToNextLevel(0, 1)).toBe(100);
  });

  it('should return 0 at max level', () => {
    expect(xpToNextLevel(11000, MAX_LEVEL)).toBe(0);
  });

  it('should return correct remaining XP mid-level', () => {
    // At level 2, 150 XP: need 250 - 150 = 100 to reach level 3
    expect(xpToNextLevel(150, 2)).toBe(100);
  });
});

describe('XP Rules — xpInCurrentLevel', () => {
  it('should return 0 at level 1 with 0 XP', () => {
    expect(xpInCurrentLevel(0, 1)).toBe(0);
  });

  it('should return XP above previous level threshold', () => {
    // Level 2, 150 XP: prev level 1 threshold = 0, so xpInCurrentLevel = 150
    expect(xpInCurrentLevel(150, 2)).toBe(150);
  });

  it('should return XP above prev threshold at level 5', () => {
    // Level 5 starts at 850, prev level (4) threshold = 500
    // At 900 XP: xpInCurrentLevel = 900 - 500 = 400
    expect(xpInCurrentLevel(900, 5)).toBe(400);
  });
});

describe('XP Rules — xpProgressPercent', () => {
  it('should return 0% at start of a level', () => {
    // Level 2 starts at 100, prev threshold (level 1) = 0
    // At exactly 0 XP and level 1: progress = 0/100 * 100 = 0%
    expect(xpProgressPercent(0, 1)).toBe(0);
  });

  it('should return 100% for max level', () => {
    // At max level (15), xpProgressPercent should return 100
    expect(xpProgressPercent(11000, MAX_LEVEL)).toBe(100);
  });

  it('should cap at 100%', () => {
    expect(xpProgressPercent(999999, MAX_LEVEL)).toBe(100);
  });
});

describe('XP Rules — calculateMilestoneXp', () => {
  it('should return 0 for less than 10 problems solved', () => {
    expect(calculateMilestoneXp(0)).toBe(0);
    expect(calculateMilestoneXp(5)).toBe(0);
    expect(calculateMilestoneXp(9)).toBe(0);
  });

  it('should return 25 for 10 problems solved', () => {
    expect(calculateMilestoneXp(10)).toBe(25);
  });

  it('should return 50 for 25 problems solved', () => {
    expect(calculateMilestoneXp(25)).toBe(50);
  });

  it('should return 100 for 50 problems solved', () => {
    expect(calculateMilestoneXp(50)).toBe(100);
  });

  it('should return 200 for 100 problems solved', () => {
    expect(calculateMilestoneXp(100)).toBe(200);
  });

  it('should return 400 for 200 problems solved', () => {
    expect(calculateMilestoneXp(200)).toBe(400);
  });

  it('should return 1000 for 500 problems solved', () => {
    expect(calculateMilestoneXp(500)).toBe(1000);
  });

  it('should return highest milestone for counts above 500', () => {
    expect(calculateMilestoneXp(750)).toBe(1000);
  });

  it('should return correct milestone for in-between counts', () => {
    // 30 is between 25 and 50 milestones — should return 50 (25 problems milestone)
    expect(calculateMilestoneXp(30)).toBe(50);
  });
});

describe('XP Rules — xpForDifficulty', () => {
  it('should return correct XP for easy difficulty', () => {
    expect(xpForDifficulty('easy')).toBe(XP_REWARDS.dsaAccepted.easy);
  });

  it('should return correct XP for medium difficulty', () => {
    expect(xpForDifficulty('medium')).toBe(XP_REWARDS.dsaAccepted.medium);
  });

  it('should return correct XP for hard difficulty', () => {
    expect(xpForDifficulty('hard')).toBe(XP_REWARDS.dsaAccepted.hard);
  });

  it('should default to medium XP for null difficulty', () => {
    expect(xpForDifficulty(null)).toBe(XP_REWARDS.dsaAccepted.medium);
  });

  it('should default to medium XP for undefined difficulty', () => {
    expect(xpForDifficulty(undefined)).toBe(XP_REWARDS.dsaAccepted.medium);
  });
});

describe('XP Rules — calculateStreakBonus', () => {
  it('should return 0 for streaks under 7 days', () => {
    expect(calculateStreakBonus(0)).toBe(0);
    expect(calculateStreakBonus(3)).toBe(0);
    expect(calculateStreakBonus(6)).toBe(0);
  });

  it('should return one weekly bonus at 7 days', () => {
    expect(calculateStreakBonus(7)).toBe(XP_REWARDS.weeklyStreak);
  });

  it('should return two weekly bonuses at 14 days', () => {
    expect(calculateStreakBonus(14)).toBe(2 * XP_REWARDS.weeklyStreak);
  });

  it('should scale linearly with weeks', () => {
    expect(calculateStreakBonus(21)).toBe(3 * XP_REWARDS.weeklyStreak);
    expect(calculateStreakBonus(28)).toBe(4 * XP_REWARDS.weeklyStreak);
  });

  it('should round down partial weeks', () => {
    // 10 days = 1 full week, so only 1 bonus
    expect(calculateStreakBonus(10)).toBe(XP_REWARDS.weeklyStreak);
  });
});

describe('XP Rules — calculateStreakMultiplier', () => {
  it('should return base multiplier (1.0) for 0 streak', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0);
  });

  it('should add 0.1 per week of streak', () => {
    expect(calculateStreakMultiplier(7)).toBe(1.1);
    expect(calculateStreakMultiplier(14)).toBe(1.2);
  });

  it('should cap at 2.0 multiplier', () => {
    // 10 weeks = 70 days => base + 10*0.1 = 2.0
    expect(calculateStreakMultiplier(70)).toBe(2.0);
    // More than cap
    expect(calculateStreakMultiplier(200)).toBe(2.0);
  });

  it('should handle partial weeks (rounds down)', () => {
    // 10 days = 1 full week => 1.0 + 0.1 = 1.1
    expect(calculateStreakMultiplier(10)).toBe(1.1);
  });
});
