// src/workers/worker-resume-intelligence.ts — Resume Intelligence Worker Process
// Standalone worker for resume intelligence operations (ATS analysis, replay generation, etc.)
// Runs independently to isolate resume intelligence operations from other workers

import { connectDatabase, disconnectDatabase } from '../db/index.js';
import { logger } from '../shared/logger.js';
import { WorkerHealthMonitor } from './WorkerHealthMonitor.js';

import { startResumeGenerationWorker, stopResumeGenerationWorker } from '../modules/resume/workers/resume-generation.worker.js';
import { startATSAnalysisWorker, stopATSAnalysisWorker } from '../modules/resume/workers/ats-analysis.worker.js';
import { startResumeExportWorker, stopResumeExportWorker } from '../modules/resume/workers/resume-export.worker.js';
import { startCredibilityWorker, stopCredibilityWorker } from '../modules/resume/workers/credibility-recalculation.worker.js';
import { startVariantGenerationWorker, stopVariantGenerationWorker } from '../modules/resume/workers/variant-generation.worker.js';
import { startEvidenceGraphWorker, startEmbeddingWorker, startGithubAnalysisWorker } from '../modules/resume/workers/phase4-workers.js';
import { startResumeUploadWorker, stopResumeUploadWorker } from './worker-resume-upload.js';

async function main(): Promise<void> {
  logger.info('[worker-resume-intelligence] Starting resume intelligence worker', {
    event: 'worker_process_starting',
    workerType: 'resume-intelligence',
    pid: process.pid,
  });

  await connectDatabase();
  
  // Start health monitoring
  const healthMonitor = new WorkerHealthMonitor('resume-intelligence');
  healthMonitor.start();

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

  // Start new consolidated background orchestrator
  startResumeUploadWorker();

  try {
    const { startProfileRebuildWorker } = await import('../shared/jobs/profileRebuildWorker.js');
    startProfileRebuildWorker();
  } catch (e) {
    logger.warn('[worker-resume-intelligence] profileRebuildWorker module not available', { error: String(e) });
  }

  logger.info('[worker-resume-intelligence] Resume intelligence worker ready', {
    event: 'worker_process_ready',
    workerType: 'resume-intelligence',
    pid: process.pid,
  });

  // Store health monitor for graceful shutdown
  (global as any).healthMonitor = healthMonitor;
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`[worker-resume-intelligence] Received ${signal}, shutting down gracefully`, {
    event: 'worker_process_shutdown',
    signal,
  });

  try {
    // Stop resume intelligence workers
    await stopResumeGenerationWorker();
    await stopATSAnalysisWorker();
    await stopResumeExportWorker();
    await stopCredibilityWorker();
    await stopVariantGenerationWorker();
    await stopResumeUploadWorker();
    
    try {
      const { stopProfileRebuildWorker } = await import('../shared/jobs/profileRebuildWorker.js');
      await stopProfileRebuildWorker();
    } catch {}
    
    const healthMonitor = (global as any).healthMonitor;
    if (healthMonitor) {
      healthMonitor.stop();
    }

    await disconnectDatabase();
  } catch (err) {
    logger.error('[worker-resume-intelligence] Error during shutdown', err);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('[worker-resume-intelligence] Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[worker-resume-intelligence] Uncaught exception — exiting', err);
  process.exit(1);
});

main().catch((err) => {
  logger.error('[worker-resume-intelligence] Fatal startup error', err);
  process.exit(1);
});
