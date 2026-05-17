// src/modules/runtime-orchestration/orchestrator/retentionRuntimeOrchestrator.service.ts — Central Retention Runtime Orchestrator
// Phase-F: Single orchestration runtime for ALL retention systems

import { getRedisClient } from '../../../shared/redis/client.js';
import { logger } from '../../../shared/logger.js';
import { getXpProcessingQueue } from '../../../shared/jobs/index.js';
import { eventBus } from '../../../shared/sse/index.js';

export type OrchestrationStage =
  | 'xp_processing'
  | 'goal_progression'
  | 'challenge_evaluation'
  | 'achievement_evaluation'
  | 'retention_trigger'
  | 'notification_arbitration'
  | 'fatigue_suppression'
  | 'sse_fanout'
  | 'analytics_update';

export interface OrchestrationContext {
  userId: string;
  activityEventId: string;
  timestamp: Date;
  activationLevel: number;
  trustScore: number;
  currentStage: OrchestrationStage;
  results: Partial<Record<OrchestrationStage, unknown>>;
  errors: Array<{ stage: OrchestrationStage; error: string }>;
  suppressed: OrchestrationStage[];
}

export interface OrchestrationCheckpoint {
  id: string;
  context: OrchestrationContext;
  completedStages: OrchestrationStage[];
  currentStage: OrchestrationStage;
  createdAt: Date;
  expiresAt: Date;
}

const STAGE_ORDER: OrchestrationStage[] = [
  'xp_processing',
  'goal_progression',
  'challenge_evaluation',
  'achievement_evaluation',
  'retention_trigger',
  'notification_arbitration',
  'fatigue_suppression',
  'sse_fanout',
  'analytics_update',
];

const CHECKPOINT_KEY_PREFIX = 'orchestrator:checkpoint:';
const ORCHESTRATION_STATUS_KEY = 'orchestrator:status';

export const retentionRuntimeOrchestrator = {
  // ─── Process activity event through full orchestration chain ─────────────
  async processActivityEvent(
    userId: string,
    eventId: string,
    activityData: {
      type: string;
      xp?: number;
      problemDifficulty?: string;
      duration?: number;
    }
  ): Promise<OrchestrationContext> {
    const context = await this.createContext(userId, eventId, activityData);

    // Check activation level
    const activationLevel = await this.getActivationLevel(userId);
    context.activationLevel = activationLevel;

    // Get trust score
    const trustScore = await this.getTrustScore(userId);
    context.trustScore = trustScore;

    // Execute orchestration pipeline
    for (const stage of STAGE_ORDER) {
      context.currentStage = stage;

      // Skip stages based on activation level
      if (!this.isStageActive(stage, activationLevel)) {
        context.suppressed.push(stage);
        continue;
      }

      try {
        const result = await this.executeStage(stage, context, activityData);
        context.results[stage] = result;
      } catch (error) {
        context.errors.push({
          stage,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue to next stage but log error
        logger.error('[orchestrator] Stage failed', { stage, userId, error });
      }
    }

    // Store checkpoint for replay
    await this.storeCheckpoint(context);

    logger.info('[orchestrator] Activity processed', {
      userId,
      eventId,
      completedStages: Object.keys(context.results).length,
      errors: context.errors.length,
    });

    return context;
  },

  // ─── Create orchestration context ───────────────────────────────────────
  async createContext(
    userId: string,
    activityEventId: string,
    _activityData: { type: string; xp?: number; problemDifficulty?: string; duration?: number }
  ): Promise<OrchestrationContext> {
    return {
      userId,
      activityEventId,
      timestamp: new Date(),
      activationLevel: 0,
      trustScore: 100,
      currentStage: 'xp_processing',
      results: {},
      errors: [],
      suppressed: [],
    };
  },

  // ─── Get activation level for user ─────────────────────────────────────
  async getActivationLevel(userId: string): Promise<number> {
    const redis = getRedisClient();
    const level = await redis.hget('activation:levels', userId);
    return level ? parseInt(level, 10) : 0;
  },

  // ─── Get trust score for user ─────────────────────────────────────────
  async getTrustScore(userId: string): Promise<number> {
    const redis = getRedisClient();
    const score = await redis.hget('trust:scores', userId);
    return score ? parseFloat(score) : 100;
  },

  // ─── Check if stage is active based on activation level ─────────────────
  isStageActive(stage: OrchestrationStage, activationLevel: number): boolean {
    const stageRequirements: Record<OrchestrationStage, number> = {
      xp_processing: 0,
      goal_progression: 1,
      challenge_evaluation: 2,
      achievement_evaluation: 1,
      retention_trigger: 3,
      notification_arbitration: 2,
      fatigue_suppression: 4,
      sse_fanout: 0,
      analytics_update: 0,
    };

    return activationLevel >= stageRequirements[stage];
  },

  // ─── Execute single orchestration stage ─────────────────────────────────
  async executeStage(
    stage: OrchestrationStage,
    context: OrchestrationContext,
    activityData: { type: string; xp?: number; problemDifficulty?: string; duration?: number }
  ): Promise<unknown> {
    switch (stage) {
      case 'xp_processing':
        return this.executeXpProcessing(context, activityData);
      case 'goal_progression':
        return this.executeGoalProgression(context, activityData);
      case 'challenge_evaluation':
        return this.executeChallengeEvaluation(context, activityData);
      case 'achievement_evaluation':
        return this.executeAchievementEvaluation(context, activityData);
      case 'retention_trigger':
        return this.executeRetentionTrigger(context, activityData);
      case 'notification_arbitration':
        return this.executeNotificationArbitration(context);
      case 'fatigue_suppression':
        return this.executeFatigueSuppression(context);
      case 'sse_fanout':
        return this.executeSseFanout(context);
      case 'analytics_update':
        return this.executeAnalyticsUpdate(context, activityData);
      default:
        return null;
    }
  },

  // ─── XP Processing Stage ────────────────────────────────────────────────
  async executeXpProcessing(
    context: OrchestrationContext,
    activityData: { type: string; xp?: number; problemDifficulty?: string; duration?: number }
  ): Promise<{ queued: boolean; amount?: number }> {
    if (!activityData.xp) return { queued: false };

    const queue = getXpProcessingQueue();
    await queue.add('activity-xp', {
      userId: context.userId,
      eventId: context.activityEventId,
      sourceType: 'activity',
      sourceId: activityData.type,
      xpAwarded: activityData.xp,
      metadata: {
        problemDifficulty: activityData.problemDifficulty,
        duration: activityData.duration,
        trustScore: context.trustScore,
      },
    });

    return { queued: true, amount: activityData.xp };
  },

  // ─── Goal Progression Stage ────────────────────────────────────────────
  async executeGoalProgression(
    context: OrchestrationContext,
    activityData: { type: string }
  ): Promise<{ goalUpdated: boolean; progress?: number }> {
    // Import goal service lazily
    const { goalService } = await import('../../retention/goals/goal.service.js');

    const category = this.activityTypeToGoalCategory(activityData.type);
    if (!category) return { goalUpdated: false };

    await goalService.updateProgress(context.userId, category as any, 1);

    return { goalUpdated: true, progress: 1 };
  },

  // ─── Challenge Evaluation Stage ────────────────────────────────────────
  async executeChallengeEvaluation(
    context: OrchestrationContext,
    activityData: { type: string }
  ): Promise<{ challengeChecked: boolean }> {
    const { challengeService } = await import('../../retention/challenges/challenge.service.js');

    const category = this.activityTypeToGoalCategory(activityData.type) || 'mixed';
    await challengeService.updateProgress(context.userId, category, 1);

    return { challengeChecked: true };
  },

  // ─── Achievement Evaluation Stage ──────────────────────────────────────
  async executeAchievementEvaluation(
    context: OrchestrationContext,
    _activityData: { type: string }
  ): Promise<{ achievementUnlocked?: string }> {
    const { achievementService } = await import('../../retention/achievements/achievement.service.js');
    const { getTemplateById } = await import('../../retention/achievements/achievement.templates.js');

    const unlocked = await achievementService.evaluateAllAchievements(context.userId);

    const newlyUnlocked = unlocked.find((r) => r.unlocked);
    if (newlyUnlocked) {
      const template = getTemplateById(newlyUnlocked.achievementId);
      return { achievementUnlocked: template?.name ?? newlyUnlocked.achievementId };
    }

    return { achievementUnlocked: undefined };
  },

  // ─── Retention Trigger Stage ───────────────────────────────────────────
  async executeRetentionTrigger(
    context: OrchestrationContext,
    _activityData: { type: string }
  ): Promise<{ triggers: string[] }> {
    const { retentionPsychology } = await import('../../retention/psychology/retentionPsychology.service.js');

    const triggers = await retentionPsychology.generateTriggers(context.userId);

    return { triggers: triggers.map(t => t.type) };
  },

  // ─── Notification Arbitration Stage ────────────────────────────────────
  async executeNotificationArbitration(
    context: OrchestrationContext
  ): Promise<{ notifications: string[] }> {
    const { notificationFatigueService } = await import('../../retention-v2/notifications/notificationFatigue.service.js');

    const decision = await notificationFatigueService.shouldSendNotification(context.userId, 'goal_completed');

    if (!decision.shouldSend) {
      return { notifications: [] };
    }

    return { notifications: ['activity_completion'] };
  },

  // ─── Fatigue Suppression Stage ────────────────────────────────────────
  async executeFatigueSuppression(
    context: OrchestrationContext
  ): Promise<{ fatigueLevel: string; suppressed: boolean }> {
    const { fatigueSuppressionService } = await import('../../retention-v2/fatigue/fatigueSuppression.service.js');

    const suppression = await fatigueSuppressionService.getSuppressionLevel(context.userId);

    let fatigueLevel = 'none';
    if (suppression.notificationSuppression >= 80) fatigueLevel = 'critical';
    else if (suppression.notificationSuppression >= 60) fatigueLevel = 'severe';
    else if (suppression.notificationSuppression >= 40) fatigueLevel = 'moderate';
    else if (suppression.notificationSuppression >= 20) fatigueLevel = 'mild';

    return {
      fatigueLevel,
      suppressed: suppression.notificationSuppression > 0,
    };
  },

  // ─── SSE Fanout Stage ─────────────────────────────────────────────────
  async executeSseFanout(
    context: OrchestrationContext
  ): Promise<{ fanoutCount: number }> {
    const { eventOrchestration } = await import('../../retention/orchestration/eventOrchestration.service.js');

    const event = eventOrchestration.createEvent(
      'daily_login',
      context.userId,
      { source: 'orchestrator' },
      'system'
    );

    await eventOrchestration.handleEvent(event);

    return { fanoutCount: 1 };
  },

  // ─── Analytics Update Stage ───────────────────────────────────────────
  async executeAnalyticsUpdate(
    context: OrchestrationContext,
    activityData: { type: string; xp?: number }
  ): Promise<{ updated: boolean }> {
    const { productAnalytics } = await import('../../analytics/productAnalytics.service.js');

    await productAnalytics.track('feature_used', context.userId, {
      featureName: 'activity_completed',
      activityType: activityData.type,
      xpEarned: activityData.xp || 0,
      activationLevel: context.activationLevel,
      trustScore: context.trustScore,
    });

    return { updated: true };
  },

  // ─── Map activity type to goal category ────────────────────────────────
  activityTypeToGoalCategory(type: string): 'dsa' | 'activity' | 'xp' | 'social' | null {
    const mapping: Record<string, 'dsa' | 'activity' | 'xp' | 'social'> = {
      problem_solved: 'dsa',
      dsa_practice: 'dsa',
      activity_completed: 'activity',
      pomodoro: 'activity',
      xp_earned: 'xp',
      social_interaction: 'social',
    };

    return mapping[type] || null;
  },

  // ─── Store checkpoint for replay ────────────────────────────────────────
  async storeCheckpoint(context: OrchestrationContext): Promise<void> {
    const redis = getRedisClient();
    const key = CHECKPOINT_KEY_PREFIX + context.activityEventId;

    const checkpoint: OrchestrationCheckpoint = {
      id: context.activityEventId,
      context,
      completedStages: Object.keys(context.results) as OrchestrationStage[],
      currentStage: context.currentStage,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
    };

    await redis.set(key, JSON.stringify(checkpoint), 'EX', 86400);
  },

  // ─── Get checkpoint for replay ─────────────────────────────────────────
  async getCheckpoint(eventId: string): Promise<OrchestrationCheckpoint | null> {
    const redis = getRedisClient();
    const key = CHECKPOINT_KEY_PREFIX + eventId;
    const cached = await redis.get(key);

    return cached ? JSON.parse(cached) : null;
  },

  // ─── Rebuild orchestration from checkpoint ──────────────────────────────
  async rebuildFromCheckpoint(eventId: string): Promise<OrchestrationContext | null> {
    const checkpoint = await this.getCheckpoint(eventId);
    if (!checkpoint) return null;

    return checkpoint.context;
  },

  // ─── Get orchestration status ───────────────────────────────────────────
  async getOrchestrationStatus(): Promise<{
    active: number;
    failed: number;
    avgLatencyMs: number;
  }> {
    const redis = getRedisClient();
    const cached = await redis.get(ORCHESTRATION_STATUS_KEY);

    if (cached) {
      return JSON.parse(cached);
    }

    return {
      active: 0,
      failed: 0,
      avgLatencyMs: 0,
    };
  },
};

export default retentionRuntimeOrchestrator;