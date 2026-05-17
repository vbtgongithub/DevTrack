// src/modules/retention-v2/profile/retentionProfile.service.ts — Retention Profile Engine
// Phase-D: Central behavioral intelligence with precomputed profiles

import { Types } from 'mongoose';
import { RetentionProfile, type BehavioralState } from './retentionProfile.model.js';
import { UserAnalytics, UserXp } from '../../../db/models/index.js';
import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';

const PROFILE_KEYS = {
  cooldown: (userId: string) => `profile:cooldown:${userId}`,
  pendingUpdate: (userId: string) => `profile:pending:${userId}`,
};

export const retentionProfileService = {
  // ─── Get or create retention profile ─────────────────────────────────────
  async getProfile(userId: string): Promise<RetentionProfile | null> {
    return RetentionProfile.findOne({ userId: new Types.ObjectId(userId) });
  },

  // ─── Recalculate profile from scratch (replay-safe) ───────────────────────
  async rebuildProfile(userId: string): Promise<RetentionProfile> {
    const userObjId = new Types.ObjectId(userId);

    // Fetch source data
    const [analytics, userXp] = await Promise.all([
      UserAnalytics.findOne({ userId: userObjId }),
      UserXp.findOne({ userId: userObjId }),
    ]);

    // Calculate all behavioral scores
    const momentumScore = this.calculateMomentumScore(analytics, userXp);
    const fatigueScore = this.calculateFatigueScore(analytics, userXp);
    const burnoutProbability = this.calculateBurnoutProbability(analytics, userXp, fatigueScore);
    const comebackProbability = this.calculateComebackProbability(analytics);
    const engagementQuality = this.calculateEngagementQuality(analytics, userXp);
    const progressionHealth = this.calculateProgressionHealth(analytics, userXp);
    const rewardResponsiveness = this.calculateRewardResponsiveness(analytics, userXp);
    const challengeConsistency = this.calculateChallengeConsistency(analytics);
    const streakResilience = this.calculateStreakResilience(analytics);

    // Determine behavioral state
    const state = this.determineState(momentumScore, fatigueScore, burnoutProbability, analytics);

    // Update or create profile
    let profile = await RetentionProfile.findOne({ userId: userObjId });

    if (!profile) {
      profile = new RetentionProfile({ userId: userObjId });
    }

    // Update all fields
    profile.momentumScore = momentumScore;
    profile.fatigueScore = fatigueScore;
    profile.burnoutProbability = burnoutProbability;
    profile.comebackProbability = comebackProbability;
    profile.engagementQuality = engagementQuality;
    profile.progressionHealth = progressionHealth;
    profile.rewardResponsiveness = rewardResponsiveness;
    profile.challengeCompletionConsistency = challengeConsistency;
    profile.streakResilience = streakResilience;

    // Handle state transition
    if (profile.state !== state) {
      profile.previousState = profile.state;
      profile.state = state;
      profile.stateChangedAt = new Date();
      profile.stateDuration = 0;
    }

    // Update daily history
    profile.dailyMomentumHistory = this.updateHistory(profile.dailyMomentumHistory, momentumScore);
    profile.dailyFatigueHistory = this.updateHistory(profile.dailyFatigueHistory, fatigueScore);

    profile.computedAt = new Date();
    profile.lastUpdated = new Date();

    await profile.save();

    logger.info('[profile] Profile rebuilt', {
      userId,
      state,
      momentumScore,
      fatigueScore,
      burnoutProbability,
    });

    return profile;
  },

  // ─── Calculate momentum score ───────────────────────────────────────────
  calculateMomentumScore(analytics: any, userXp: any): number {
    if (!analytics || !analytics.weeklyXPHistory || analytics.weeklyXPHistory.length < 2) {
      return 0;
    }

    const recent = analytics.weeklyXPHistory.slice(0, 2);
    const previous = analytics.weeklyXPHistory.slice(2, 4);

    if (previous.length === 0) {
      return Math.min(100, recent[0].xp / 10); // Positive for any activity
    }

    const recentAvg = recent.reduce((sum: number, w: any) => sum + w.xp, 0) / recent.length;
    const prevAvg = previous.reduce((sum: number, w: any) => sum + w.xp, 0) / previous.length;

    const change = ((recentAvg - prevAvg) / Math.max(prevAvg, 1)) * 100;
    return Math.max(-100, Math.min(100, Math.round(change)));
  },

  // ─── Calculate fatigue score ───────────────────────────────────────────
  calculateFatigueScore(analytics: any, userXp: any): number {
    let fatigue = 0;

    // High daily XP = potential fatigue
    const todayXp = analytics?.weeklyXPHistory?.[0]?.xp ?? 0;
    if (todayXp > 300) fatigue += 30;
    if (todayXp > 500) fatigue += 20;

    // High daily activity count
    if (todayXp > 100) fatigue += 15;

    // Low reward responsiveness indicates frustration/fatigue
    const responsiveness = this.calculateRewardResponsiveness(analytics, userXp);
    if (responsiveness < 30) fatigue += 25;
    else if (responsiveness < 50) fatigue += 10;

    // Consecutive high-activity days
    const streakDays = analytics?.currentStreak ?? 0;
    if (streakDays > 14) fatigue += 15;
    if (streakDays > 21) fatigue += 20;

    return Math.min(100, fatigue);
  },

  // ─── Calculate burnout probability ──────────────────────────────────────
  calculateBurnoutProbability(analytics: any, userXp: any, fatigueScore: number): number {
    let probability = 0;

    // Fatigue is main indicator
    probability += fatigueScore * 0.5;

    // Declining momentum
    const momentum = this.calculateMomentumScore(analytics, userXp);
    if (momentum < -30) probability += 25;

    // Very long streaks with high activity
    if (analytics?.currentStreak > 30) probability += 20;

    // Low engagement quality
    const quality = this.calculateEngagementQuality(analytics, userXp);
    if (quality < 40) probability += 20;

    return Math.min(100, probability);
  },

  // ─── Calculate comeback probability ────────────────────────────────────
  calculateComebackProbability(analytics: any): number {
    if (!analytics || !analytics.lastActiveDate) return 0;

    const daysInactive = Math.floor(
      (Date.now() - analytics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only relevant for 3-30 day inactive users
    if (daysInactive < 3 || daysInactive > 30) return 0;

    let probability = 20;

    // Previous engagement level
    if (analytics.bestStreak >= 7) probability += 30;
    if (analytics.bestStreak >= 14) probability += 20;
    if (analytics.totalXp > 1000) probability += 20;

    // Time away factor (moderate inactivity = higher comeback probability)
    if (daysInactive >= 7 && daysInactive <= 14) probability += 15;

    return Math.min(100, probability);
  },

  // ─── Calculate engagement quality ───────────────────────────────────────
  calculateEngagementQuality(analytics: any, userXp: any): number {
    let quality = 50;

    // Positive factors
    if (analytics?.weeklyConsistencyScore > 70) quality += 15;
    if (analytics?.bestStreak >= 7) quality += 10;

    // Negative factors (raw activity without progress)
    const recentXp = analytics?.weeklyXPHistory?.[0]?.xp ?? 0;
    if (recentXp > 500 && (analytics?.currentLevel ?? 1) < 3) {
      quality -= 20; // Grinding without progression
    }

    // Balanced progression
    const level = userXp?.currentLevel ?? 1;
    const totalXp = userXp?.totalXp ?? 0;
    const expectedXp = level * 200; // Rough estimate
    if (totalXp > expectedXp * 1.5) quality -= 15; // Over-grinding

    return Math.max(0, Math.min(100, quality));
  },

  // ─── Calculate progression health ───────────────────────────────────────
  calculateProgressionHealth(analytics: any, userXp: any): number {
    let health = 70;

    // Good progression
    if ((userXp?.currentLevel ?? 1) >= 5) health += 10;

    // Healthy XP earning
    const recentXp = analytics?.weeklyXPHistory?.[0]?.xp ?? 0;
    if (recentXp > 50 && recentXp < 300) health += 10;

    // Streak balance
    const streak = analytics?.currentStreak ?? 0;
    if (streak >= 3 && streak <= 14) health += 10;
    if (streak > 30) health -= 15; // Potential over-engagement

    return Math.max(0, Math.min(100, health));
  },

  // ─── Calculate reward responsiveness ─────────────────────────────────────
  calculateRewardResponsiveness(analytics: any, userXp: any): number {
    // How well does the user respond to rewards vs grinding
    const recentXp = analytics?.weeklyXPHistory?.[0]?.xp ?? 0;
    const level = userXp?.currentLevel ?? 1;

    // Healthy ratio: XP should correlate with level progression
    if (level >= 1 && recentXp > 0) {
      const ratio = recentXp / (level * 100);
      if (ratio >= 0.8 && ratio <= 2.0) return 70;
      if (ratio > 2.0) return 40; // Grinding too much
      if (ratio < 0.8) return 50;
    }

    return 50;
  },

  // ─── Calculate challenge consistency ───────────────────────────────────
  calculateChallengeConsistency(analytics: any): number {
    // Placeholder - would track challenge completion rate
    return analytics?.weeklyConsistencyScore ?? 50;
  },

  // ─── Calculate streak resilience ───────────────────────────────────────
  calculateStreakResilience(analytics: any): number {
    const currentStreak = analytics?.currentStreak ?? 0;
    const bestStreak = analytics?.bestStreak ?? 0;

    if (bestStreak === 0) return 50;
    if (currentStreak >= bestStreak) return 80;
    if (currentStreak >= bestStreak * 0.7) return 60;
    return 40;
  },

  // ─── Determine behavioral state ─────────────────────────────────────────
  determineState(momentum: number, fatigue: number, burnout: number, analytics: any): BehavioralState {
    const daysSinceActive = analytics?.lastActiveDate
      ? Math.floor((Date.now() - analytics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const currentStreak = analytics?.currentStreak ?? 0;

    // Priority 1: Burnout risk
    if (burnout > 70) return 'burnout_risk';
    if (burnout > 50 && fatigue > 60) return 'fatigued';

    // Priority 2: Comeback candidate
    if (daysSinceActive >= 3 && daysSinceActive <= 30) {
      if (analytics?.bestStreak >= 7) return 'comeback_candidate';
    }

    // Priority 3: Streak at risk
    if (currentStreak >= 3 && daysSinceActive <= 1 && momentum < 0) {
      return 'streak_risk';
    }

    // Priority 4: High momentum
    if (momentum > 30 && currentStreak >= 7) return 'high_momentum';

    // Priority 5: Recovering
    if (fatigue > 40 && momentum < 0) return 'recovering';

    // Priority 6: Power user
    if (currentStreak >= 14 && analytics?.bestStreak >= 21) return 'power_user';

    // Priority 7: Engaged
    if (currentStreak >= 3 || momentum > 0) return 'engaged';

    // Priority 8: Onboarding
    if (currentStreak < 3 && (analytics?.totalXp ?? 0) < 100) return 'onboarding';

    // Default: New user
    return 'new_user';
  },

  // ─── Update history array ───────────────────────────────────────────────
  updateHistory(history: Array<{ date: string; score: number }>, newScore: number): Array<{ date: string; score: number }> {
    const today = new Date().toISOString().split('T')[0];
    const updated = history.filter((h) => h.date !== today);
    updated.push({ date: today, score: newScore });
    // Keep last 7 days
    return updated.slice(-7);
  },

  // ─── Queue async profile update ─────────────────────────────────────────
  async queueUpdate(userId: string): Promise<void> {
    const redis = getRedisClient();

    // Check cooldown (don't update too frequently)
    const cooldownKey = PROFILE_KEYS.cooldown(userId);
    const exists = await redis.exists(cooldownKey);
    if (exists) return;

    // Mark pending
    await redis.set(PROFILE_KEYS.pendingUpdate(userId), '1', 'EX', 60);
    await redis.set(cooldownKey, '1', 'EX', 300); // 5 min cooldown

    // In production, would queue a job here
    // For now, update synchronously but asynchronously
    setTimeout(() => {
      this.rebuildProfile(userId).catch((err) => {
        logger.warn('[profile] Async update failed', { error: err, userId });
      });
    }, 100);
  },
};

export default retentionProfileService;