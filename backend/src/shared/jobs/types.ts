// src/shared/jobs/types.ts — Typed job definitions for BullMQ queues

import type { XpSourceType } from '../../db/models/index.js';

export interface PlatformSyncJobData {
  userId: string;
  platformName: string;
  requestId?: string;
}

export interface RealtimeEventJobData {
  userId: string;
  eventType: 'sync_started' | 'sync_completed' | 'sync_failed' | 'new_submission';
  platform?: string;
  stats?: Record<string, unknown>;
  requestId?: string;
}

export interface SystemMaintenanceJobData {
  task: 'cleanup_failed_jobs' | 'prune_old_events' | 'health_check';
  requestId?: string;
}

export interface XpProcessingJobData {
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export type JobData = PlatformSyncJobData | RealtimeEventJobData | SystemMaintenanceJobData | XpProcessingJobData;

// Job name constants
export const QueueNames = {
  PLATFORM_SYNC: 'platform-sync',
  REALTIME_EVENTS: 'realtime-events',
  SYSTEM_MAINTENANCE: 'system-maintenance',
  XP_PROCESSING: 'xp-processing',
  STREAK_RECALC: 'streak-recalc',
  ANALYTICS_SYNC: 'analytics-sync',
  NOTIFICATIONS: 'notifications',
} as const;

// Retry configuration
export const JobRetryConfig = {
  platformSync: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 2000 },
  },
  realtimeEvents: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 1000 },
  },
  systemMaintenance: {
    attempts: 1,
    backoff: { type: 'fixed' as const, delay: 0 },
  },
  xpProcessing: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 500 },
  },
  standard: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
  },
} as const;