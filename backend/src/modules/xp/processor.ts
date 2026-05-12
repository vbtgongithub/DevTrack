// src/modules/xp/processor.ts — XP processing engine with idempotency
// Processes XP events, persists transactions, aggregates UserXp state.
// All XP awards MUST flow through this module — no direct UserXp writes elsewhere.

import { Types } from 'mongoose';
import { UserXp, XpTransaction, type IUserXp } from '../../db/models/index.js';
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
  const xpAwarded = calculateXpAward(sourceType, difficulty);

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
  const incSet: Record<string, number> = {
    totalXp: xpAwarded,
    currentLevel: leveledUp ? 1 : 0,
    xpToNextLevel: leveledUp ? xpToNextLevel(newTotalXp, levelAfter) : 0,
    lastXpGainedAt: 0,
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

  const updateSet: Record<string, unknown> = {};
  if (leveledUp) {
    updateSet.currentLevel = levelAfter;
    updateSet.xpToNextLevel = xpToNextLevel(newTotalXp, levelAfter);
  }
  updateSet.lastXpGainedAt = new Date();

  await UserXp.findByIdAndUpdate(userXp._id, {
    $inc: incSet,
    ...(Object.keys(updateSet).length > 0 ? { $set: updateSet } : {}),
  });

  // ── Step 6: Emit SSE events ────────────────────────────────────────────────
  eventBus.emitXpUpdated(userId, newTotalXp, xpAwarded, levelAfter, xpToNextLevel(newTotalXp, levelAfter));

  if (leveledUp) {
    eventBus.emitLevelUp(userId, levelAfter, newTotalXp);
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

function calculateXpAward(sourceType: XpSourceType, difficulty?: 'easy' | 'medium' | 'hard'): number {
  switch (sourceType) {
    case 'dsa_accepted': return xpForDifficulty(difficulty);
    case 'dsa_contest': return XP_REWARDS.contestParticipated;
    case 'daily_streak': return XP_REWARDS.dailyStreak;
    case 'sync_completed': return XP_REWARDS.syncCompleted;
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
      $inc: { totalXp: milestoneXp, currentLevel: levelAfter > levelBefore ? 1 : 0, 'lifetimeStats.totalXpEarned': milestoneXp },
      $set: levelAfter > levelBefore ? { currentLevel: levelAfter, xpToNextLevel: xpToNextLevel(newTotalXp, levelAfter), lastXpGainedAt: new Date() } : { lastXpGainedAt: new Date() },
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