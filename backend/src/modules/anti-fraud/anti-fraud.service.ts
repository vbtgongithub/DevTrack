// src/modules/anti-fraud/anti-fraud.service.ts — Abuse economics + anti-farming layer
// Prevents XP inflation and fake engagement

import { Types } from 'mongoose';
import { UserXp, ActivityEvent, type IUserXp } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import { getRedisClient } from '../../shared/redis/client.js';

const DAILY_XP_CAP = 500; // Maximum XP per day
const DAILY_EASY_PROBLEM_CAP = 10; // Max easy problems for full XP
const DAILY_COMMITS_CAP = 20; // Max commits for full XP
const MIN_COMMIT_LENGTH = 10; // Minimum commit message length

// Multipliers for diminishing returns
const EASY_PROBLEM_MULTIPLIERS = {
  1: 1.0,    // First 1-5: 100%
  5: 0.8,    // 6-10: 80%
  10: 0.5,   // 11-15: 50%
  15: 0.25,  // 16+: 25%
};

const COMMIT_MULTIPLIERS = {
  1: 1.0,
  10: 0.8,
  15: 0.5,
  20: 0.25,
};

// Suspicious activity thresholds
const SUSPICIOUS_VELOCITY_THRESHOLD = 50; // events per hour
const SPAM_DETECTION_TIME_WINDOW = 60000; // 1 minute

export interface XpAwardDecision {
  allowed: boolean;
  awardedXp: number;
  multiplier: number;
  reason?: string;
  suspicious: boolean;
  flaggedReason?: string;
}

export interface ActivityValidationResult {
  valid: boolean;
  reason?: string;
  risk: 'low' | 'medium' | 'high';
}

// ─── Main XP award decision engine ─────────────────────────────────────────

export async function calculateXpAward(
  sourceType: string,
  sourceId: string,
  baseXp: number,
  userId: string
): Promise<XpAwardDecision> {
  const userObjId = new Types.ObjectId(userId);
  const today = getStartOfDay();

  // Get user's daily activity counts
  const dailyStats = await getDailyActivityCounts(userId, today);
  const redis = getRedisClient();

  // ── Check daily XP cap ─────────────────────────────────────────────────
  const todayKey = `xp:daily:${userId}:${today.getTime()}`;
  const currentDailyXp = parseInt((await redis.get(todayKey)) || '0', 10);

  if (currentDailyXp >= DAILY_XP_CAP) {
    logger.warn('[anti-fraud] Daily XP cap reached', { userId, currentDailyXp, cap: DAILY_XP_CAP });
    return {
      allowed: true,
      awardedXp: 0,
      multiplier: 0,
      reason: 'Daily XP cap reached',
      suspicious: false,
    };
  }

  // Calculate remaining XP budget
  const remainingXpBudget = Math.max(0, DAILY_XP_CAP - currentDailyXp);

  // ── Source-specific validation ─────────────────────────────────────────
  let multiplier = 1.0;
  let suspicious = false;
  let flaggedReason: string | undefined;

  switch (sourceType) {
    case 'dsa_accepted': {
      const dailyEasy = dailyStats.easyProblems || 0;
      multiplier = getProblemMultiplier(dailyEasy);

      // Check suspicious pattern: too many easy problems
      if (dailyEasy > DAILY_EASY_PROBLEM_CAP * 2) {
        suspicious = true;
        flaggedReason = 'Excessive easy problem solving';
      }
      break;
    }

    case 'sync_completed': {
      const dailyCommits = dailyStats.githubCommits || 0;
      multiplier = getCommitMultiplier(dailyCommits);

      // Check suspicious pattern: too many commits
      if (dailyCommits > DAILY_COMMITS_CAP * 2) {
        suspicious = true;
        flaggedReason = 'Excessive GitHub commits';
      }
      break;
    }
  }

  // ── Check velocity-based suspicious activity ───────────────────────────
  const velocityKey = `velocity:${userId}`;
  const currentVelocity = parseInt((await redis.get(velocityKey)) || '0', 10);
  await redis.incr(velocityKey);
  await redis.expire(velocityKey, 3600); // 1 hour window

  if (currentVelocity > SUSPICIOUS_VELOCITY_THRESHOLD) {
    suspicious = true;
    flaggedReason = 'High activity velocity';
    logger.warn('[anti-fraud] Suspicious velocity detected', { userId, velocity: currentVelocity });
  }

  // Calculate final XP
  const rawXp = Math.floor(baseXp * multiplier);
  const finalXp = Math.min(rawXp, remainingXpBudget);

  // Update daily XP counter
  if (finalXp > 0) {
    await redis.incrby(todayKey, finalXp);
    await redis.expire(todayKey, 86400); // 24 hour TTL
  }

  // Log the decision
  logger.info('[anti-fraud] XP award decision', {
    userId,
    sourceType,
    sourceId,
    baseXp,
    multiplier,
    finalXp,
    suspicious,
    flaggedReason,
    dailyXpUsed: currentDailyXp + finalXp,
  });

  return {
    allowed: true,
    awardedXp: finalXp,
    multiplier,
    reason: multiplier < 1.0 ? `Multiplier: ${multiplier}x due to daily limits` : undefined,
    suspicious,
    flaggedReason,
  };
}

// ─── Commit quality validation ───────────────────────────────────────────

export async function validateCommitQuality(
  commitMessage: string,
  commitDiffLines: number
): Promise<ActivityValidationResult> {
  // Check minimum commit message length
  if (commitMessage.length < MIN_COMMIT_LENGTH) {
    return {
      valid: false,
      reason: `Commit message too short (minimum ${MIN_COMMIT_LENGTH} characters)`,
      risk: 'medium',
    };
  }

  // Check for meaningful diff (at least some code changes)
  if (commitDiffLines < 3) {
    return {
      valid: false,
      reason: 'Commit appears to be trivial (less than 3 lines changed)',
      risk: 'low',
    };
  }

  // Check for suspicious patterns in commit message
  const suspiciousPatterns = [/^test\s/i, /^wip\s/i, /^merge\s/i, /^fix\s*$/i];
  const hasSuspiciousPattern = suspiciousPatterns.some((p) => p.test(commitMessage));

  if (hasSuspiciousPattern && commitDiffLines < 10) {
    return {
      valid: true,
      reason: 'Commit flagged for review',
      risk: 'medium',
    };
  }

  return { valid: true, risk: 'low' };
}

// ─── Leaderboard integrity check ─────────────────────────────────────────

export async function checkLeaderboardIntegrity(userId: string): Promise<{
  suspicious: boolean;
  reasons: string[];
}> {
  const userXp = await UserXp.findOne({ userId: new Types.ObjectId(userId) });

  if (!userXp) {
    return { suspicious: false, reasons: [] };
  }

  const reasons: string[] = [];

  // Check for unnatural XP accumulation
  const xpPerDay = userXp.totalXp / Math.max(1, Math.floor((Date.now() - userXp.lastXpGainedAt!.getTime()) / (1000 * 60 * 60 * 24)));

  if (xpPerDay > DAILY_XP_CAP) {
    reasons.push(`Unnatural XP rate: ${xpPerDay.toFixed(0)} XP/day`);
  }

  // Check for suspiciously low problem diversity
  const totalProblems = userXp.lifetimeStats?.totalProblemsSolved ?? 0;
  const uniqueDifficulties = [
    userXp.lifetimeStats?.easySolved ?? 0,
    userXp.lifetimeStats?.mediumSolved ?? 0,
    userXp.lifetimeStats?.hardSolved ?? 0,
  ].filter((v) => v > 0).length;

  if (totalProblems > 100 && uniqueDifficulties === 1) {
    reasons.push('Low problem difficulty diversity');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

// ─── Helper functions ───────────────────────────────────────────────────

function getStartOfDay(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getProblemMultiplier(dailyEasyCount: number): number {
  if (dailyEasyCount <= 5) return EASY_PROBLEM_MULTIPLIERS[1];
  if (dailyEasyCount <= 10) return EASY_PROBLEM_MULTIPLIERS[5];
  if (dailyEasyCount <= 15) return EASY_PROBLEM_MULTIPLIERS[10];
  return EASY_PROBLEM_MULTIPLIERS[15];
}

function getCommitMultiplier(dailyCommitCount: number): number {
  if (dailyCommitCount <= 10) return COMMIT_MULTIPLIERS[1];
  if (dailyCommitCount <= 15) return COMMIT_MULTIPLIERS[10];
  if (dailyCommitCount <= 20) return COMMIT_MULTIPLIERS[15];
  return COMMIT_MULTIPLIERS[20];
}

async function getDailyActivityCounts(userId: string, day: Date): Promise<{
  easyProblems: number;
  mediumProblems: number;
  hardProblems: number;
  githubCommits: number;
}> {
  const startOfDay = new Date(day);
  const endOfDay = new Date(day);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const activities = await ActivityEvent.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        occurredAt: { $gte: startOfDay, $lt: endOfDay },
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = {
    easyProblems: 0,
    mediumProblems: 0,
    hardProblems: 0,
    githubCommits: 0,
  };

  for (const activity of activities) {
    if (activity._id === 'problem_solved_easy') counts.easyProblems = activity.count;
    if (activity._id === 'problem_solved_medium') counts.mediumProblems = activity.count;
    if (activity._id === 'problem_solved_hard') counts.hardProblems = activity.count;
    if (activity._id === 'commit_pushed') counts.githubCommits = activity.count;
  }

  return counts;
}

// ─── Get anti-fraud configuration ────────────────────────────────────────

export function getAntiFraudConfig(): {
  dailyXpCap: number;
  dailyEasyCap: number;
  dailyCommitCap: number;
  minCommitLength: number;
  suspiciousVelocityThreshold: number;
} {
  return {
    dailyXpCap: DAILY_XP_CAP,
    dailyEasyCap: DAILY_EASY_PROBLEM_CAP,
    dailyCommitCap: DAILY_COMMITS_CAP,
    minCommitLength: MIN_COMMIT_LENGTH,
    suspiciousVelocityThreshold: SUSPICIOUS_VELOCITY_THRESHOLD,
  };
}