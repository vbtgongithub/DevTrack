// src/shared/jobs/index.ts — Jobs module barrel
export * from './types.js';
export { getOrCreateQueue, getQueue, getAllQueues, closeAllQueues, getPlatformSyncQueue, getStreakRecalcQueue, getSystemMaintenanceQueue, getXpProcessingQueue } from './queueFactory.js';
export { getNotificationQueue } from './queueFactory.js';
export { startPlatformSyncWorker, stopPlatformSyncWorker, getWorkerStatus } from './platformSyncWorker.js';
export { startXpWorker as startXpProcessingWorker, stopXpWorker, getXpWorkerStatus } from './xpWorker.js';
export { startStreakRecalcWorker, stopStreakRecalcWorker, getStreakRecalcWorkerStatus } from './streakRecalcWorker.js';
export { startNotificationWorker, stopNotificationWorker, getNotificationWorkerStatus } from './notificationWorker.js';
export { startMaintenanceWorker, stopMaintenanceWorker, scheduleMaintenanceTasks } from './maintenanceWorker.js';