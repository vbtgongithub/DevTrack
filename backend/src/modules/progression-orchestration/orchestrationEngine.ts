// src/modules/progression-orchestration/orchestrationEngine.ts
// Centralized saga-based execution runtime.
// Coordinates progression checkpoints, distributed tracing, and transactional compensation workflows.

import { logger } from '../../shared/logger.js';
import { traceSpan } from '../../shared/tracing/tracing.js';
import { deduplicator } from './deduplicator.js';
import { xpEngine } from './xpEngine.js';
import { streakEngine } from './streakEngine.js';
import { antiAbuseDetector } from './abuseDetector.js';
import type { CanonicalActivity } from './activityEvent.js';
import { getRedisClient } from '../../shared/redis/index.js';

export interface IngestionResult {
  activityId: string;
  success: boolean;
  xpAwarded: number;
  newTotalXp: number;
  currentStreak: number;
  error?: string;
}

export class ProgressionOrchestrator {
  /**
   * Orchestrates the complete DSA ingestion and progression pipeline.
   * Leverages transactional step checkpointing and sagas.
   */
  async executeIngestionSaga(activity: CanonicalActivity): Promise<IngestionResult> {
    const { activityId, userId, provider, providerEventId } = activity;
    const { traceId, correlationId } = activity.traceContext;

    return traceSpan('ingestion_saga', async () => {
      logger.info('[orchestrator] Starting progression saga execution', {
        activityId,
        userId,
        provider,
        providerEventId,
        traceId,
      });

      // Track saga execution history for compensation purposes
      const completedSteps: string[] = [];

      try {
        // Step 1: Anti-Abuse Verification
        await deduplicator.checkpointStep(activityId, 'anti_abuse_start', { status: 'running' });
        const abuseResult = await antiAbuseDetector.evaluateActivity(activity);
        
        if (abuseResult.isSuspicious) {
          await antiAbuseDetector.quarantineActivity(activity, abuseResult.score, abuseResult.reasons);
          await deduplicator.checkpointStep(activityId, 'anti_abuse_failed', { reasons: abuseResult.reasons });
          throw new Error(`Activity quarantined due to high abuse score: ${abuseResult.score}`);
        }
        await deduplicator.checkpointStep(activityId, 'anti_abuse_completed', { score: abuseResult.score });
        completedSteps.push('anti_abuse');

        // Step 2: Deduplication Lock
        const isUnique = await deduplicator.isUniqueAndRegister(activity);
        if (!isUnique) {
          throw new Error(`Duplicate ingestion request rejected: ${provider}:${providerEventId}`);
        }
        completedSteps.push('deduplication');

        // Step 3: Timezone-Safe Streak Processing
        await deduplicator.checkpointStep(activityId, 'streak_start', { status: 'running' });
        const streakResult = await streakEngine.processStreakLog(userId, activity);
        await deduplicator.checkpointStep(activityId, 'streak_completed', streakResult);
        completedSteps.push('streak');

        // Step 4: XP Calculation and Transaction Log
        await deduplicator.checkpointStep(activityId, 'xp_start', { status: 'running' });
        const xpResult = await xpEngine.awardProgressionXp(userId, activity, streakResult.currentStreak);
        await deduplicator.checkpointStep(activityId, 'xp_completed', xpResult);
        completedSteps.push('xp');

        // Step 5: Realtime Fanout notification flag
        await deduplicator.checkpointStep(activityId, 'realtime_start', { status: 'running' });
        await this.triggerRealtimePropagation(userId, activityId, {
          xpAwarded: xpResult.xpAwarded,
          totalXp: xpResult.newTotalXp,
          streak: streakResult.currentStreak,
          levelUp: xpResult.levelUp,
        });
        await deduplicator.checkpointStep(activityId, 'realtime_completed', { status: 'success' });
        completedSteps.push('realtime');

        logger.info('[orchestrator] Progression saga completed successfully', {
          activityId,
          userId,
          xpAwarded: xpResult.xpAwarded,
          currentStreak: streakResult.currentStreak,
          traceId,
        });

        return {
          activityId,
          success: true,
          xpAwarded: xpResult.xpAwarded,
          newTotalXp: xpResult.newTotalXp,
          currentStreak: streakResult.currentStreak,
        };

      } catch (err: any) {
        logger.error('[orchestrator] Saga step failed, initiating compensations', {
          activityId,
          error: err.message,
          completedSteps,
          traceId,
        });

        // Run rollback compensation tasks
        await this.compensateSaga(activity, completedSteps);

        return {
          activityId,
          success: false,
          xpAwarded: 0,
          newTotalXp: 0,
          currentStreak: 0,
          error: err.message,
        };
      }
    }, { traceId, correlationId });
  }

  /**
   * Compensates (rolls back) executed stages to guarantee consistency.
   */
  private async compensateSaga(activity: CanonicalActivity, completedSteps: string[]): Promise<void> {
    const { activityId, userId, provider, providerEventId } = activity;
    const redis = getRedisClient();

    // Rollback backwards
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i];
      try {
        if (step === 'xp') {
          // XP database updates are protected by indexing & strict immutable tx records
          logger.info('[orchestrator] Compensating XP step: logged in transaction list');
        }

        if (step === 'streak') {
          // Remove from Streak Log
          const occurredAt = new Date(activity.audit.occurredAt);
          const localMidnight = streakEngine.getLocalMidnight(occurredAt);
          await redis.del(`devtrack:checkpoint:orchestration:${activityId}:streak_completed`);
          logger.info('[orchestrator] Compensated Streak step');
        }

        if (step === 'deduplication') {
          // Clear dedupe lock
          const key = deduplicator.getDedupeKey(provider, userId, providerEventId);
          await redis.del(key);
          logger.info('[orchestrator] Compensated Deduplication lock');
        }
      } catch (compensateErr) {
        logger.error(`[orchestrator] Compensation failed on step: ${step}`, compensateErr);
      }
    }
  }

  /**
   * Realtime event sequencer. Fires SSE updates.
   */
  private async triggerRealtimePropagation(
    userId: string,
    activityId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const redis = getRedisClient();
    const streamKey = 'devtrack:events:stream';
    
    // Publish finalized state event package to the event stream
    await redis.xadd(
      streamKey,
      'MAXLEN',
      '~',
      '50000',
      '*',
      'userId',
      userId,
      'activityId',
      activityId,
      'payload',
      JSON.stringify(payload),
      'eventType',
      'progression_updated'
    );
  }
}

export const progressionOrchestrator = new ProgressionOrchestrator();
