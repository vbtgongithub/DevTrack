// src/infrastructure/queues/DeadLetterHandler.ts
import { Job } from 'bullmq';
import { logger } from '../../shared/logger.js';
import { DeadLetterJob } from '../../db/models/deadLetterJob.model.js';

export class DeadLetterHandler {
  static async handlePermanentFailure(queueName: string, workerName: string, job: Job, error: Error) {
    logger.error(`[DeadLetterHandler] Job permanently failed. Moving to DLQ. JobID: ${job.id}, Queue: ${queueName}`, error);
    
    try {
      await DeadLetterJob.create({
        queueName,
        jobId: job.id || 'unknown',
        workerName,
        payload: job.data,
        failureReason: error.message,
        stackTrace: error.stack,
        retryHistory: job.attemptsMade ? [{ attempts: job.attemptsMade }] : [],
        failedAt: new Date()
      });
      logger.info(`[DeadLetterHandler] Successfully persisted DLQ record for JobID: ${job.id}`);
    } catch (dbError) {
      logger.error(`[DeadLetterHandler] FAILED to persist DLQ record for JobID: ${job.id}`, dbError);
    }
  }
}
