// src/workers/worker-maintenance.ts — Maintenance Worker Process
// Standalone worker for maintenance tasks (cleanup, scheduled jobs)
// Runs independently to isolate maintenance operations from other workers

import { connectDatabase, disconnectDatabase } from '../db/index.js';
import { logger } from '../shared/logger.js';
import { startMaintenanceWorker, stopMaintenanceWorker, scheduleMaintenanceTasks } from '../shared/jobs/maintenanceWorker.js';
import { WorkerHealthMonitor } from './WorkerHealthMonitor.js';

async function main(): Promise<void> {
  logger.info('[worker-maintenance] Starting maintenance worker', {
    event: 'worker_process_starting',
    workerType: 'maintenance',
    pid: process.pid,
  });

  await connectDatabase();
  
  // Start health monitoring
  const healthMonitor = new WorkerHealthMonitor('maintenance');
  healthMonitor.start();
  
  startMaintenanceWorker();
  await scheduleMaintenanceTasks();

  logger.info('[worker-maintenance] Maintenance worker ready', {
    event: 'worker_process_ready',
    workerType: 'maintenance',
    pid: process.pid,
  });

  // Store health monitor for graceful shutdown
  (global as any).healthMonitor = healthMonitor;
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`[worker-maintenance] Received ${signal}, shutting down gracefully`, {
    event: 'worker_process_shutdown',
    signal,
  });

  try {
    await stopMaintenanceWorker();
    
    const healthMonitor = (global as any).healthMonitor;
    if (healthMonitor) {
      healthMonitor.stop();
    }
    
    await disconnectDatabase();
  } catch (err) {
    logger.error('[worker-maintenance] Error during shutdown', err);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('[worker-maintenance] Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[worker-maintenance] Uncaught exception — exiting', err);
  process.exit(1);
});

main().catch((err) => {
  logger.error('[worker-maintenance] Fatal startup error', err);
  process.exit(1);
});
