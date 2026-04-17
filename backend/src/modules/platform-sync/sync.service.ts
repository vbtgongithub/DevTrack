// src/modules/platform-sync/sync.service.ts
import { Types } from 'mongoose';
import { ConnectedPlatform, PlatformStats, SyncJob } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';

const SYNC_TIMEOUT_MS = 15000;

export interface SyncResult {
  platform: string;
  success: boolean;
  stats?: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    rating?: number;
    rank?: string;
    totalContests?: number;
  };
  error?: string;
}

interface CodeforcesUserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
  friendOfCount?: number;
  avatar?: string;
  organization?: string;
  registrationTimeSeconds?: number;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CodeforcesProblem {
  contestId?: number;
  index?: string;
  name?: string;
  type?: string;
}

interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  problem?: CodeforcesProblem;
  verdict?: string;
  language?: string;
  creationTimeSeconds?: number;
}

export async function syncAllPlatforms(userId: string): Promise<SyncResult[]> {
  const platforms = await ConnectedPlatform.find({
    userId: new Types.ObjectId(userId),
    isConnected: true,
  });

  const results: SyncResult[] = [];

  for (const platform of platforms) {
    try {
      const result = await syncPlatform(userId, platform.platformName);
      results.push(result);
    } catch (error) {
      logger.error(`Sync failed for ${platform.platformName}`, error);
      results.push({
        platform: platform.platformName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function syncPlatform(userId: string, platformName: string): Promise<SyncResult> {
  // Update sync status
  const platform = await ConnectedPlatform.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), platformName },
    { syncStatus: 'syncing', syncError: null },
    { new: true }
  );

  if (!platform) {
    return { platform: platformName, success: false, error: 'Platform not connected' };
  }

  // Create sync job
  const job = await SyncJob.create({
    userId: new Types.ObjectId(userId),
    platformName: platformName as 'leetcode' | 'codeforces' | 'github' | 'hackerrank' | 'codechef',
    status: 'running',
  });

  try {
    let stats: PlatformStatsInsert;

    if (platformName === 'codeforces') {
      stats = await syncCodeforces(platform.username);
    } else if (platformName === 'leetcode') {
      stats = await syncLeetCode(platform.username);
    } else {
      // For other platforms (github, hackerrank, codechef), return minimal stats
      stats = getMinimalStats(platform.username);
    }

    // Update platform stats
    await PlatformStats.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      {
        userId: new Types.ObjectId(userId),
        platformName: platformName as 'leetcode' | 'codeforces' | 'github' | 'hackerrank' | 'codechef',
        username: platform.username,
        ...stats,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update sync status
    await ConnectedPlatform.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      { syncStatus: 'success', lastSyncedAt: new Date(), syncError: null }
    );

    // Update job
    await SyncJob.findByIdAndUpdate(job._id, {
      status: 'completed',
      completedAt: new Date(),
      itemsProcessed: stats.totalSolved || 0,
      itemsUpdated: stats.totalSolved || 0,
    });

    return {
      platform: platformName,
      success: true,
      stats: {
        totalSolved: stats.totalSolved || 0,
        easySolved: stats.easySolved || 0,
        mediumSolved: stats.mediumSolved || 0,
        hardSolved: stats.hardSolved || 0,
        rating: stats.rating ?? undefined,
        rank: stats.rank ?? undefined,
        totalContests: stats.totalContests ?? undefined,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update sync status with error
    await ConnectedPlatform.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      { syncStatus: 'error', syncError: errorMessage }
    );

    // Update job with error
    await SyncJob.findByIdAndUpdate(job._id, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage,
    });

    return {
      platform: platformName,
      success: false,
      error: errorMessage,
    };
  }
}

interface PlatformStatsInsert {
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  rating?: number | null;
  rank?: string | null;
  totalContests?: number;
  rawData?: Record<string, unknown>;
}

function getMinimalStats(username: string): PlatformStatsInsert {
  return {
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    rating: null,
    rank: null,
    totalContests: 0,
    rawData: { username },
  };
}

/**
 * Fetch stats from Codeforces API
 * - user.info: rating, maxRating, rank, maxRank, etc.
 * - user.rating: contest history (totalContests = length)
 * - user.status: submissions to count unique solved problems
 */
async function syncCodeforces(handle: string): Promise<PlatformStatsInsert> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

  try {
    // 1. Fetch user info
    const userInfoUrl = `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`;
    const userInfoRes = await fetch(userInfoUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!userInfoRes.ok) {
      throw new Error(`Codeforces user.info API returned ${userInfoRes.status}`);
    }

    const userInfoData = await userInfoRes.json() as { status: string; result?: CodeforcesUserInfo[] };
    if (userInfoData.status !== 'OK' || !userInfoData.result || userInfoData.result.length === 0) {
      throw new Error('User not found or invalid handle');
    }

    const userInfo = userInfoData.result[0];

    // 2. Fetch user rating history (for totalContests)
    const ratingUrl = `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`;
    const ratingRes = await fetch(ratingUrl, { signal: new AbortController().signal });
    let totalContests = 0;
    let ratingHistory: CodeforcesRatingChange[] = [];

    if (ratingRes.ok) {
      const ratingData = await ratingRes.json() as { status: string; result?: CodeforcesRatingChange[] };
      if (ratingData.status === 'OK' && ratingData.result) {
        totalContests = ratingData.result.length;
        ratingHistory = ratingData.result;
      }
    }

    // 3. Fetch user submissions to count unique solved problems
    const uniqueSolved = await fetchUniqueSolvedProblems(handle);

    const rawData: Record<string, unknown> = {
      handle: userInfo.handle,
      maxRating: userInfo.maxRating ?? null,
      maxRank: userInfo.maxRank ?? null,
      contribution: userInfo.contribution ?? null,
      friendOfCount: userInfo.friendOfCount ?? null,
      avatar: userInfo.avatar ?? null,
      organization: userInfo.organization ?? null,
      registrationTimeSeconds: userInfo.registrationTimeSeconds ?? null,
      ratingHistory: ratingHistory.slice(-10), // Keep last 10 rating changes
    };

    return {
      totalSolved: uniqueSolved,
      easySolved: 0, // Codeforces doesn't provide difficulty breakdown
      mediumSolved: 0,
      hardSolved: 0,
      rating: userInfo.rating ?? null,
      rank: userInfo.rank ?? null,
      totalContests,
      rawData,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Codeforces API request timed out');
    }
    throw error;
  }
}

/**
 * Fetch unique solved problems from Codeforces user.status API
 * Pages through results in chunks of 5000 until no more submissions
 */
async function fetchUniqueSolvedProblems(handle: string): Promise<number> {
  const solvedProblems = new Set<string>();
  let from = 1;
  const count = 5000;

  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

    const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Stop on error but don't fail the entire sync
      logger.warn(`Codeforces user.status API returned ${res.status} at from=${from}`);
      break;
    }

    const data = await res.json() as { status: string; result?: CodeforcesSubmission[] };
    if (data.status !== 'OK' || !data.result || data.result.length === 0) {
      break;
    }

    // Count unique solved problems (verdict === "OK")
    for (const submission of data.result) {
      if (submission.verdict === 'OK' && submission.problem) {
        const key = `${submission.problem.contestId ?? 'na'}-${submission.problem.index ?? submission.problem.name ?? 'na'}`;
        solvedProblems.add(key);
      }
    }

    // If we got fewer results than requested, we've reached the end
    if (data.result.length < count) {
      break;
    }

    from += count;
  }

  return solvedProblems.size;
}

/**
 * Fetch stats from LeetCode using the community API
 * Uses the same API as the frontend (alfa-leetcode-api)
 */
async function syncLeetCode(username: string): Promise<PlatformStatsInsert> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

  try {
    // Use the community API endpoint
    const url = `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`LeetCode API returned ${res.status}`);
    }

    const data = await res.json() as {
      solvedProblem?: number;
      easySolved?: number;
      mediumSolved?: number;
      hardSolved?: number;
      ranking?: number;
      reputation?: number;
      submissionCalendar?: string;
    };

    const rawData: Record<string, unknown> = {
      username,
    };

    return {
      totalSolved: data.solvedProblem ?? 0,
      easySolved: data.easySolved ?? 0,
      mediumSolved: data.mediumSolved ?? 0,
      hardSolved: data.hardSolved ?? 0,
      rating: data.reputation ?? null,
      rank: data.ranking ? `#${data.ranking}` : null,
      totalContests: 0, // Would need separate API call for contest stats
      rawData,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LeetCode API request timed out');
    }
    throw error;
  }
}