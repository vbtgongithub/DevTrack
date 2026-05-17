// src/modules/progression-orchestration/ingestionPipeline.ts
// Ingestion Pipeline Service. Coordinates activity normalization, anti-abuse, and orchestration.
// Built as the principal ingestion entryway for external platform sync tasks.

import { logger } from '../../shared/logger.js';
import type { PlatformSubmission } from '../platform-sync/adapters/types.js';
import { createCanonicalActivity, type CanonicalActivity } from './activityEvent.js';
import { progressionOrchestrator, type IngestionResult } from './orchestrationEngine.js';

export class IngestionPipelineService {
  /**
   * Main entry point: takes a batch of raw/normalized submissions from any provider
   * and processes them through the robust progression pipeline.
   */
  async ingestSubmissions(
    userId: string,
    provider: CanonicalActivity['provider'],
    submissions: PlatformSubmission[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<IngestionResult[]> {
    logger.info(`[ingestion-pipeline] Starting ingestion of ${submissions.length} submissions`, {
      userId,
      provider,
    });

    const results: IngestionResult[] = [];

    for (const sub of submissions) {
      try {
        // Only ingest accepted/valid submissions for XP & Streaks
        if (sub.status !== 'accepted') {
          continue;
        }

        // Trace Context Propagation
        const traceId = crypto.randomUUID();
        const correlationId = crypto.randomUUID();
        const causationId = crypto.randomUUID();

        // 1. Map platform submission into the Canonical Activity Envelope
        const activity = createCanonicalActivity(
          provider,
          sub.externalId,
          userId,
          'problem_solved', // standard problem solve activity
          {
            difficulty: sub.difficulty === 'unknown' ? 'unknown' : sub.difficulty,
            metadata: {
              title: sub.title,
              language: sub.language,
              runtime: sub.runtimeMs ? sub.runtimeMs / 1000 : undefined, // to seconds
            },
          },
          {
            occurredAt: sub.submittedAt.toISOString(),
            ipAddress,
            userAgent,
          },
          traceId,
          correlationId,
          causationId
        );

        // 2. Dispatch to Saga Orchestrator
        const res = await progressionOrchestrator.executeIngestionSaga(activity);
        results.push(res);
      } catch (err: any) {
        logger.error(`[ingestion-pipeline] Failed to ingest submission: ${sub.externalId}`, err);
        results.push({
          activityId: '',
          success: false,
          xpAwarded: 0,
          newTotalXp: 0,
          currentStreak: 0,
          error: err.message,
        });
      }
    }

    return results;
  }
}

export const ingestionPipelineService = new IngestionPipelineService();
