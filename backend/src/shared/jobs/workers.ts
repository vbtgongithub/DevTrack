// src/shared/jobs/workers.ts
import { Worker } from 'bullmq';
import { logger } from '../logger.js';
import { getRedisClient } from '../redis/index.js';
import { QueueNames } from './types.js';

import { startPlatformSyncWorker } from './platformSyncWorker.js';
import { startMaintenanceWorker } from './maintenanceWorker.js';
import { startXpWorker as startXpProcessingWorker } from './xpWorker.js';
import { startStreakRecalcWorker } from './streakRecalcWorker.js';
import { startNotificationWorker } from './notificationWorker.js';
import { startProfileRebuildWorker } from './profileRebuildWorker.js';

import { startDsaAnalyticsWorker } from './workers/dsaAnalyticsWorker.js';
import { startProjectIntelligenceWorker } from './workers/projectIntelligenceWorker.js';
import { startSkillIntelligenceWorker } from './workers/skillIntelligenceWorker.js';
import { startBenchmarkWorker } from './workers/benchmarkWorker.js';
import { startRoadmapRecommendationWorker } from './workers/roadmapRecommendationWorker.js';
import { startReadinessAggregationWorker } from './workers/readinessAggregationWorker.js';

let workers: Worker[] = [];

export async function startAllWorkers(): Promise<void> {
  const redis = getRedisClient();
  if (redis.status !== 'ready') {
    logger.warn('[workers] Redis not ready. Skipping worker startup.', { status: redis.status });
    return;
  }

  logger.info('[workers] Starting background job workers...');

  workers = [
    startPlatformSyncWorker(),
    startMaintenanceWorker(),
    startXpProcessingWorker(),
    startStreakRecalcWorker(),
    startNotificationWorker(),
    startProfileRebuildWorker(),
    
    // Readiness Pipeline
    startDsaAnalyticsWorker(),
    startProjectIntelligenceWorker(),
    startSkillIntelligenceWorker(),
    startBenchmarkWorker(),
    startRoadmapRecommendationWorker(),
    startReadinessAggregationWorker()
  ];

  logger.info(`[workers] Successfully started ${workers.length} workers.`);
}

export async function stopAllWorkers(): Promise<void> {
  logger.info(`[workers] Gracefully shutting down ${workers.length} workers...`);
  await Promise.allSettled(workers.map((w) => w.close()));
  workers = [];
  logger.info('[workers] All workers stopped.');
}