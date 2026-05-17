// src/modules/retention/economy/progression.service.ts — Progression Economy Engine
// Phase-C1: Configurable XP curves, trust-weighted rewards, diminishing returns

import { XP_LEVEL_THRESHOLDS, XP_REWARDS, calculateLevel as baseCalculateLevel } from '../../xp/rules.js';
import { logger } from '../../../shared/logger.js';

// ─── Economy Configuration ──────────────────────────────────────────────────

export interface EconomyConfig {
  // XP curve variant (for experiments)
  xpCurveVariant: 'standard' | 'accelerated' | 'gradual';

  // Trust weighting
  trustWeightEnabled: boolean;
  minTrustMultiplier: number;
  maxTrustMultiplier: number;

  // Diminishing returns
  diminishingReturnsEnabled: boolean;
  diminishingReturnsWindow: number; // XP earned in this window triggers reduction
  diminishingReturnsFactor: number; // 0.0-1.0, lower = more aggressive

  // Momentum bonuses
  momentumBonusEnabled: boolean;
  positiveMomentumThreshold: number; // Score above this triggers bonus
  momentumBonusMultiplier: number; // Additional XP multiplier

  // Comeback bonuses
  comebackBonusEnabled: boolean;
  comebackDaysThreshold: number; // Days inactive before comeback bonus
  comebackBonusMultiplier: number;

  // Burnout protection
  burnoutProtectionEnabled: boolean;
  maxDailyXpCap: number; // Cap daily XP to prevent burnout
}

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  xpCurveVariant: 'standard',
  trustWeightEnabled: true,
  minTrustMultiplier: 0.5,
  maxTrustMultiplier: 1.5,
  diminishingReturnsEnabled: true,
  diminishingReturnsWindow: 1000, // XP in window
  diminishingReturnsFactor: 0.7,
  momentumBonusEnabled: true,
  positiveMomentumThreshold: 20,
  momentumBonusMultiplier: 1.2,
  comebackBonusEnabled: true,
  comebackDaysThreshold: 7,
  comebackBonusMultiplier: 1.5,
  burnoutProtectionEnabled: true,
  maxDailyXpCap: 500,
};

// Extended level thresholds for different variants
const XP_CURVE_VARIANTS = {
  standard: XP_LEVEL_THRESHOLDS,
  accelerated: {
    1: 0, 2: 75, 3: 175, 4: 350, 5: 600, 6: 900, 7: 1250,
    8: 1700, 9: 2250, 10: 2900, 11: 3650, 12: 4500, 13: 5450, 14: 6500, 15: 8000,
  },
  gradual: {
    1: 0, 2: 150, 3: 350, 4: 650, 5: 1050, 6: 1550, 7: 2150,
    8: 2900, 9: 3800, 10: 4850, 11: 6050, 12: 7400, 13: 8900, 14: 10500, 15: 12500,
  },
};

// ─── User Economy State ─────────────────────────────────────────────────────

export interface UserEconomyState {
  userId: string;
  trustScore: number;
  momentumScore: number; // -100 to +100
  daysSinceLastActive: number;
  recentXpEarned: number; // XP earned in current period
  currentDailyXp: number;
  lastXpEarnedAt: Date | null;
}

// ─── Progression Economy Service ────────────────────────────────────────────

export const progressionEconomy = {
  // ─── Calculate XP required for a level ───────────────────────────────────
  calculateXpForLevel(level: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    const thresholds = XP_CURVE_VARIANTS[config.xpCurveVariant] as Record<number, number>;
    return thresholds[level] ?? thresholds[15];
  },

  // ─── Calculate level from total XP ───────────────────────────────────────
  calculateLevelFromXp(totalXp: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    const thresholds = Object.entries(XP_CURVE_VARIANTS[config.xpCurveVariant])
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    let level = 1;
    for (const [lvl, threshold] of thresholds) {
      if (totalXp >= threshold) {
        level = parseInt(lvl, 10);
      } else {
        break;
      }
    }
    return level;
  },

  // ─── Calculate trust-weighted XP multiplier ───────────────────────────────
  calculateTrustMultiplier(trustScore: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    if (!config.trustWeightEnabled) return 1.0;

    const range = config.maxTrustMultiplier - config.minTrustMultiplier;
    const normalized = (trustScore / 100); // 0.0-1.0

    return config.minTrustMultiplier + (normalized * range);
  },

  // ─── Calculate momentum bonus multiplier ────────────────────────────────
  calculateMomentumMultiplier(momentumScore: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    if (!config.momentumBonusEnabled) return 1.0;
    if (momentumScore <= config.positiveMomentumThreshold) return 1.0;

    // Scale from 1.0 to momentumBonusMultiplier based on score
    const excessScore = Math.min(momentumScore - config.positiveMomentumThreshold, 80);
    const scale = excessScore / 80; // 0.0-1.0
    return 1.0 + (scale * (config.momentumBonusMultiplier - 1.0));
  },

  // ─── Calculate diminishing returns factor ────────────────────────────────
  calculateDiminishingReturns(recentXp: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    if (!config.diminishingReturnsEnabled) return 1.0;
    if (recentXp < config.diminishingReturnsWindow) return 1.0;

    // Calculate reduction factor
    const excess = recentXp - config.diminishingReturnsWindow;
    const reduction = Math.min(excess / config.diminishingReturnsWindow, 1.0);
    return Math.max(config.diminishingReturnsFactor, 1.0 - reduction);
  },

  // ─── Calculate comeback bonus multiplier ──────────────────────────────────
  calculateComebackMultiplier(daysInactive: number, config: EconomyConfig = DEFAULT_ECONOMY_CONFIG): number {
    if (!config.comebackBonusEnabled) return 1.0;
    if (daysInactive < config.comebackDaysThreshold) return 1.0;

    // Scale from 1.0 to comebackBonusMultiplier based on days
    const excessDays = Math.min(daysInactive - config.comebackDaysThreshold, 23);
    const scale = excessDays / 23; // 0.0-1.0
    return 1.0 + (scale * (config.comebackBonusMultiplier - 1.0));
  },

  // ─── Calculate final XP award with all modifiers ─────────────────────────
  calculateFinalXp(
    baseXp: number,
    state: UserEconomyState,
    config: EconomyConfig = DEFAULT_ECONOMY_CONFIG
  ): { finalXp: number; breakdown: Record<string, number> } {
    let totalXp = baseXp;
    const breakdown: Record<string, number> = { base: baseXp };

    // Apply trust weighting
    const trustMult = this.calculateTrustMultiplier(state.trustScore, config);
    const trustBonus = Math.floor(baseXp * (trustMult - 1));
    totalXp += trustBonus;
    breakdown.trust = trustBonus;

    // Apply momentum bonus
    const momentumMult = this.calculateMomentumMultiplier(state.momentumScore, config);
    const momentumBonus = Math.floor(baseXp * (momentumMult - 1));
    totalXp += momentumBonus;
    breakdown.momentum = momentumBonus;

    // Apply diminishing returns
    const diminishingFactor = this.calculateDiminishingReturns(state.recentXpEarned, config);
    const diminishingReduction = Math.floor(totalXp * (1 - diminishingFactor));
    totalXp -= diminishingReduction;
    breakdown.diminishing = -diminishingReduction;

    // Apply comeback bonus (for returning users)
    const comebackMult = this.calculateComebackMultiplier(state.daysSinceLastActive, config);
    const comebackBonus = Math.floor(baseXp * (comebackMult - 1));
    totalXp += comebackBonus;
    breakdown.comeback = comebackBonus;

    // Apply burnout protection (daily cap)
    if (config.burnoutProtectionEnabled) {
      const newDailyTotal = state.currentDailyXp + totalXp;
      if (newDailyTotal > config.maxDailyXpCap) {
        const capped = config.maxDailyXpCap - state.currentDailyXp;
        const cappedAmount = Math.max(0, capped);
        breakdown.burnoutCap = cappedAmount - totalXp;
        totalXp = cappedAmount;
      }
    }

    return { finalXp: Math.max(0, totalXp), breakdown };
  },

  // ─── Update user's economy state after XP award ──────────────────────────
  updateEconomyState(
    state: UserEconomyState,
    xpAwarded: number
  ): UserEconomyState {
    const now = new Date();
    const lastEarned = state.lastXpEarnedAt;

    // Reset daily XP if it's a new day
    let currentDailyXp = state.currentDailyXp;
    if (lastEarned) {
      const lastDate = lastEarned.toDateString();
      const today = now.toDateString();
      if (lastDate !== today) {
        currentDailyXp = 0;
      }
    }

    return {
      ...state,
      recentXpEarned: state.recentXpEarned + xpAwarded,
      currentDailyXp: currentDailyXp + xpAwarded,
      lastXpEarnedAt: now,
    };
  },

  // ─── Get next reward threshold for UI ────────────────────────────────────
  getNextRewardThreshold(currentXp: number, level: number): { xpNeeded: number; rewardName: string } | null {
    // Check for level-up
    const nextLevelXp = this.calculateXpForLevel(level + 1);
    if (nextLevelXp && currentXp < nextLevelXp) {
      return {
        xpNeeded: nextLevelXp - currentXp,
        rewardName: `Level ${level + 1}`,
      };
    }

    // Check for milestone rewards
    const milestones = [
      { xp: 100, name: 'First Steps' },
      { xp: 500, name: 'Getting Started' },
      { xp: 1000, name: 'Consistent Coder' },
      { xp: 2500, name: 'Problem Solver' },
      { xp: 5000, name: 'Dedicated Developer' },
      { xp: 10000, name: 'Elite Coder' },
    ];

    for (const milestone of milestones) {
      if (currentXp < milestone.xp) {
        return {
          xpNeeded: milestone.xp - currentXp,
          rewardName: milestone.name,
        };
      }
    }

    return null;
  },

  // ─── Calculate XP needed for next level ─────────────────────────────────
  getXpToNextLevel(currentXp: number, currentLevel: number): number {
    const nextLevelXp = this.calculateXpForLevel(currentLevel + 1);
    return nextLevelXp ? Math.max(0, nextLevelXp - currentXp) : 0;
  },

  // ─── Get economy config for experiment variant ───────────────────────────
  getConfigForVariant(variant: string): EconomyConfig {
    const config = { ...DEFAULT_ECONOMY_CONFIG };

    switch (variant) {
      case 'accelerated':
        config.xpCurveVariant = 'accelerated';
        break;
      case 'gradual':
        config.xpCurveVariant = 'gradual';
        break;
      case 'high_trust_bonus':
        config.trustWeightEnabled = true;
        config.maxTrustMultiplier = 2.0;
        break;
      case 'no_diminishing':
        config.diminishingReturnsEnabled = false;
        break;
      case 'high_comeback':
        config.comebackBonusEnabled = true;
        config.comebackBonusMultiplier = 2.0;
        break;
    }

    return config;
  },

  // ─── Log economy metrics for observability ───────────────────────────────
  logEconomyMetrics(userId: string, state: UserEconomyState): void {
    logger.debug('[economy] Metrics', {
      userId,
      trustScore: state.trustScore,
      momentumScore: state.momentumScore,
      recentXp: state.recentXpEarned,
      dailyXp: state.currentDailyXp,
      daysInactive: state.daysSinceLastActive,
    });
  },
};

export default progressionEconomy;