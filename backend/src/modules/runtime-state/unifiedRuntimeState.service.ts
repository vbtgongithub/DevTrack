// src/modules/runtime-state/unifiedRuntimeState.service.ts — Unified Runtime State Service
// Single source of truth for all progression systems.
// Event-driven, replay-safe, SSE-synchronized runtime state management.

import { Types } from 'mongoose';
import {
  UnifiedRuntimeState,
  UserXp,
  UserStreakLog,
  Goal,
  Challenge,
  Achievement,
  type IUnifiedRuntimeState,
  type MomentumState,
  type FatigueState,
  type EmotionalState,
  type RecoveryState,
  type OnboardingStage,
  type EngagementPressure,
  type NearMilestoneRef,
  type ProgressionPacing,
  type IUserXp,
} from '../../db/models/index.js';
import type { StreakStatus } from '../streak/streak.service.js';
import { eventBus } from '../../shared/sse/index.js';
import { logger } from '../../shared/logger.js';
import { getUserXp } from '../xp/processor.js';
import { getStreakStatus } from '../streak/streak.service.js';
import { retentionProfileService } from '../retention-v2/index.js';
import { fatigueSuppressionService } from '../retention-v2/index.js';
import { emotionalPacingService } from '../retention-v2/index.js';

export interface RuntimeStateEvent {
  eventId: string;
  eventType: string;
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface RebuildOptions {
  fromEventId?: string;
  force?: boolean;
}

// ─── Core Runtime State Service ─────────────────────────────────────────────

export class UnifiedRuntimeStateService {
  /**
   * Get or create unified runtime state for a user
   */
  async getRuntimeState(userId: string): Promise<IUnifiedRuntimeState | null> {
    const state = await UnifiedRuntimeState.findOne({ userId: new Types.ObjectId(userId) });
    return state;
  }

  /**
   * Get runtime state with auto-rebuild if stale
   */
  async getRuntimeStateFresh(userId: string): Promise<IUnifiedRuntimeState | null> {
    let state = await this.getRuntimeState(userId);
    
    // Rebuild if state doesn't exist or is stale (> 5 minutes old)
    if (!state || this.isStateStale(state)) {
      state = await this.rebuildRuntimeState(userId);
    }
    
    return state;
  }

  /**
   * Rebuild runtime state from source systems
   * Replay-safe: can be called multiple times with same eventId
   */
  async rebuildRuntimeState(userId: string, options?: RebuildOptions): Promise<IUnifiedRuntimeState> {
    const userObjId = new Types.ObjectId(userId);
    
    logger.info('[runtime-state] Rebuilding runtime state', { userId, options });
    
    // Fetch source data in parallel
    const [userXp, streakStatus, retentionProfile, activeGoals, activeChallenges, unlockedAchievements, userAnalytics] = await Promise.all([
      getUserXp(userId),
      getStreakStatus(userId, 'unified'),
      retentionProfileService.getProfile(userId).catch(() => null),
      Goal.find({ userId: userObjId, status: 'active' }),
      Challenge.find({ userId: userObjId, status: 'active' }),
      Achievement.find({ userId: userObjId, unlockedAt: { $ne: null } }),
      this.fetchUserAnalytics(userObjId),
    ]);

    // Calculate behavioral states
    const momentumState = this.calculateMomentumState(streakStatus, userXp as any);
    const fatigueState = await this.calculateFatigueState(userId, retentionProfile as any);
    const emotionalState = this.calculateEmotionalState(momentumState, fatigueState, streakStatus);
    const recoveryState = this.calculateRecoveryState(retentionProfile as any);
    const trustScore = this.calculateTrustScore(retentionProfile as any, userXp as any);

    // Calculate progression pacing
    const progressionPacing = await this.calculateProgressionPacing(userId, userXp as any, streakStatus);

    // Calculate near milestones
    const nearMilestones = this.calculateNearMilestones(userXp as any, streakStatus);

    // Determine onboarding stage
    const onboardingStage = this.determineOnboardingStage(userXp as any, streakStatus, activeGoals.length);

    // Determine engagement pressure
    const engagementPressure = this.determineEngagementPressure(fatigueState, momentumState);

    // Build active references
    const activeGoalRefs = activeGoals.map(goal => ({
      goalId: goal._id.toString(),
      progress: goal.currentValue,
      target: goal.targetValue,
      deadline: goal.expiresAt,
    }));

    const activeChallengeRefs = activeChallenges.map(challenge => ({
      challengeId: challenge._id.toString(),
      progress: challenge.currentValue,
      target: challenge.targetValue,
      startedAt: challenge.startedAt,
      expiresAt: challenge.expiresAt,
    }));

    const activeAchievementRefs = unlockedAchievements.map(achievement => ({
      achievementId: achievement._id.toString(),
      unlockedAt: achievement.unlockedAt!,
    }));

    // Calculate streak risk
    const streakRisk = this.calculateStreakRisk(streakStatus);

    // Derive denormalized stats
    const longestStreak = userAnalytics?.bestStreak ?? streakStatus.currentStreak;
    const daysActive = userAnalytics?.totalActiveDays ?? 0;
    const totalProblemsSolved = userAnalytics?.totalProblemsSolved ?? 0;

    // Build recent milestones from recent achievements (last 10)
    const recentMilestones = unlockedAchievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 10)
      .map(a => ({
        type: 'achievement_unlocked' as const,
        label: a.name ?? `Achievement ${a._id.toString().slice(-6)}`,
        occurredAt: a.unlockedAt!,
      }));

    // Create or update unified state
    const state = await UnifiedRuntimeState.findOneAndUpdate(
      { userId: userObjId },
      {
        $set: {
          xp: userXp?.totalXp ?? 0,
          level: userXp?.currentLevel ?? 1,
          xpToNextLevel: userXp?.xpToNextLevel ?? 100,
          streak: streakStatus.currentStreak,
          streakRisk,
          momentumState,
          fatigueState,
          trustScore,
          emotionalState,
          recoveryState,
          activeGoals: activeGoalRefs,
          activeChallenges: activeChallengeRefs,
          activeAchievements: activeAchievementRefs,
          progressionPacing,
          nearMilestones,
          longestStreak,
          daysActive,
          totalProblemsSolved,
          recentMilestones,
          onboardingStage,
          engagementPressure,
          lastEventId: options?.fromEventId ?? '',
          lastCalculatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logger.info('[runtime-state] Runtime state rebuilt', { userId, stateId: state._id });
    
    return state;
  }

  /**
   * Update runtime state incrementally based on event
   * Event-driven update for performance
   */
  async updateFromEvent(event: RuntimeStateEvent): Promise<IUnifiedRuntimeState> {
    const { userId, eventType, data } = event;
    
    logger.debug('[runtime-state] Updating from event', { userId, eventType });
    
    const state = await this.getRuntimeStateFresh(userId);
    if (!state) {
      return await this.rebuildRuntimeState(userId, { fromEventId: event.eventId });
    }

    const updates: Record<string, unknown> = {};
    const incUpdates: Record<string, number> = {};

    // Handle different event types
    switch (eventType) {
      case 'xp_awarded':
        incUpdates.xp = (data.xpAwarded as number) ?? 0;
        if (data.levelAfter) updates.level = data.levelAfter;
        if (data.xpToNextLevel) updates.xpToNextLevel = data.xpToNextLevel;
        break;
        
      case 'streak_updated':
        updates.streak = data.currentStreak;
        updates.streakRisk = this.calculateStreakRisk(data as any);
        updates.momentumState = this.calculateMomentumState(data as any, state as any);
        break;
        
      case 'goal_created':
      case 'goal_updated':
        await this.rebuildRuntimeState(userId, { fromEventId: event.eventId });
        return await this.getRuntimeState(userId) as IUnifiedRuntimeState;
        
      case 'challenge_started':
      case 'challenge_updated':
        await this.rebuildRuntimeState(userId, { fromEventId: event.eventId });
        return await this.getRuntimeState(userId) as IUnifiedRuntimeState;
        
      case 'achievement_unlocked':
        await this.rebuildRuntimeState(userId, { fromEventId: event.eventId });
        return await this.getRuntimeState(userId) as IUnifiedRuntimeState;
        
      default:
        // Unknown event type, trigger full rebuild
        return await this.rebuildRuntimeState(userId, { fromEventId: event.eventId });
    }

    // Apply updates
    const updateDoc: Record<string, unknown> = {
      lastEventId: event.eventId,
      lastCalculatedAt: new Date(),
    };
    
    if (Object.keys(updates).length > 0) {
      updateDoc.$set = updates;
    }
    if (Object.keys(incUpdates).length > 0) {
      updateDoc.$inc = incUpdates;
    }

    const updatedState = await UnifiedRuntimeState.findByIdAndUpdate(
      state._id,
      updateDoc,
      { new: true }
    );

    // Emit SSE event for runtime state update (delta/patch)
    const delta: Record<string, unknown> = {};
    if (Object.keys(updates).length > 0) {
      Object.assign(delta, updates);
    }
    if (Object.keys(incUpdates).length > 0) {
      Object.assign(delta, incUpdates);
    }
    
    if (Object.keys(delta).length > 0) {
      void eventBus.emitRuntimeStatePatch(userId, delta);
    }

    return updatedState!;
  }

  /**
   * Invalidate runtime state (force rebuild on next access)
   */
  async invalidateState(userId: string): Promise<void> {
    await UnifiedRuntimeState.deleteOne({ userId: new Types.ObjectId(userId) });
    logger.debug('[runtime-state] State invalidated', { userId });
  }

  // ─── Behavioral State Calculations ───────────────────────────────────────────

  private calculateMomentumState(streakStatus: StreakStatus, userXp: IUserXp | null): MomentumState {
    if (!streakStatus || !userXp) return 'building';
    
    const { currentStreak } = streakStatus;
    const { totalXp } = userXp;
    
    // Determine streak trend from current streak and best streak
    const streakTrend = this.determineStreakTrend(currentStreak, streakStatus.bestStreak);
    
    if (currentStreak === 0) return 'dormant';
    if (streakTrend === 'increasing' && totalXp > 1000) return 'building';
    if (streakTrend === 'stable' && currentStreak >= 7) return 'stable';
    if (streakTrend === 'decreasing') return 'declining';
    if (streakTrend === 'recovering') return 'recovering';
    
    return 'building';
  }

  private determineStreakTrend(currentStreak: number, bestStreak: number): 'increasing' | 'stable' | 'decreasing' | 'recovering' {
    if (currentStreak >= bestStreak * 0.9) return 'increasing';
    if (currentStreak >= bestStreak * 0.7) return 'stable';
    if (currentStreak >= bestStreak * 0.3) return 'decreasing';
    return 'recovering';
  }

  private async calculateFatigueState(userId: string, retentionProfile: { behavioralState?: { inRecoveryMode?: boolean; recoveryPaused?: boolean; recoveryComplete?: boolean } } | null): Promise<FatigueState> {
    if (!retentionProfile) return 'none';
    
    try {
      const fatigueIndicators = await fatigueSuppressionService.detectFatigueIndicators(userId);
      if (!fatigueIndicators) return 'none';
      
      const { excessiveGrinding, decliningConsistency, frustrationIndicators } = fatigueIndicators;
      
      if (excessiveGrinding && frustrationIndicators) return 'burnout';
      if (excessiveGrinding || frustrationIndicators) return 'high';
      if (decliningConsistency) return 'moderate';
      if (excessiveGrinding) return 'low';
      
      return 'none';
    } catch (error) {
      logger.warn('[runtime-state] Failed to calculate fatigue state', { userId, error });
      return 'none';
    }
  }

  private calculateEmotionalState(momentum: MomentumState, fatigue: FatigueState, streak: StreakStatus): EmotionalState {
    if (fatigue === 'burnout') return 'overwhelmed';
    if (fatigue === 'high') return 'discouraged';
    if (momentum === 'building') return 'motivated';
    if (momentum === 'stable') return 'focused';
    if (momentum === 'declining') return 'discouraged';
    if (momentum === 'recovering') return 'calm';
    
    return 'neutral';
  }

  private calculateRecoveryState(retentionProfile: { behavioralState?: { inRecoveryMode?: boolean; recoveryPaused?: boolean; recoveryComplete?: boolean } } | null): RecoveryState {
    if (!retentionProfile) return 'none';
    
    const { inRecoveryMode, recoveryPaused, recoveryComplete } = retentionProfile.behavioralState || {};
    
    if (recoveryComplete) return 'complete';
    if (recoveryPaused) return 'paused';
    if (inRecoveryMode) return 'active';
    
    return 'none';
  }

  private calculateTrustScore(retentionProfile: { engagementQuality?: number } | null, userXp: IUserXp | null): number {
    // Trust score based on consistency, engagement quality, and system reliability
    let trust = 0.5;
    const xpAny = userXp as any;
    
    if (xpAny?.lifetimeStats?.weeklyConsistencyScore) {
      trust += (xpAny.lifetimeStats.weeklyConsistencyScore / 100) * 0.3;
    }
    
    if (retentionProfile?.engagementQuality) {
      trust += retentionProfile.engagementQuality * 0.2;
    }
    
    return Math.min(Math.max(trust, 0), 1);
  }

  private async calculateProgressionPacing(userId: string, userXp: IUserXp | null, streakStatus: StreakStatus): Promise<ProgressionPacing> {
    try {
      const pacingConfig = await emotionalPacingService.getPacingConfig(userId);
      
      // Use default values since PacingConfig doesn't have these fields
      const optimalSessionLength = 30; // Default 30 minutes
      const recommendedBreakInterval = 60; // Default 60 minutes
      
      return {
        dailyXpRate: userXp?.totalXp ? Math.round(userXp.totalXp / 30) : 0, // Rough estimate
        weeklyXpRate: userXp?.totalXp ? Math.round(userXp.totalXp / 4) : 0,
        streakGrowthRate: 0, // Will be calculated from streak history
        optimalSessionLength,
        recommendedBreakInterval,
      };
    } catch (error) {
      logger.warn('[runtime-state] Failed to calculate progression pacing', { userId, error });
      return {
        dailyXpRate: 0,
        weeklyXpRate: 0,
        streakGrowthRate: 0,
        optimalSessionLength: 30,
        recommendedBreakInterval: 60,
      };
    }
  }

  private calculateNearMilestones(userXp: IUserXp | null, streakStatus: StreakStatus): NearMilestoneRef[] {
    const milestones: NearMilestoneRef[] = [];
    
    if (userXp) {
      // Level milestone
      const levelProgress = userXp.xpToNextLevel > 0 ? (userXp.xpToNextLevel - userXp.totalXp) / userXp.xpToNextLevel : 0;
      if (levelProgress < 0.3 && levelProgress >= 0) {
        milestones.push({
          type: 'level',
          current: userXp.currentLevel,
          target: userXp.currentLevel + 1,
          progressPercent: (1 - levelProgress) * 100,
        });
      }
      
      // XP milestone (every 1000 XP)
      const nextXpMilestone = Math.ceil(userXp.totalXp / 1000) * 1000;
      const xpProgress = (nextXpMilestone - userXp.totalXp) / 1000;
      if (xpProgress < 0.3 && xpProgress >= 0) {
        milestones.push({
          type: 'xp',
          current: userXp.totalXp,
          target: nextXpMilestone,
          progressPercent: (1 - xpProgress) * 100,
        });
      }
    }
    
    if (streakStatus) {
      // Streak milestone (every 7 days)
      const nextStreakMilestone = Math.ceil(streakStatus.currentStreak / 7) * 7;
      if (nextStreakMilestone > streakStatus.currentStreak && nextStreakMilestone - streakStatus.currentStreak <= 2) {
        milestones.push({
          type: 'streak',
          current: streakStatus.currentStreak,
          target: nextStreakMilestone,
          progressPercent: ((streakStatus.currentStreak % 7) / 7) * 100,
        });
      }
    }
    
    return milestones;
  }

  private determineOnboardingStage(userXp: IUserXp | null, streakStatus: StreakStatus, activeGoalsCount: number): OnboardingStage {
    if (!userXp || userXp.totalXp === 0) return 'new';
    if (userXp.lifetimeStats?.totalProblemsSolved === 1) return 'first_problem';
    if (streakStatus?.currentStreak === 1) return 'first_streak';
    if (activeGoalsCount > 0) return 'first_challenge';
    return 'active';
  }

  private determineEngagementPressure(fatigue: FatigueState, momentum: MomentumState): EngagementPressure {
    if (fatigue === 'burnout' || fatigue === 'high') return 'none';
    if (fatigue === 'moderate') return 'gentle';
    if (momentum === 'declining' || momentum === 'dormant') return 'intense';
    return 'normal';
  }

  private calculateStreakRisk(streakStatus: StreakStatus): number {
    if (!streakStatus || streakStatus.currentStreak === 0) return 0;
    
    const { currentStreak, lastActiveDate } = streakStatus;
    if (!lastActiveDate) return 0;
    
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
    
    // Risk increases as we approach 24 hours since last activity
    const risk = Math.min(hoursSinceActivity / 24, 1);
    
    return risk;
  }

  /**
   * Fetch denormalized user analytics for stats like longestStreak, daysActive, totalProblemsSolved
   */
  private async fetchUserAnalytics(userObjId: Types.ObjectId): Promise<{
    bestStreak: number;
    totalActiveDays: number;
    totalProblemsSolved: number;
  } | null> {
    try {
      const { UserAnalytics } = await import('../../db/models/index.js');
      const analytics = await UserAnalytics.findOne({ userId: userObjId }).lean();
      if (!analytics) return null;
      return {
        bestStreak: (analytics as Record<string, unknown>).bestStreak as number ?? 0,
        totalActiveDays: (analytics as Record<string, unknown>).totalActiveDays as number ?? 0,
        totalProblemsSolved: (analytics as Record<string, unknown>).totalProblemsSolved as number ?? 0,
      };
    } catch {
      return null;
    }
  }

  private isStateStale(state: IUnifiedRuntimeState): boolean {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const lastCalculated = new Date(state.lastCalculatedAt).getTime();
    
    return now - lastCalculated > staleThreshold;
  }
}

export const unifiedRuntimeStateService = new UnifiedRuntimeStateService();
