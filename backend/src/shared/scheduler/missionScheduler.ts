// src/shared/scheduler/missionScheduler.ts
// Mission generation scheduler — runs daily and weekly mission generation

import cron from 'node-cron';
import { generateDailyMissions, generateWeeklyMissions } from '../../modules/missions/index.js';
import { logger } from '../logger.js';

let dailyMissionJob: cron.ScheduledTask | null = null;
let weeklyMissionJob: cron.ScheduledTask | null = null;

// ─── Start mission scheduler ─────────────────────────────────────────────────

export function startMissionScheduler(): void {
  logger.info('[scheduler] Starting mission scheduler');

  // Daily missions: Run at 00:05 UTC every day
  dailyMissionJob = cron.schedule('5 0 * * *', async () => {
    logger.info('[scheduler] Running daily mission generation');
    try {
      await generateDailyMissions();
      logger.info('[scheduler] Daily mission generation completed');
    } catch (error) {
      logger.error('[scheduler] Daily mission generation failed', { error });
    }
  }, {
    timezone: 'UTC',
  });

  // Weekly missions: Run at 00:05 UTC every Monday
  weeklyMissionJob = cron.schedule('5 0 * * 1', async () => {
    logger.info('[scheduler] Running weekly mission generation');
    try {
      await generateWeeklyMissions();
      logger.info('[scheduler] Weekly mission generation completed');
    } catch (error) {
      logger.error('[scheduler] Weekly mission generation failed', { error });
    }
  }, {
    timezone: 'UTC',
  });

  logger.info('[scheduler] Mission scheduler started (daily: 00:05 UTC, weekly: Monday 00:05 UTC)');
}

// ─── Stop mission scheduler ──────────────────────────────────────────────────

export function stopMissionScheduler(): void {
  logger.info('[scheduler] Stopping mission scheduler');

  if (dailyMissionJob) {
    dailyMissionJob.stop();
    dailyMissionJob = null;
  }

  if (weeklyMissionJob) {
    weeklyMissionJob.stop();
    weeklyMissionJob = null;
  }

  logger.info('[scheduler] Mission scheduler stopped');
}

// ─── Get scheduler status ────────────────────────────────────────────────────

export function getMissionSchedulerStatus(): {
  running: boolean;
  dailyJobActive: boolean;
  weeklyJobActive: boolean;
} {
  return {
    running: dailyMissionJob !== null || weeklyMissionJob !== null,
    dailyJobActive: dailyMissionJob !== null,
    weeklyJobActive: weeklyMissionJob !== null,
  };
}
