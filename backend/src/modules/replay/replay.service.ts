// src/modules/replay/replay.service.ts — Event replay + recovery architecture
// Phase-1 Hardening: Replay-safe rebuilding for recovery

import { Types } from 'mongoose';
import { ActivityEvent, UserStreakLog, XpTransaction, UserAnalytics, UserXp } from '../../db/models/index.js';
import { getXpProcessingQueue } from '../../shared/jobs/index.js';
import { logger } from '../../shared/logger.js';
import { QueueNames } from '../../shared/jobs/types.js';

export interface ReplayResult {
  success: boolean;
  eventsProcessed: number;
  errors: string[];
  durationMs: number;
}

// ─── Activity replay for analytics rebuild ────────────────────────────────

export async function replayActivityForAnalytics(
  userId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<ReplayResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

  if (fromDate || toDate) {
    query.occurredAt = {};
    if (fromDate) {
      (query.occurredAt as Record<string, Date>).$gte = fromDate;
    }
    if (toDate) {
      (query.occurredAt as Record<string, Date>).$lte = toDate;
    }
  }

  try {
    const events = await ActivityEvent.find(query).sort({ occurredAt: 1 }).limit(10000);

    let processed = 0;

    for (const event of events) {
      try {
        // Determine XP based on event type
        let sourceType = 'manual';
        let xpAmount = 0;

        switch (event.type) {
          case 'problem_solved':
            sourceType = 'dsa_accepted';
            xpAmount = 10; // Default, actual would be from problem difficulty
            break;
          case 'commit_pushed':
            sourceType = 'sync_completed';
            xpAmount = 5;
            break;
          case 'contest_participated':
            sourceType = 'dsa_contest';
            xpAmount = 40;
            break;
        }

        // Queue XP processing (idempotent)
        if (xpAmount > 0) {
          const queue = getXpProcessingQueue();
          await queue.add('replay-xp', {
            userId: event.userId.toString(),
            eventId: `replay_${event._id}`,
            sourceType,
            sourceId: `replay_${event._id}`,
            metadata: {
              replayedAt: new Date().toISOString(),
              originalOccurredAt: event.occurredAt.toISOString(),
            },
          });
          processed++;
        }
      } catch (err) {
        errors.push(`Failed to process event ${event._id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('[replay] Activity replay completed', {
      userId,
      eventsFound: events.length,
      eventsProcessed: processed,
      durationMs,
    });

    return {
      success: errors.length === 0,
      eventsProcessed: processed,
      errors,
      durationMs,
    };
  } catch (err) {
    return {
      success: false,
      eventsProcessed: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Streak rebuild from activity logs ────────────────────────────────────

export async function replayStreakFromLogs(userId: string): Promise<ReplayResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Get all streak logs for user
    const logs = await UserStreakLog.find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(365);

    // Calculate streaks
    const streakMap = new Map<string, { dsa: number; github: number; unified: number }>();

    for (const log of logs) {
      const dateKey = log.date.toISOString().split('T')[0];
      const existing = streakMap.get(dateKey) || { dsa: 0, github: 0, unified: 0 };

      if (log.streakType === 'dsa') existing.dsa = 1;
      if (log.streakType === 'github') existing.github = 1;
      if (log.streakType === 'unified') existing.unified = 1;

      streakMap.set(dateKey, existing);
    }

    // Calculate current streak
    const dates = Array.from(streakMap.keys()).sort().reverse();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < dates.length; i++) {
      const dayData = streakMap.get(dates[i])!;
      const hasActivity = dayData.dsa || dayData.github;

      if (hasActivity) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
      }
    }

    bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

    // Update UserAnalytics
    const lastActiveDate = dates.length > 0 ? new Date(dates[0]) : null;

    await UserAnalytics.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          currentStreak,
          bestStreak,
          lastActiveDate,
          currentStreakType: 'unified',
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const durationMs = Date.now() - startTime;

    logger.info('[replay] Streak rebuild completed', {
      userId,
      currentStreak,
      bestStreak,
      logCount: logs.length,
      durationMs,
    });

    return {
      success: true,
      eventsProcessed: logs.length,
      errors: [],
      durationMs,
    };
  } catch (err) {
    return {
      success: false,
      eventsProcessed: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Full analytics rebuild for corrupted data ──────────────────────────

export async function fullAnalyticsRebuild(userId: string): Promise<ReplayResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Step 1: Recalculate XP from transactions
    const transactions = await XpTransaction.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: 1 });

    let totalXp = 0;
    let maxLevel = 1;

    for (const tx of transactions) {
      totalXp += tx.xpAwarded;
      if (tx.levelAfter > maxLevel) maxLevel = tx.levelAfter;
    }

    // Step 2: Update UserXp
    await UserXp.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          totalXp,
          currentLevel: maxLevel,
          lastXpGainedAt: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : null,
        },
      },
      { upsert: true }
    );

    // Step 3: Rebuild streak
    const streakResult = await replayStreakFromLogs(userId);
    if (!streakResult.success) {
      errors.push(...streakResult.errors);
    }

    // Step 4: Update UserAnalytics with full state
    const dsaSolveCount = (await XpTransaction.countDocuments({
      userId: new Types.ObjectId(userId),
      sourceType: 'dsa_accepted',
    })) || 0;

    await UserAnalytics.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          totalXp,
          currentLevel: maxLevel,
          dsaSolveCount,
          computedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const durationMs = Date.now() - startTime;

    logger.info('[replay] Full analytics rebuild completed', {
      userId,
      totalXp,
      maxLevel,
      dsaSolveCount,
      transactionCount: transactions.length,
      durationMs,
    });

    return {
      success: errors.length === 0,
      eventsProcessed: transactions.length,
      errors,
      durationMs,
    };
  } catch (err) {
    return {
      success: false,
      eventsProcessed: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      durationMs: Date.now() - startTime,
    };
  }
}

// ─── Scheduled recovery job for failed jobs ─────────────────────────────

export async function processFailedJobRecovery(): Promise<void> {
  const queues = [
    QueueNames.XP_PROCESSING,
    QueueNames.STREAK_RECALC,
    QueueNames.ANALYTICS_SYNC,
  ];

  for (const queueName of queues) {
    const { getQueue } = await import('../../shared/jobs/queueFactory.js');
    const queue = getQueue(queueName);

    if (!queue) continue;

    const failedJobs = await queue.getFailed(0, 100);

    for (const job of failedJobs) {
      const attempts = job.attemptsMade;
      const maxAttempts = 3;

      // Retry if under max attempts
      if (attempts < maxAttempts) {
        logger.info('[replay] Retrying failed job', {
          queue: queueName,
          jobId: job.id,
          attempts,
        });
        await job.retry();
      } else {
        // Move to DLQ (BullMQ handles this automatically based on removeOnFail)
        logger.warn('[replay] Job moved to DLQ after max retries', {
          queue: queueName,
          jobId: job.id,
          attempts,
        });
      }
    }
  }
}