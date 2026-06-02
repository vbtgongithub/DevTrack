// src/workers/worker-xp.ts — XP Processing Worker Process
// Standalone worker for XP calculation and streak management
// Runs independently to isolate XP operations from other workers

import { connectDatabase, disconnectDatabase } from '../db/index.js';
import { logger } from '../shared/logger.js';
import { WorkerHealthMonitor } from './WorkerHealthMonitor.js';

async function main(): Promise<void> {
  logger.info('[worker-xp] Starting XP processing worker', {
    event: 'worker_process_starting',
    workerType: 'xp',
    pid: process.pid,
  });

  await connectDatabase();
  
  // Start health monitoring
  const healthMonitor = new WorkerHealthMonitor('xp');
  healthMonitor.start();
  
  const { startXpWorker, stopXpWorker } = await import('../shared/jobs/xpWorker.js');
  startXpWorker();

  logger.info('[worker-xp] XP processing worker ready', {
    event: 'worker_process_ready',
    workerType: 'xp',
    pid: process.pid,
  });

  // Store stop function and health monitor for graceful shutdown
  (global as any).stopXpWorker = stopXpWorker;
  (global as any).healthMonitor = healthMonitor;
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`[worker-xp] Received ${signal}, shutting down gracefully`, {
    event: 'worker_process_shutdown',
    signal,
  });

  try {
    const stopXpWorker = (global as any).stopXpWorker;
    if (stopXpWorker) {
      await stopXpWorker();
    }
    
    const healthMonitor = (global as any).healthMonitor;
    if (healthMonitor) {
      healthMonitor.stop();
    }
    
    await disconnectDatabase();
  } catch (err) {
    logger.error('[worker-xp] Error during shutdown', err);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('[worker-xp] Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[worker-xp] Uncaught exception — exiting', err);
  process.exit(1);
});

main().catch((err) => {
  logger.error('[worker-xp] Fatal startup error', err);
  process.exit(1);
});
