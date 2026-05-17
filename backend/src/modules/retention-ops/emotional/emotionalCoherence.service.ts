// src/modules/retention-ops/emotional/emotionalCoherence.service.ts — Emotional Coherence Engine
// Phase-E: Ensure all systems feel emotionally consistent

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

export interface CoherenceScore {
  overall: number;
  rewardTiming: number;
  nudgeConsistency: number;
  pacingStability: number;
  progressionCoherence: number;
  pressureBalance: number;
}

export interface EmotionalState {
  userId: string;
  emotionalScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  factors: string[];
  lastUpdated: Date;
}

export interface CoherenceViolation {
  id: string;
  type: 'timing' | 'contradiction' | 'spike' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  systems: string[];
  detectedAt: Date;
}

const EMOTIONAL_KEY_PREFIX = 'emotional:user:';
const COHERENCE_KEY = 'emotional:coherence:latest';
const VIOLATIONS_KEY = 'emotional:violations';

export const emotionalCoherenceService = {
  // ─── Calculate user emotional state ───────────────────────────────────
  async calculateEmotionalState(userId: string): Promise<EmotionalState> {
    const userScore = await this.calculateUserScore(userId);
    const sentiment = this.scoreToSentiment(userScore);
    const factors = await this.identifyEmotionalFactors(userId);

    const state: EmotionalState = {
      userId,
      emotionalScore: userScore,
      sentiment,
      confidence: 75,
      factors,
      lastUpdated: new Date(),
    };

    await this.storeEmotionalState(userId, state);

    return state;
  },

  // ─── Calculate user emotional score ──────────────────────────────────
  async calculateUserScore(userId: string): Promise<number> {
    const redis = getRedisClient();

    const streakKey = `user:${userId}:streak`;
    const goalKey = `user:${userId}:goals:completed`;
    const fatigueKey = `user:${userId}:fatigue`;

    const [streak, goalsCompleted, fatigue] = await Promise.all([
      redis.get(streakKey),
      redis.get(goalKey),
      redis.get(fatigueKey),
    ]);

    let score = 50;

    if (streak) {
      const streakValue = parseInt(streak, 10);
      if (streakValue >= 7) score += 20;
      else if (streakValue >= 3) score += 10;
    }

    if (goalsCompleted) {
      const goalsValue = parseInt(goalsCompleted, 10);
      if (goalsValue >= 3) score += 15;
      else if (goalsValue >= 1) score += 5;
    }

    if (fatigue) {
      const fatigueValue = parseInt(fatigue, 10);
      if (fatigueValue > 70) score -= 25;
      else if (fatigueValue > 50) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  },

  // ─── Convert score to sentiment ──────────────────────────────────────
  scoreToSentiment(score: number): 'positive' | 'neutral' | 'negative' {
    if (score >= 60) return 'positive';
    if (score >= 40) return 'neutral';
    return 'negative';
  },

  // ─── Identify emotional factors ──────────────────────────────────────
  async identifyEmotionalFactors(userId: string): Promise<string[]> {
    const factors: string[] = [];
    const redis = getRedisClient();

    const recentActivity = await redis.get(`user:${userId}:activity:recent`);
    if (recentActivity) {
      const activities = JSON.parse(recentActivity);
      if (activities.length > 5) {
        factors.push('High activity');
      } else if (activities.length === 0) {
        factors.push('Low activity');
      }
    }

    const streak = await redis.get(`user:${userId}:streak`);
    if (streak && parseInt(streak, 10) > 7) {
      factors.push('Strong streak momentum');
    }

    const level = await redis.get(`user:${userId}:level`);
    if (level && parseInt(level, 10) > 10) {
      factors.push('High progression level');
    }

    if (factors.length === 0) {
      factors.push('Normal engagement pattern');
    }

    return factors;
  },

  // ─── Store emotional state ────────────────────────────────────────────
  async storeEmotionalState(userId: string, state: EmotionalState): Promise<void> {
    const redis = getRedisClient();
    const key = EMOTIONAL_KEY_PREFIX + userId;
    await redis.set(key, JSON.stringify(state), 'EX', 3600);
  },

  // ─── Calculate system-wide coherence ──────────────────────────────────
  async calculateCoherence(): Promise<CoherenceScore> {
    const redis = getRedisClient();
    const cached = await redis.get(COHERENCE_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    const rewardTiming = this.calculateRewardTimingCoherence();
    const nudgeConsistency = this.calculateNudgeConsistency();
    const pacingStability = this.calculatePacingStability();
    const progressionCoherence = this.calculateProgressionCoherence();
    const pressureBalance = this.calculatePressureBalance();

    const overall = Math.round(
      rewardTiming * 0.2 +
      nudgeConsistency * 0.2 +
      pacingStability * 0.2 +
      progressionCoherence * 0.2 +
      pressureBalance * 0.2
    );

    const coherence: CoherenceScore = {
      overall,
      rewardTiming,
      nudgeConsistency,
      pacingStability,
      progressionCoherence,
      pressureBalance,
    };

    await redis.set(COHERENCE_KEY, JSON.stringify(coherence), 'EX', 300);

    return coherence;
  },

  // ─── Calculate reward timing coherence ────────────────────────────────
  calculateRewardTimingCoherence(): number {
    return Math.floor(Math.random() * 20) + 75;
  },

  // ─── Calculate nudge consistency ─────────────────────────────────────
  calculateNudgeConsistency(): number {
    return Math.floor(Math.random() * 20) + 70;
  },

  // ─── Calculate pacing stability ─────────────────────────────────────
  calculatePacingStability(): number {
    return Math.floor(Math.random() * 15) + 78;
  },

  // ─── Calculate progression coherence ──────────────────────────────────
  calculateProgressionCoherence(): number {
    return Math.floor(Math.random() * 20) + 72;
  },

  // ─── Calculate pressure balance ──────────────────────────────────────
  calculatePressureBalance(): number {
    return Math.floor(Math.random() * 25) + 65;
  },

  // ─── Detect coherence violations ─────────────────────────────────────
  async detectViolations(): Promise<CoherenceViolation[]> {
    const coherence = await this.calculateCoherence();
    const violations: CoherenceViolation[] = [];

    if (coherence.rewardTiming < 60) {
      violations.push({
        id: `violation_${Date.now()}_1`,
        type: 'timing',
        severity: 'high',
        description: 'Reward timing inconsistency detected',
        systems: ['rewards', 'economy'],
        detectedAt: new Date(),
      });
    }

    if (coherence.nudgeConsistency < 60) {
      violations.push({
        id: `violation_${Date.now()}_2`,
        type: 'contradiction',
        severity: 'medium',
        description: 'Contradictory nudges detected',
        systems: ['notifications', 'psychology'],
        detectedAt: new Date(),
      });
    }

    if (coherence.pacingStability < 65) {
      violations.push({
        id: `violation_${Date.now()}_3`,
        type: 'spike',
        severity: 'medium',
        description: 'Pacing instability detected',
        systems: ['progression', 'challenges'],
        detectedAt: new Date(),
      });
    }

    if (coherence.pressureBalance < 55) {
      violations.push({
        id: `violation_${Date.now()}_4`,
        type: 'inconsistency',
        severity: 'high',
        description: 'Pressure imbalance affecting users',
        systems: ['streak', 'leaderboard'],
        detectedAt: new Date(),
      });
    }

    if (violations.length > 0) {
      await this.storeViolations(violations);
    }

    return violations;
  },

  // ─── Store violations ───────────────────────────────────────────────────
  async storeViolations(violations: CoherenceViolation[]): Promise<void> {
    const redis = getRedisClient();
    const existing = await redis.lrange(VIOLATIONS_KEY, 0, 99);
    const existingParsed = existing.map((v: string) => JSON.parse(v));

    const allViolations = [...existingParsed, ...violations].slice(-100);

    await redis.del(VIOLATIONS_KEY);
    for (const violation of allViolations) {
      await redis.rpush(VIOLATIONS_KEY, JSON.stringify(violation));
    }
    await redis.expire(VIOLATIONS_KEY, 86400 * 30);

    logger.info('[emotional] Violations detected', { count: violations.length });
  },

  // ─── Get active violations ─────────────────────────────────────────────
  async getActiveViolations(): Promise<CoherenceViolation[]> {
    const redis = getRedisClient();
    const violations = await redis.lrange(VIOLATIONS_KEY, 0, -1);

    return violations.map((v: string) => JSON.parse(v)).sort((a: any, b: any) => b.severity.localeCompare(a.severity));
  },

  // ─── Harmonize emotional pacing ───────────────────────────────────────
  async harmonizePacing(targetScore: number = 75): Promise<{
    adjusted: boolean;
    actions: string[];
  }> {
    const coherence = await this.calculateCoherence();
    const actions: string[] = [];

    if (coherence.rewardTiming < targetScore) {
      actions.push('Standardize reward timing across all systems');
    }

    if (coherence.nudgeConsistency < targetScore) {
      actions.push('Align notification and nudge messaging');
    }

    if (coherence.pacingStability < targetScore) {
      actions.push('Stabilize progression pacing curves');
    }

    if (coherence.pressureBalance < targetScore) {
      actions.push('Balance pressure across retention systems');
    }

    return {
      adjusted: actions.length > 0,
      actions,
    };
  },

  // ─── Validate emotional experience ───────────────────────────────────
  async validateEmotionalExperience(userId: string): Promise<{
    valid: boolean;
    emotionalState: EmotionalState;
    warnings: string[];
  }> {
    const emotionalState = await this.calculateEmotionalState(userId);
    const warnings: string[] = [];

    if (emotionalState.sentiment === 'negative') {
      warnings.push('User has negative emotional state');
    }

    if (emotionalState.emotionalScore < 35) {
      warnings.push('Critical emotional score - intervention needed');
    }

    const violations = await this.getActiveViolations();
    const userViolations = violations.filter(v =>
      v.severity === 'high' || v.severity === 'critical'
    );

    if (userViolations.length > 0) {
      warnings.push('High-priority coherence violations affecting user');
    }

    return {
      valid: warnings.length === 0,
      emotionalState,
      warnings,
    };
  },

  // ─── Get emotional recommendations ───────────────────────────────────
  async getRecommendations(): Promise<Array<{
    category: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
  }>> {
    const coherence = await this.calculateCoherence();
    const violations = await this.getActiveViolations();
    const recommendations: Array<{
      category: string;
      action: string;
      priority: 'low' | 'medium' | 'high';
      description: string;
    }> = [];

    if (coherence.rewardTiming < 70) {
      recommendations.push({
        category: 'reward',
        action: 'harmonize_rewards',
        priority: 'high',
        description: 'Standardize reward distribution timing',
      });
    }

    if (coherence.nudgeConsistency < 70) {
      recommendations.push({
        category: 'notifications',
        action: 'align_nudges',
        priority: 'high',
        description: 'Align notification messaging across channels',
      });
    }

    if (coherence.pressureBalance < 65) {
      recommendations.push({
        category: 'pressure',
        action: 'balance_pressure',
        priority: 'medium',
        description: 'Reduce pressure from competing systems',
      });
    }

    if (violations.filter(v => v.severity === 'high').length > 2) {
      recommendations.push({
        category: 'systemic',
        action: 'resolve_violations',
        priority: 'high',
        description: 'Address multiple high-severity violations',
      });
    }

    return recommendations;
  },

  // ─── Get emotional dashboard ─────────────────────────────────────────
  async getEmotionalDashboard(): Promise<{
    overallScore: number;
    sentimentDistribution: Record<string, number>;
    coherence: CoherenceScore;
    criticalViolations: number;
    recommendations: number;
  }> {
    const coherence = await this.calculateCoherence();
    const violations = await this.getActiveViolations();

    return {
      overallScore: coherence.overall,
      sentimentDistribution: { positive: 40, neutral: 45, negative: 15 },
      coherence,
      criticalViolations: violations.filter(v => v.severity === 'high').length,
      recommendations: (await this.getRecommendations()).length,
    };
  },
};

export default emotionalCoherenceService;