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

interface FetchedPlatformStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  rating: number | null;
  rank: string | null;
  totalContests: number;
  rawData: Record<string, unknown>;
}

const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function fetchLeetCodeRealStats(username: string): Promise<FetchedPlatformStats> {
  const [solvedRes, contestRes] = await Promise.allSettled([
    fetchWithTimeout(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`),
    fetchWithTimeout(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/contest`),
  ]);

  if (solvedRes.status === 'rejected') throw new Error(`LeetCode API unreachable: ${solvedRes.reason}`);
  if (!solvedRes.value.ok) {
    const status = solvedRes.value.status;
    if (status === 404) throw new Error('LeetCode user not found');
    throw new Error(`LeetCode API error (${status})`);
  }

  const solved = await solvedRes.value.json() as Record<string, unknown>;

  let contest: Record<string, unknown> = {};
  if (contestRes.status === 'fulfilled' && contestRes.value.ok) {
    try { contest = await contestRes.value.json() as Record<string, unknown>; } catch { /* optional */ }
  }

  return {
    username,
    totalSolved: (solved.solvedProblem as number) ?? 0,
    easySolved: (solved.easySolved as number) ?? 0,
    mediumSolved: (solved.mediumSolved as number) ?? 0,
    hardSolved: (solved.hardSolved as number) ?? 0,
    rating: contest.contestRating ? Math.round(contest.contestRating as number) : null,
    rank: null,
    totalContests: (contest.contestAttend as number) ?? 0,
    rawData: { solved, contest },
  };
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

interface CodeforcesSubmissionBackend {
  id: number;
  contestId?: number;
  problem?: CodeforcesProblem;
  verdict?: string;
  language?: string;
  creationTimeSeconds?: number;
}

async function fetchCodeforcesRealStats(username: string): Promise<FetchedPlatformStats> {
  const res = await fetchWithTimeout(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`
  );

  if (!res.ok) throw new Error(`Codeforces API error (${res.status})`);

  const json = await res.json() as { status: string; result?: unknown[] };
  if (json.status !== 'OK' || !json.result?.[0]) throw new Error('Codeforces user not found');

  const user = json.result[0] as CodeforcesUserInfo;

  // Fetch rating history
  let totalContests = 0;
  let ratingHistory: CodeforcesRatingChange[] = [];
  try {
    const ratingRes = await fetchWithTimeout(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`
    );
    if (ratingRes.ok) {
      const ratingData = await ratingRes.json() as { status: string; result?: CodeforcesRatingChange[] };
      if (ratingData.status === 'OK' && ratingData.result) {
        totalContests = ratingData.result.length;
        ratingHistory = ratingData.result;
      }
    }
  } catch { /* optional */ }

  // Count unique solved problems
  const uniqueSolved = await fetchUniqueSolvedProblems(username);

  const rawData: Record<string, unknown> = {
    handle: user.handle,
    maxRating: user.maxRating ?? null,
    maxRank: user.maxRank ?? null,
    contribution: user.contribution ?? null,
    friendOfCount: user.friendOfCount ?? null,
    avatar: user.avatar ?? null,
    organization: user.organization ?? null,
    registrationTimeSeconds: user.registrationTimeSeconds ?? null,
    ratingHistory: ratingHistory.slice(-10),
  };

  return {
    username,
    totalSolved: uniqueSolved,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    rating: (user.rating as number) ?? null,
    rank: (user.rank as string) ?? null,
    totalContests,
    rawData,
  };
}

async function fetchCodeChefRealStats(username: string): Promise<FetchedPlatformStats> {
  const res = await fetchWithTimeout(
    `https://codechef-api.vercel.app/handle/${encodeURIComponent(username)}`
  );

  if (!res.ok) {
    if (res.status === 404) throw new Error('CodeChef user not found');
    throw new Error(`CodeChef API error (${res.status})`);
  }

  const json = await res.json() as Record<string, unknown>;
  if (json.success === false) throw new Error((json.message as string) ?? 'CodeChef user not found');

  return {
    username,
    totalSolved: (json.totalProblemsSolved as number) ?? 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    rating: (json.currentRating as number) ?? null,
    rank: (json.stars as string) ?? null,
    totalContests: 0,
    rawData: json,
  };
}

async function fetchRealStats(platformName: string, username: string): Promise<FetchedPlatformStats> {
  switch (platformName) {
    case 'leetcode': return fetchLeetCodeRealStats(username);
    case 'codeforces': return fetchCodeforcesRealStats(username);
    case 'codechef': return fetchCodeChefRealStats(username);
    default: throw new Error(`Platform "${platformName}" sync not supported`);
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
      logger.warn(`Codeforces user.status API returned ${res.status} at from=${from}`);
      break;
    }

    const data = await res.json() as { status: string; result?: CodeforcesSubmissionBackend[] };
    if (data.status !== 'OK' || !data.result || data.result.length === 0) {
      break;
    }

    for (const submission of data.result) {
      if (submission.verdict === 'OK' && submission.problem) {
        const key = `${submission.problem.contestId ?? 'na'}-${submission.problem.index ?? submission.problem.name ?? 'na'}`;
        solvedProblems.add(key);
      }
    }

    if (data.result.length < count) {
      break;
    }

    from += count;
  }

  return solvedProblems.size;
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
  const platform = await ConnectedPlatform.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), platformName },
    { syncStatus: 'syncing', syncError: null },
    { new: true }
  );

  if (!platform) {
    return { platform: platformName, success: false, error: 'Platform not connected' };
  }

  const job = await SyncJob.create({
    userId: new Types.ObjectId(userId),
    platformName: platformName as 'leetcode' | 'codeforces' | 'github' | 'hackerrank' | 'codechef',
    status: 'running',
  });

  try {
    const fetched = await fetchRealStats(platformName, platform.username);

    await PlatformStats.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      {
        username: fetched.username,
        totalSolved: fetched.totalSolved,
        easySolved: fetched.easySolved,
        mediumSolved: fetched.mediumSolved,
        hardSolved: fetched.hardSolved,
        rating: fetched.rating,
        rank: fetched.rank,
        totalContests: fetched.totalContests,
        rawData: fetched.rawData,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await ConnectedPlatform.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      { syncStatus: 'success', lastSyncedAt: new Date(), syncError: null }
    );

    await SyncJob.findByIdAndUpdate(job._id, {
      status: 'completed',
      completedAt: new Date(),
      itemsProcessed: fetched.totalSolved,
      itemsUpdated: fetched.totalSolved,
    });

    return {
      platform: platformName,
      success: true,
      stats: {
        totalSolved: fetched.totalSolved,
        easySolved: fetched.easySolved,
        mediumSolved: fetched.mediumSolved,
        hardSolved: fetched.hardSolved,
        rating: fetched.rating ?? undefined,
        rank: fetched.rank ?? undefined,
        totalContests: fetched.totalContests,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await ConnectedPlatform.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), platformName },
      { syncStatus: 'error', syncError: errorMessage }
    );

    await SyncJob.findByIdAndUpdate(job._id, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage,
    });

    return { platform: platformName, success: false, error: errorMessage };
  }
}
