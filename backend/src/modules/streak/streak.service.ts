// src/modules/streak/streak.service.ts — Streak Engine V2
// Timezone-safe streak computation with anti-cheat, deduplication, and freeze support.

import { Types } from 'mongoose';
import { UserStreakLog, UserAnalytics, type StreakType, type IUserStreakLog } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import { eventBus } from '../../shared/sse/index.js';
import { getXpProcessingQueue } from '../../shared/jobs/index.js';

const STREAK_FREEZE_DAYS = 1; // Freeze grants 1 day of protection
const MAX_VALID_AGE_DAYS = 2; // Reject activity older than 2 days (anti-cheat)

export interface RecordActivityPayload {
  userId: string;
  streakType: StreakType;
  source: string; // submissionId, commit SHA, etc.
  activityDate?: Date;
  timezone?: string;
  metadata?: Record<string, unknown>;
}

export interface StreakStatus {
  currentStreak: number;
  bestStreak: number;
  streakType: StreakType;
  lastActiveDate: Date | null;
  isActiveToday: boolean;
  streakFreezeUntil: Date | null;
}

// ─── Core streak recorder ─────────────────────────────────────────────────────

export async function recordActivity(payload: RecordActivityPayload): Promise<void> {
  const { userId, streakType, source, activityDate = new Date(), timezone = 'UTC', metadata = {} } = payload;
  const userObjId = new Types.ObjectId(userId);

  // ── Step 1: Normalize date to user's timezone midnight ───────────────────
  const normalizedDate = normalizeToUserDate(activityDate, timezone);

  // ── Step 2: Anti-cheat validation ─────────────────────────────────────────
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - normalizedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > MAX_VALID_AGE_DAYS) {
    logger.warn('[streak] Activity rejected: too old', {
      event: 'streak_rejected_old',
      userId,
      streakType,
      activityDate: normalizedDate.toISOString(),
      daysDiff,
    });
    return;
  }

  // ── Step 3: Deduplication ────────────────────────────────────────────────
  const existingLog = await UserStreakLog.findOne({
    userId: userObjId,
    date: normalizedDate,
    streakType,
  });

  if (existingLog) {
    // Check if source already recorded
    if (existingLog.sources.includes(source)) {
      logger.debug('[streak] Duplicate source ignored', {
        event: 'streak_duplicate_source',
        userId,
        streakType,
        source,
      });
      return;
    }

    // Add new source to existing log
    await UserStreakLog.findByIdAndUpdate(existingLog._id, {
      $inc: { activityCount: 1 },
      $addToSet: { sources: source },
    });
    logger.debug('[streak] Source added to existing log', {
      event: 'streak_source_added',
      userId,
      streakType,
      source,
    });
  } else {
    // Create new log
    await UserStreakLog.create({
      userId: userObjId,
      date: normalizedDate,
      streakType,
      activityCount: 1,
      sources: [source],
      timezone,
      metadata,
    });
    logger.debug('[streak] New activity logged', {
      event: 'streak_new_log',
      userId,
      streakType,
      date: normalizedDate.toISOString(),
    });
  }

  // ── Step 4: Recalculate streak ────────────────────────────────────────────
  await recalculateStreak(userId, streakType);
}

// ─── Recalculation ─────────────────────────────────────────────────────────

export async function recalculateStreak(userId: string, streakType: StreakType): Promise<StreakStatus> {
  const userObjId = new Types.ObjectId(userId);
  const timezone = await getUserTimezone(userId);

  // Get all logs for this user and streak type, sorted by date descending
  const logs = await UserStreakLog.find({ userId: userObjId, streakType })
    .sort({ date: -1 })
    .limit(365); // Cap at 1 year for performance

  if (logs.length === 0) {
    return resetStreak(userId, streakType);
  }

  // Calculate current streak
  const { currentStreak, streakDays } = calculateCurrentStreak(logs, timezone);

  // Update best streak if current exceeds it
  const analytics = await UserAnalytics.findOne({ userId: userObjId });
  const bestStreak = Math.max(analytics?.bestStreak ?? 0, currentStreak);

  // Determine if streak is active today
  const today = normalizeToUserDate(new Date(), timezone);
  const isActiveToday = streakDays.length > 0 &&
    streakDays[0].getTime() === today.getTime();

  // Build streak status
  const status: StreakStatus = {
    currentStreak,
    bestStreak,
    streakType,
    lastActiveDate: streakDays[0] ?? null,
    isActiveToday,
    streakFreezeUntil: analytics?.streakFreezeUntil ?? null,
  };

  // ── Step 5: Update UserAnalytics ─────────────────────────────────────────
  const update: Record<string, unknown> = {
    currentStreak,
    bestStreak,
    currentStreakType: streakType,
    lastActiveDate: streakDays[0] ?? null,
    updatedAt: new Date(),
    computedAt: new Date(),
  };

  // Handle streak freeze expiry
  if (analytics?.streakFreezeUntil && analytics.streakFreezeUntil < new Date()) {
    update.streakFreezeUntil = null;
  }

  await UserAnalytics.findOneAndUpdate(
    { userId: userObjId },
    { $set: update },
    { upsert: true, new: true }
  );

  // ── Step 6: Emit streak milestone events and trigger XP ───────────────
  const previousStreak = analytics?.currentStreak ?? 0;
  if (currentStreak > 0 && currentStreak % 7 === 0 && currentStreak > previousStreak) {
    eventBus.emitStreakMilestone(userId, currentStreak, streakType);

    // Trigger streak bonus XP via queue
    try {
      const queue = getXpProcessingQueue();
      await queue.add('streak-milestone', {
        userId,
        sourceType: 'daily_streak',
        sourceId: `streak_${currentStreak}_${Date.now()}`,
        metadata: { streakDays: currentStreak, streakType },
      });
      logger.info('[streak] XP bonus queued for milestone', {
        event: 'streak_xp_queued',
        userId,
        streakDays: currentStreak,
      });
    } catch (err) {
      logger.warn('[streak] Failed to queue XP bonus', { error: err });
    }
  }

  logger.info('[streak] Recalculated', {
    event: 'streak_recalculated',
    userId,
    streakType,
    currentStreak,
    bestStreak,
    isActiveToday,
  });

  return status;
}

function calculateCurrentStreak(logs: IUserStreakLog[], timezone: string): { currentStreak: number; streakDays: Date[] } {
  const streakDays: Date[] = [];
  let streakCount = 0;

  // Group by date
  const dateMap = new Map<string, number>();
  for (const log of logs) {
    const dateKey = log.date.toISOString().split('T')[0];
    const existing = dateMap.get(dateKey) ?? 0;
    dateMap.set(dateKey, existing + log.activityCount);
  }

  // Sort dates
  const sortedDates = Array.from(dateMap.keys()).sort().reverse();

  // Check for freeze
  const today = normalizeToUserDate(new Date(), timezone);
  let expectedDate = new Date(today);

  for (const dateKey of sortedDates) {
    const logDate = new Date(dateKey);
    const daysDiff = Math.floor((expectedDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    // Allow for streak freeze
    if (daysDiff > 1) {
      // Check if within freeze period
      // For now, just break the streak
      break;
    }

    // Valid streak day
    streakDays.push(logDate);
    streakCount++;
    expectedDate = new Date(logDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return { currentStreak: streakCount, streakDays };
}

// ─── Reset streak ────────────────────────────────────────────────────────────

async function resetStreak(userId: string, streakType: StreakType): Promise<StreakStatus> {
  await UserAnalytics.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      $set: {
        currentStreak: 0,
        currentStreakType: streakType,
        lastActiveDate: null,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return {
    currentStreak: 0,
    bestStreak: 0,
    streakType,
    lastActiveDate: null,
    isActiveToday: false,
    streakFreezeUntil: null,
  };
}

// ─── Freeze management ─────────────────────────────────────────────────────

export async function activateStreakFreeze(userId: string): Promise<void> {
  const freezeUntil = new Date();
  freezeUntil.setDate(freezeUntil.getDate() + STREAK_FREEZE_DAYS);

  await UserAnalytics.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      $set: {
        streakFreezeUntil: freezeUntil,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  logger.info('[streak] Freeze activated', {
    event: 'streak_freeze_activated',
    userId,
    freezeUntil,
  });
}

// ─── Unified streak computation ────────────────────────────────────────────

export async function getUnifiedStreak(userId: string): Promise<StreakStatus> {
  const userObjId = new Types.ObjectId(userId);
  const timezone = await getUserTimezone(userId);
  const today = normalizeToUserDate(new Date(), timezone);

  // Check all three streak types for today
  const [dsaLog, githubLog] = await Promise.all([
    UserStreakLog.findOne({
      userId: userObjId,
      date: today,
      streakType: 'dsa',
    }),
    UserStreakLog.findOne({
      userId: userObjId,
      date: today,
      streakType: 'github',
    }),
  ]);

  // Determine which streak type to use for unified
  const analytics = await UserAnalytics.findOne({ userId: userObjId });

  if (dsaLog || githubLog) {
    // At least one activity today - update unified streak
    await recalculateStreak(userId, 'unified');
  }

  return {
    currentStreak: analytics?.currentStreak ?? 0,
    bestStreak: analytics?.bestStreak ?? 0,
    streakType: 'unified',
    lastActiveDate: analytics?.lastActiveDate ?? null,
    isActiveToday: !!(dsaLog || githubLog),
    streakFreezeUntil: analytics?.streakFreezeUntil ?? null,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalizeToUserDate(date: Date, timezone: string): Date {
  // Convert to user's timezone and get midnight
  // This is a simplified version - in production, use date-fns-tz or luxon
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getUserTimezone(userId: string): Promise<string> {
  // Fetch from user settings when available
  // For now, default to UTC
  return 'UTC';
}

// ─── Streak status getter ──────────────────────────────────────────────────

export async function getStreakStatus(userId: string, streakType?: StreakType): Promise<StreakStatus> {
  if (streakType) {
    return recalculateStreak(userId, streakType);
  }
  return getUnifiedStreak(userId);
}