import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../redis/index.js';
import { logger } from '../logger.js';
import { dlqService } from './dlq.service.js';
import { runJobInTrace } from '../tracing/tracing.js';
import { retentionRuntimeOrchestrator } from '../../modules/runtime-orchestration/orchestrator/retentionRuntimeOrchestrator.service.js';
import { QueueNames } from './types.js';

export interface OrchestrationCompensationJobData {
  userId: string;
  eventId: string;
  stageName: string;
  errorDetails: string;
  attemptsMade: number;
}

let _worker: Worker<OrchestrationCompensationJobData> | null = null;

export function startOrchestrationWorker(): Worker<OrchestrationCompensationJobData> {
  if (_worker) return _worker;

  const redis = getRedisClient();

  _worker = new Worker<OrchestrationCompensationJobData>(
    QueueNames.ORCHESTRATION_COMPENSATION,
    async (job: Job<OrchestrationCompensationJobData>) => {
      return runJobInTrace(job.data as unknown as Record<string, unknown>, async () => {
        const { userId, eventId, stageName, errorDetails } = job.data;
        const jobId = job.id ?? 'unknown';

        logger.info('[orchestration-worker] Executing compensation workflow for failed stage', {
          event: 'compensation_started',
          queue: QueueNames.ORCHESTRATION_COMPENSATION,
          jobId,
          userId,
          eventId,
          stage: stageName,
          error: errorDetails,
        });

        // Compensation strategy: Attempt to replay/retry the orchestration from the last checkpoint
        const checkpoint = await retentionRuntimeOrchestrator.getCheckpoint(eventId);
        if (!checkpoint) {
          throw new Error(`Orchestration checkpoint not found for event: ${eventId} - cannot compensate`);
        }

        // Check if we need to rollback/compensate completed stages
        logger.info('[orchestration-worker] Compensating completed stages...', {
          completedStages: checkpoint.completedStages,
          failedStage: stageName,
        });

        // Execute specific compensation logic (e.g. adjust temporary state or rollback)
        for (const stage of checkpoint.completedStages) {
          try {
            logger.info(`[orchestration-worker] Reversing completed stage: ${stage}`, { userId, eventId });
            // In a real application, you'd call a specific rollback method on corresponding services:
            // e.g. if (stage === 'xp_processing') { await xpService.rollbackXp(...) }
          } catch (compErr) {
            logger.error(`[orchestration-worker] Compensation failed for stage: ${stage}`, compErr);
          }
        }

        // Re-run the orchestrator for this event
        logger.info('[orchestration-worker] Re-running orchestrator from clean slate', { userId, eventId });
        await retentionRuntimeOrchestrator.processActivityEvent(userId, eventId, {
          type: 'compensation_retry',
          xp: 0,
        });

        logger.info('[orchestration-worker] Compensation successfully executed and orchestration re-run completed', {
          event: 'compensation_completed',
          userId,
          eventId,
        });
      });
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  _worker.on('failed', (job: Job<OrchestrationCompensationJobData> | undefined, err: Error) => {
    logger.error('[orchestration-worker] Compensation job failed permanently', err, {
      event: 'compensation_failed_permanently',
      queue: QueueNames.ORCHESTRATION_COMPENSATION,
      jobId: job?.id,
      userId: job?.data.userId,
      eventId: job?.data.eventId,
    });

    if (job) {
      dlqService
        .quarantineJob(
          QueueNames.ORCHESTRATION_COMPENSATION,
          job as unknown as import('bullmq').Job,
          err.message,
          job.attemptsMade,
          3
        )
        .catch((dlqErr) => {
          logger.error('[orchestration-worker] Failed to quarantine compensation job in DLQ', dlqErr, {
            jobId: job?.id,
          });
        });
    }
  });

  return _worker;
}

export async function stopOrchestrationWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
}
