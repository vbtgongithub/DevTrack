// src/modules/xp/processor.ts — XP processing engine with idempotency
// Processes XP events, persists transactions, aggregates UserXp state.
// All XP awards MUST flow through this module — no direct UserXp writes elsewhere.

import { Types } from 'mongoose';
import { UserXp, XpTransaction, UserAnalytics, type IUserXp } from '../../db/models/index.js';
import { eventBus } from '../../shared/sse/index.js';
import { logger } from '../../shared/logger.js';
import {
  calculateLevel,
  xpToNextLevel,
  xpForDifficulty,
  calculateMilestoneXp,
  XP_REWARDS,
} from './rules.js';
import type { XpSourceType } from '../../db/models/index.js';
import { updateMissionProgress } from '../missions/missionProgress.service.js';
import { cacheManager } from '../../shared/cache/cacheManager.js';
import { unifiedRuntimeStateService } from '../runtime-state/unifiedRuntimeState.service.js';

export interface XpEventPayload {
  userId: string;
  sourceType: XpSourceType;
  sourceId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export interface XpProcessingResult {
  awarded: boolean;
  xpAwarded: number;
  duplicate: boolean;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  newTotalXp: number;
}

// ─── Core XP processor ───────────────────────────────────────────────────────

export async function processXpEvent(payload: XpEventPayload): Promise<XpProcessingResult> {
  const { userId, sourceType, sourceId, difficulty, metadata, requestId } = payload;
  const userObjId = new Types.ObjectId(userId);

  // ── Step 1: Check idempotency — reject duplicate awards ─────────────────
  const existingTransaction = await XpTransaction.findOne({ userId: userObjId, sourceType, sourceId });
  if (existingTransaction) {
    logger.debug('[xp] Duplicate XP event rejected', {
      event: 'xp_duplicate_rejected',
      userId,
      sourceType,
      sourceId,
      requestId,
    });
    return {
      awarded: false,
      xpAwarded: 0,
      duplicate: true,
      levelBefore: existingTransaction.levelAfter,
      levelAfter: existingTransaction.levelAfter,
      leveledUp: false,
      newTotalXp: existingTransaction.newTotalXp,
    };
  }

  // ── Step 2: Calculate XP award ───────────────────────────────────────────
  const xpAwarded = calculateXpAward(sourceType, difficulty, metadata);

  // ── Step 3: Get current UserXp state (or create default) ─────────────────
  let userXp = await UserXp.findOne({ userId: userObjId });
  if (!userXp) {
    userXp = await UserXp.create({ userId: userObjId });
  }

  const levelBefore = userXp.currentLevel;
  const previousTotalXp = userXp.totalXp;
  const newTotalXp = previousTotalXp + xpAwarded;
  const levelAfter = calculateLevel(newTotalXp);
  const leveledUp = levelAfter > levelBefore;

  // ── Step 4: Insert immutable transaction (idempotency guard) ────────────
  try {
    await XpTransaction.create({
      userId: userObjId,
      sourceType,
      sourceId,
      xpAwarded,
      previousTotalXp,
      newTotalXp,
      levelBefore,
      levelAfter,
      metadata: metadata ?? {},
    });
  } catch (err: unknown) {
    // Duplicate key — another worker already processed this event
    if ((err as { code?: number })?.code === 11000) {
      logger.debug('[xp] Transaction deduped on insert', {
        event: 'xp_insert_dedup',
        userId,
        sourceType,
        sourceId,
        requestId,
      });
      return {
        awarded: false,
        xpAwarded: 0,
        duplicate: true,
        levelBefore,
        levelAfter: calculateLevel(previousTotalXp),
        leveledUp: false,
        newTotalXp: previousTotalXp,
      };
    }
    throw err;
  }

  // ── Step 5: Atomic aggregate update ─────────────────────────────────────
  // IMPORTANT: currentLevel MUST NOT be in both $inc and $set — Mongoose will throw.
  // We use $set exclusively for currentLevel and xpToNextLevel, $inc only for counters.
  const incSet: Record<string, number> = {
    totalXp: xpAwarded,
    'lifetimeStats.totalXpEarned': xpAwarded,
  };
  if (sourceType === 'dsa_accepted' && difficulty) {
    incSet['lifetimeStats.totalProblemsSolved'] = 1;
    if (difficulty === 'easy') incSet['lifetimeStats.easySolved'] = 1;
    if (difficulty === 'medium') incSet['lifetimeStats.mediumSolved'] = 1;
    if (difficulty === 'hard') incSet['lifetimeStats.hardSolved'] = 1;
  }
  if (sourceType === 'dsa_contest') incSet['lifetimeStats.totalContests'] = 1;
  if (sourceType === 'daily_streak') incSet['lifetimeStats.dailyStreaks'] = 1;
  if (sourceType === 'sync_completed') incSet['lifetimeStats.totalSyncs'] = 1;

  const updateSet: Record<string, unknown> = {
    currentLevel: levelAfter,
    xpToNextLevel: xpToNextLevel(newTotalXp, levelAfter),
    lastXpGainedAt: new Date(),
  };

  await UserXp.findByIdAndUpdate(userXp._id, {
    $inc: incSet,
    $set: updateSet,
  });

  // ── Step 6: Emit SSE events ────────────────────────────────────────────────
  eventBus.emitXpUpdated(userId, newTotalXp, xpAwarded, levelAfter, xpToNextLevel(newTotalXp, levelAfter));

  if (leveledUp) {
    eventBus.emitLevelUp(userId, levelAfter, newTotalXp);
  }

  // ── Step 7: Sync to UserAnalytics ────────────────────────────────────────
  await syncUserAnalytics(userId, newTotalXp, levelAfter, sourceType);

  // ── Step 8: Update mission progress ──────────────────────────────────────
  if (sourceType === 'dsa_accepted') {
    await updateMissionProgress(userId, 'dsa_solve', { difficulty });
  } else if (sourceType === 'dsa_contest') {
    await updateMissionProgress(userId, 'dsa_contest');
  } else if (sourceType === 'daily_streak') {
    await updateMissionProgress(userId, 'streak_day');
  } else if (sourceType === 'sync_completed') {
    await updateMissionProgress(userId, 'sync');
  }

  // ── Step 9: Cache invalidation ───────────────────────────────────────────
  try {
    await cacheManager.invalidateAllUserCache(userId);
  } catch (err) {
    logger.warn('[xp] Cache invalidation failed (non-fatal)', { error: err });
  }

  // ── Step 10: Runtime state sync ──────────────────────────────────────────
  try {
    await unifiedRuntimeStateService.updateFromEvent({
      eventId: `xp_${sourceId}_${Date.now()}`,
      eventType: 'xp_awarded',
      userId,
      timestamp: new Date(),
      data: {
        xpAwarded,
        newTotalXp,
        levelBefore,
        levelAfter,
        xpToNextLevel: xpToNextLevel(newTotalXp, levelAfter),
      },
    });
  } catch (err) {
    logger.warn('[xp] Runtime state sync failed (non-fatal)', { error: err });
  }

  logger.info('[xp] XP awarded', {
    event: 'xp_awarded',
    userId,
    sourceType,
    sourceId,
    xpAwarded,
    newTotalXp,
    levelBefore,
    levelAfter,
    leveledUp,
    requestId,
  });

  return {
    awarded: true,
    xpAwarded,
    duplicate: false,
    levelBefore,
    levelAfter,
    leveledUp,
    newTotalXp,
  };
}

// ─── XP award calculator ────────────────────────────────────────────────────

function calculateXpAward(
  sourceType: XpSourceType,
  difficulty?: 'easy' | 'medium' | 'hard',
  metadata?: Record<string, unknown>
): number {
  switch (sourceType) {
    case 'dsa_accepted': return xpForDifficulty(difficulty);
    case 'dsa_contest': return XP_REWARDS.contestParticipated;
    case 'daily_streak': return XP_REWARDS.dailyStreak;
    case 'sync_completed': return XP_REWARDS.syncCompleted;
    case 'focus_session': return 50; // Pomodoro/Focus session reward
    case 'challenge_completed': return typeof metadata?.xpReward === 'number' ? metadata.xpReward : 35;
    case 'milestone': return 0;
    case 'manual': return 0;
    default: return 0;
  }
}

// ─── Milestone bonus processor ─────────────────────────────────────────────

export async function processMilestoneXp(
  userId: string,
  totalSolved: number,
  requestId?: string
): Promise<void> {
  const milestoneXp = calculateMilestoneXp(totalSolved);
  if (milestoneXp === 0) return;

  const sourceId = `milestone_${totalSolved}`;
  const existing = await XpTransaction.findOne({
    userId: new Types.ObjectId(userId),
    sourceType: 'milestone',
    sourceId,
  });
  if (existing) return;

  // Milestones award via separate mechanism — directly insert transaction
  const userObjId = new Types.ObjectId(userId);
  let userXp = await UserXp.findOne({ userId: userObjId });
  if (!userXp) {
    userXp = await UserXp.create({ userId: userObjId });
  }

  const levelBefore = userXp.currentLevel;
  const newTotalXp = userXp.totalXp + milestoneXp;
  const levelAfter = calculateLevel(newTotalXp);

  try {
    await XpTransaction.create({
      userId: userObjId,
      sourceType: 'milestone',
      sourceId,
      xpAwarded: milestoneXp,
      previousTotalXp: userXp.totalXp,
      newTotalXp,
      levelBefore,
      levelAfter,
      metadata: { totalSolved, reason: `${totalSolved} problems solved` },
    });

    await UserXp.findByIdAndUpdate(userXp._id, {
      $inc: { totalXp: milestoneXp, 'lifetimeStats.totalXpEarned': milestoneXp },
      $set: {
        currentLevel: levelAfter,
        xpToNextLevel: xpToNextLevel(newTotalXp, levelAfter),
        lastXpGainedAt: new Date(),
      },
    });

    eventBus.emitXpUpdated(userId, newTotalXp, milestoneXp, levelAfter, xpToNextLevel(newTotalXp, levelAfter));
    if (levelAfter > levelBefore) eventBus.emitLevelUp(userId, levelAfter, newTotalXp);
  } catch (err: unknown) {
    if ((err as { code?: number })?.code !== 11000) throw err;
  }
}

// ─── Read-only UserXp fetch ─────────────────────────────────────────────────

export async function getUserXp(userId: string): Promise<{
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpInCurrentLevel: number;
  progressPercent: number;
  lifetimeStats: IUserXp['lifetimeStats'];
} | null> {
  const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });
  if (!userXp) return null;

  const { xpInCurrentLevel: getXpInCurrentLevel, xpProgressPercent } = await import('./rules.js');

  return {
    totalXp: userXp.totalXp,
    currentLevel: userXp.currentLevel,
    xpToNextLevel: userXp.xpToNextLevel,
    xpInCurrentLevel: getXpInCurrentLevel(userXp.totalXp, userXp.currentLevel),
    progressPercent: xpProgressPercent(userXp.totalXp, userXp.currentLevel),
    lifetimeStats: userXp.lifetimeStats,
  };
}

// ─── UserAnalytics sync ───────────────────────────────────────────────────

async function syncUserAnalytics(
  userId: string,
  totalXp: number,
  currentLevel: number,
  sourceType: XpSourceType
): Promise<void> {
  try {
    const userObjId = new Types.ObjectId(userId);

    // Get DSA solve count from lifetime stats
    const userXp = await UserXp.findOne({ userId: userObjId });
    const dsaSolveCount = userXp?.lifetimeStats?.totalProblemsSolved ?? 0;

    // Get weekly XP for history
    const weekStart = getWeekStart(new Date());
    const analytics = await UserAnalytics.findOne({ userId: userObjId });

    let weeklyXPHistory = analytics?.weeklyXPHistory ?? [];

    // Update or add current week
    const weekIndex = weeklyXPHistory.findIndex(
      (w) => w.weekStart.getTime() === weekStart.getTime()
    );

    if (weekIndex >= 0) {
      weeklyXPHistory[weekIndex].xp += totalXp;
    } else {
      weeklyXPHistory.push({ weekStart, xp: totalXp });
    }

    // Keep only last 12 weeks
    if (weeklyXPHistory.length > 12) {
      weeklyXPHistory = weeklyXPHistory
        .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
        .slice(0, 12);
    }

    // Calculate weekly consistency score
    const activeWeeks = weeklyXPHistory.filter((w) => w.xp > 0).length;
    const weeklyConsistencyScore = Math.round((activeWeeks / 12) * 100);

    await UserAnalytics.findOneAndUpdate(
      { userId: userObjId },
      {
        $set: {
          totalXp,
          currentLevel,
          dsaSolveCount,
          weeklyXPHistory,
          weeklyConsistencyScore,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    logger.warn('[xp] Failed to sync UserAnalytics', { error: err, userId });
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}