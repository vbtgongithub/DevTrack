// src/worker-entrypoint.ts — Standalone worker process entrypoint
// Runs BullMQ workers WITHOUT the Express HTTP server.
// In production: API container runs index.ts, worker containers run this file.
// This isolates the blast radius — a worker crash can't take down the API.

import { connectDatabase, disconnectDatabase } from './db/index.js';
import { logger } from './shared/logger.js';
import { validateStartup } from './shared/startup-validation.js';
import { startPlatformSyncWorker, stopPlatformSyncWorker } from './shared/jobs/platformSyncWorker.js';
import { startMaintenanceWorker, stopMaintenanceWorker, scheduleMaintenanceTasks } from './shared/jobs/maintenanceWorker.js';

import { startResumeGenerationWorker, stopResumeGenerationWorker } from './modules/resume/workers/resume-generation.worker.js';
import { startATSAnalysisWorker, stopATSAnalysisWorker } from './modules/resume/workers/ats-analysis.worker.js';
import { startResumeExportWorker, stopResumeExportWorker } from './modules/resume/workers/resume-export.worker.js';
import { startCredibilityWorker, stopCredibilityWorker } from './modules/resume/workers/credibility-recalculation.worker.js';
import { startVariantGenerationWorker, stopVariantGenerationWorker } from './modules/resume/workers/variant-generation.worker.js';
import { startEvidenceGraphWorker, startEmbeddingWorker, startGithubAnalysisWorker } from './modules/resume/workers/phase4-workers.js';
import { startDatasetIngestionWorker, stopDatasetIngestionWorker } from './workers/worker-dataset-ingestion.js';
import { startResumeUploadWorker, stopResumeUploadWorker } from './workers/worker-resume-upload.js';

const WORKER_TYPE = process.env.WORKER_TYPE || 'all';

async function main(): Promise<void> {
  logger.info('[worker-entrypoint] Starting worker process', {
    event: 'worker_process_starting',
    workerType: WORKER_TYPE,
    pid: process.pid,
  });

  // Run startup validation checks
  await validateStartup();

  // Connect to MongoDB (workers need it for sync results and XP writes)
  await connectDatabase();

  // Start only the requested worker type
  switch (WORKER_TYPE) {
    case 'sync':
      startPlatformSyncWorker();
      logger.info('[worker-entrypoint] Platform sync worker started');
      break;

    case 'xp': {
      const { startXpWorker } = await import('./shared/jobs/xpWorker.js');
      startXpWorker();
      logger.info('[worker-entrypoint] XP processing worker started');
      break;
    }

    case 'maintenance':
      startMaintenanceWorker();
      await scheduleMaintenanceTasks();
      logger.info('[worker-entrypoint] Maintenance worker started');
      break;

    case 'all':
    default:
      startPlatformSyncWorker();
      startMaintenanceWorker();
      await scheduleMaintenanceTasks();
      
      // Start resume intelligence workers
      startResumeGenerationWorker();
      startATSAnalysisWorker();
      startResumeExportWorker();
      startCredibilityWorker();
      startVariantGenerationWorker();
      
      // Start Phase 4 intelligence workers
      startEvidenceGraphWorker();
      startEmbeddingWorker();
      startGithubAnalysisWorker();
      
      // Start Dataset Operationalization workers
      startDatasetIngestionWorker();
      
      // Start consolidator resume upload orchestrator worker
      startResumeUploadWorker();
      
      try {
        const { startProfileRebuildWorker } = await import('./shared/jobs/profileRebuildWorker.js');
        startProfileRebuildWorker();
      } catch (e) {
        logger.warn('[worker-entrypoint] profileRebuildWorker module not available', { error: String(e) });
      }

      try {
        const { startXpWorker } = await import('./shared/jobs/xpWorker.js');
        startXpWorker();
      } catch {
        logger.warn('[worker-entrypoint] XP worker module not available');
      }
      logger.info('[worker-entrypoint] All workers started');
      break;
  }

  logger.info('[worker-entrypoint] Worker process ready', {
    event: 'worker_process_ready',
    workerType: WORKER_TYPE,
    pid: process.pid,
  });
}

// ─── Graceful shutdown ─────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`[worker-entrypoint] Received ${signal}, shutting down gracefully`, {
    event: 'worker_process_shutdown',
    signal,
  });

  try {
    await stopPlatformSyncWorker();
    await stopMaintenanceWorker();
    
    // Stop resume intelligence workers
    await stopResumeGenerationWorker();
    await stopATSAnalysisWorker();
    await stopResumeExportWorker();
    await stopCredibilityWorker();
    await stopVariantGenerationWorker();
    
    await stopDatasetIngestionWorker();
    await stopResumeUploadWorker();
    
    try {
      const { stopProfileRebuildWorker } = await import('./shared/jobs/profileRebuildWorker.js');
      await stopProfileRebuildWorker();
    } catch {
      // Module may not be available — already logged at startup
    }

    await disconnectDatabase();
  } catch (err) {
    logger.error('[worker-entrypoint] Error during shutdown', err);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('[worker-entrypoint] Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[worker-entrypoint] Uncaught exception — exiting', err);
  process.exit(1);
});

main().catch((err) => {
  logger.error('[worker-entrypoint] Fatal startup error', err);
  process.exit(1);
});
