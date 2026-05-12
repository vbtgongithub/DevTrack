// src/shared/jobs/queueFactory.ts — Centralized BullMQ queue factory
// Creates and manages named queues with consistent configuration.
// No duplicate Redis connections — single shared client.

import { Queue } from 'bullmq';
import { getRedisClient } from '../redis/index.js';
import { logger } from '../logger.js';
import { QueueNames } from './types.js';

interface QueueEntry {
  queue: Queue;
  name: string;
}

const registry = new Map<string, QueueEntry>();

function createQueueConfig(defaultJobOptions?: Record<string, unknown>) {
  return {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      ...defaultJobOptions,
    },
  };
}

export function getOrCreateQueue(name: string): Queue {
  const existing = registry.get(name);
  if (existing) return existing.queue;

  logger.info('[queue] Creating queue', { event: 'queue_created', name });

  const queue = new Queue(name, createQueueConfig());
  registry.set(name, { queue, name });
  return queue;
}

export function getQueue(name: string): Queue | undefined {
  return registry.get(name)?.queue;
}

export function getAllQueues(): Queue[] {
  return Array.from(registry.values()).map((e) => e.queue);
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all(getAllQueues().map((q) => q.close()));
  registry.clear();
  logger.info('[queue] All queues closed', { event: 'queues_closed' });
}

// Pre-registered queue getters
export function getPlatformSyncQueue(): Queue {
  return getOrCreateQueue(QueueNames.PLATFORM_SYNC);
}

export function getRealtimeEventsQueue(): Queue {
  return getOrCreateQueue(QueueNames.REALTIME_EVENTS);
}

export function getSystemMaintenanceQueue(): Queue {
  return getOrCreateQueue(QueueNames.SYSTEM_MAINTENANCE);
}

export function getXpProcessingQueue(): Queue {
  return getOrCreateQueue(QueueNames.XP_PROCESSING);
}