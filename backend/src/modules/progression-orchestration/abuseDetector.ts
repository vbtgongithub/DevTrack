// src/modules/progression-orchestration/abuseDetector.ts
// Ingestion protection layer. Detects and quarantines farming, bots, and solve manipulations.

import { logger } from '../../shared/logger.js';
import type { CanonicalActivity } from './activityEvent.js';
import { getRedisClient } from '../../shared/redis/index.js';

export interface AbuseScoreResult {
  isSuspicious: boolean;
  score: number; // 0 (pristine) to 100 (highly abusive)
  reasons: string[];
}

export class AntiAbuseDetector {
  /**
   * Evaluates submission velocity and flags suspicious behaviors.
   */
  async evaluateActivity(activity: CanonicalActivity): Promise<AbuseScoreResult> {
    const reasons: string[] = [];
    let score = 0;

    // We use Redis to track solve frequencies per user
    const redis = getRedisClient();
    const userSolveKey = `devtrack:abuse:solves:${activity.userId}`;
    const now = Date.now();

    // 1. Check solve interval (rapid solve detection)
    // Add current timestamp to Redis sorted set
    await redis.zadd(userSolveKey, now, String(now));
    // Remove items older than 10 minutes (600s)
    await redis.zremrangebyscore(userSolveKey, 0, now - 10 * 60 * 1000);
    // Count active solves in the last 10 minutes
    const solvesInTenMinutes = await redis.zcard(userSolveKey);

    // If solves in 10 minutes exceed 5, that's impossible velocity for human solving
    if (solvesInTenMinutes > 5) {
      score += 40;
      reasons.push(`Impossible solve velocity: ${solvesInTenMinutes} solves in last 10 minutes`);
    }

    // 2. Check problem completion time from metadata if available
    const solveTimeSeconds = activity.metadata.runtime || 0;
    if (solveTimeSeconds > 0 && solveTimeSeconds < 5) {
      score += 30;
      reasons.push(`Suspicious solve completion time: ${solveTimeSeconds} seconds`);
    }

    // 3. Cross-platform duplicate check (solving same slug on multiple handles within 1 min)
    const slugKey = `devtrack:abuse:slug:${activity.provider}:${activity.providerEventId}`;
    const existingUser = await redis.get(slugKey);
    if (existingUser && existingUser !== activity.userId) {
      score += 50;
      reasons.push(`Duplicate submission of problem "${activity.providerEventId}" across different accounts`);
    } else {
      // Hold slug mapping for 60 seconds
      await redis.set(slugKey, activity.userId, 'EX', 60);
    }

    // 4. Impossible difficulty ratio
    if (activity.difficulty === 'hard' && solvesInTenMinutes >= 3) {
      score += 45;
      reasons.push('High-frequency hard solves flagged (possible script/replay bot)');
    }

    const isSuspicious = score >= 50;

    if (isSuspicious) {
      logger.warn('[anti-abuse] Suspicious user behavior flagged', {
        userId: activity.userId,
        score,
        reasons,
        activityId: activity.activityId,
      });
    }

    return {
      isSuspicious,
      score: Math.min(score, 100),
      reasons,
    };
  }

  /**
   * Places suspicious activities into quarantine for manual review.
   */
  async quarantineActivity(activity: CanonicalActivity, score: number, reasons: string[]): Promise<void> {
    const redis = getRedisClient();
    const quarantineKey = 'devtrack:quarantine:activities';
    await redis.hset(
      quarantineKey,
      activity.activityId,
      JSON.stringify({
        activity,
        score,
        reasons,
        flaggedAt: new Date().toISOString(),
      })
    );
  }
}

export const antiAbuseDetector = new AntiAbuseDetector();
