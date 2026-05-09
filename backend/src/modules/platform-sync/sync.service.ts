// src/modules/platform-sync/sync.service.ts
import { Types } from 'mongoose';
import { ConnectedPlatform, PlatformStats, SyncJob, DsaSubmission, DsaContest, DsaTopicProgress, DsaProblem, DailyActivity } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import { createActivity } from '../activity/activity.service.js';

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

async function fetchHackerRankRealStats(username: string): Promise<FetchedPlatformStats> {
  // Unofficial REST API for badges
  const res = await fetchWithTimeout(
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`
  );

  if (!res.ok) {
    if (res.status === 404) throw new Error('HackerRank user not found');
    throw new Error(`HackerRank API error (${res.status})`);
  }

  const json = await res.json() as { model: Array<{ badge_name: string; stars: number; solved: number }> };
  
  // HackerRank solved count is distributed across badges
  let totalSolved = 0;
  if (json.model && Array.isArray(json.model)) {
    for (const badge of json.model) {
      totalSolved += badge.solved || 0;
    }
  }

  return {
    username,
    totalSolved,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    rating: null,
    rank: null,
    totalContests: 0,
    rawData: json as unknown as Record<string, unknown>,
  };
}

async function fetchGithubRealStats(username: string): Promise<FetchedPlatformStats> {
  const res = await fetchWithTimeout(`https://api.github.com/users/${encodeURIComponent(username)}`);
  
  if (!res.ok) {
    if (res.status === 404) throw new Error('GitHub user not found');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded');
    throw new Error(`GitHub API error (${res.status})`);
  }

  const data = await res.json() as Record<string, unknown>;

  const publicRepos = (data.public_repos as number) ?? 0;
  const followers = (data.followers as number) ?? 0;
  const following = (data.following as number) ?? 0;
  
  return {
    username,
    totalSolved: publicRepos, // Map repos as the primary metric for GitHub
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    rating: null,
    rank: null,
    totalContests: 0,
    rawData: {
      public_repos: publicRepos,
      followers,
      following,
      name: data.name ?? null,
      bio: data.bio ?? null,
      avatar_url: data.avatar_url ?? null,
      html_url: data.html_url ?? null,
      created_at: data.created_at ?? null,
    },
  };
}

async function fetchRealStats(platformName: string, username: string): Promise<FetchedPlatformStats> {
  switch (platformName) {
    case 'leetcode': return fetchLeetCodeRealStats(username);
    case 'codeforces': return fetchCodeforcesRealStats(username);
    case 'codechef': return fetchCodeChefRealStats(username);
    case 'hackerrank': return fetchHackerRankRealStats(username);
    case 'github': return fetchGithubRealStats(username);
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
  // Log sync activity event
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  try {
    await createActivity(userId, {
      type: 'streak_milestone',
      title: 'Platform Sync',
      description: failed.length === 0
        ? `Synced ${succeeded.length} platform(s) successfully`
        : `Synced ${succeeded.length}/${results.length} platform(s). Failed: ${failed.map((f) => f.platform).join(', ')}`,
      platform: 'devtrack',
      url: null,
      tags: ['sync'],
      metadata: {
        platformsSynced: results.length,
        successCount: succeeded.length,
        failedCount: failed.length,
      },
    });
  } catch (err) {
    logger.warn('Failed to log sync activity event', { error: err instanceof Error ? err.message : String(err) });
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

    // TASK 2: Run DSA ingestion pipeline for non-GitHub platforms
    if (platformName !== 'github') {
      try {
        await ingestDsaData(userId, platformName, platform.username, fetched);
      } catch (ingestionErr) {
        logger.warn(`DSA ingestion failed for ${platformName} (non-fatal)`, {
          error: ingestionErr instanceof Error ? ingestionErr.message : String(ingestionErr),
        });
      }
    }

    // Generate GitHub sync completed activity
    if (platformName === 'github') {
      try {
        const raw = fetched.rawData as Record<string, unknown>;
        await createActivity(userId, {
          type: 'github_sync_completed',
          title: 'GitHub Profile Synced',
          description: `Synced ${raw.public_repos ?? 0} repos, ${raw.followers ?? 0} followers, ${raw.following ?? 0} following`,
          platform: 'github',
          url: (raw.html_url as string) ?? null,
          tags: ['sync', 'github'],
          metadata: {
            public_repos: Number(raw.public_repos ?? 0),
            followers: Number(raw.followers ?? 0),
            following: Number(raw.following ?? 0),
          },
        });
      } catch (err) {
        logger.warn('Failed to create GitHub sync activity (non-fatal)', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

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

// ---------------------------------------------------------------------------
// SYNC STATUS — read-only (no external API calls)
// ---------------------------------------------------------------------------

export interface SyncStatusItem {
  platformName: string;
  username: string;
  isConnected: boolean;
  syncStatus: string;
  syncError: string | null;
  lastSyncedAt: string | null;
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    rating: number | null;
    rank: string | null;
    totalContests: number;
  } | null;
}

export async function getSyncStatus(userId: string): Promise<SyncStatusItem[]> {
  const platforms = await ConnectedPlatform.find({
    userId: new Types.ObjectId(userId),
  });

  const results: SyncStatusItem[] = [];

  for (const platform of platforms) {
    const stats = await PlatformStats.findOne({
      userId: new Types.ObjectId(userId),
      platformName: platform.platformName,
    });

    results.push({
      platformName: platform.platformName,
      username: platform.username,
      isConnected: platform.isConnected,
      syncStatus: platform.syncStatus,
      syncError: platform.syncError,
      lastSyncedAt: platform.lastSyncedAt?.toISOString() ?? null,
      stats: stats
        ? {
            totalSolved: stats.totalSolved,
            easySolved: stats.easySolved,
            mediumSolved: stats.mediumSolved,
            hardSolved: stats.hardSolved,
            rating: stats.rating,
            rank: stats.rank,
            totalContests: stats.totalContests,
          }
        : null,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// TASK 2: DSA INGESTION PIPELINE
// ---------------------------------------------------------------------------
// platform sync → fetch submissions → persist DsaSubmission → persist DsaContest
// → update topic analytics → create activity events → dashboard aggregation
// ---------------------------------------------------------------------------

/**
 * Orchestrates DSA data ingestion after platform stats are synced.
 * Only runs for DSA platforms (non-GitHub). Non-fatal — errors are logged.
 */
async function ingestDsaData(
  userId: string,
  platformName: string,
  username: string,
  fetched: FetchedPlatformStats
): Promise<void> {
  // STEP 2.2+2.3 — Submission + Contest ingestion based on platform
  switch (platformName) {
    case 'codeforces':
      await ingestCodeforcesSubmissions(userId, username);
      await ingestCodeforcesContests(userId, fetched);
      break;
    case 'leetcode':
      await ingestLeetCodeSubmissions(userId, username);
      await ingestLeetCodeContests(userId, fetched);
      break;
    case 'codechef':
      await ingestCodeChefSubmissions(userId, username);
      break;
    case 'hackerrank':
      await ingestHackerRankSubmissions(userId, username);
      break;
  }

  // STEP 2.4 — Update topic analytics from platform stats
  await updatePlatformTopicAnalytics(userId, platformName, fetched);

  // STEP 2.5 — Generate activity events for milestones
  await generateSyncActivityEvents(userId, platformName, fetched);

  logger.info(`DSA ingestion completed for ${platformName}`, { userId, totalSolved: fetched.totalSolved });
}

/**
 * STEP 2.2: Ingest recent Codeforces submissions into DsaSubmission.
 * Deduplication by userId + platform + submittedAt timestamp.
 */
async function ingestCodeforcesSubmissions(userId: string, handle: string): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  try {
    const res = await fetchWithTimeout(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=100`
    );
    if (!res.ok) return 0;

    const data = await res.json() as { status: string; result?: CodeforcesSubmissionBackend[] };
    if (data.status !== 'OK' || !data.result) return 0;

    for (const sub of data.result) {
      if (!sub.problem || !sub.verdict) continue;

      const submittedAt = sub.creationTimeSeconds
        ? new Date(sub.creationTimeSeconds * 1000)
        : new Date();

      // Deduplication check
      const exists = await DsaSubmission.findOne({
        userId: userObjId,
        platform: 'codeforces',
        submittedAt,
      }).lean();
      if (exists) continue;

      // Find or create DsaProblem
      const problemKey = `${sub.problem.contestId ?? 'na'}-${sub.problem.index ?? 'na'}`;
      let problem = await DsaProblem.findOne({
        userId: userObjId,
        externalId: problemKey,
        platform: 'codeforces',
      });

      if (!problem) {
        problem = await DsaProblem.create({
          userId: userObjId,
          externalId: problemKey,
          title: sub.problem.name ?? 'Unknown',
          platform: 'codeforces',
          difficulty: 'medium',
          url: sub.problem.contestId
            ? `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`
            : 'https://codeforces.com',
          tags: [],
          category: 'Competitive',
          status: sub.verdict === 'OK' ? 'solved' : 'attempted',
          submissionCount: 1,
          isFavorite: false,
        });
      }

      const status: 'accepted' | 'wrong' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error' =
        sub.verdict === 'OK' ? 'accepted'
          : sub.verdict === 'TIME_LIMIT_EXCEEDED' ? 'time_limit_exceeded'
          : sub.verdict === 'RUNTIME_ERROR' ? 'runtime_error'
          : sub.verdict === 'COMPILATION_ERROR' ? 'compilation_error'
          : 'wrong';

      await DsaSubmission.create({
        userId: userObjId,
        problemId: problem._id,
        platform: 'codeforces',
        status,
        language: sub.language ?? 'unknown',
        codeSnippet: null,
        submittedAt,
        executionTime: null,
        memoryUsed: null,
      });

      ingested++;

      if (sub.verdict === 'OK' && problem.status !== 'solved') {
        await DsaProblem.findByIdAndUpdate(problem._id, {
          status: 'solved',
          solvedAt: submittedAt,
          lastSubmittedAt: submittedAt,
          $inc: { submissionCount: 1 },
        });
      }
    }
  } catch (err) {
    logger.warn('Codeforces submission ingestion error (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} Codeforces submissions`, { userId });
  }
  return ingested;
}

/**
 * STEP 2.3: Ingest Codeforces contests from rating history.
 * Deduplication by userId + platform + contestName.
 */
async function ingestCodeforcesContests(userId: string, fetched: FetchedPlatformStats): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  const ratingHistory = (fetched.rawData?.ratingHistory ?? []) as CodeforcesRatingChange[];

  for (const contest of ratingHistory) {
    const participatedAt = new Date(contest.ratingUpdateTimeSeconds * 1000);

    const exists = await DsaContest.findOne({
      userId: userObjId,
      platform: 'codeforces',
      contestName: contest.contestName,
    }).lean();
    if (exists) continue;

    await DsaContest.create({
      userId: userObjId,
      platform: 'codeforces',
      contestName: contest.contestName,
      rank: contest.rank,
      totalParticipants: null,
      problemsSolved: 0,
      ratingBefore: contest.oldRating,
      ratingAfter: contest.newRating,
      ratingChange: contest.newRating - contest.oldRating,
      participatedAt,
    });
    ingested++;
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} Codeforces contests`, { userId });
  }
  return ingested;
}

// ---------------------------------------------------------------------------
// LEETCODE INGESTION
// ---------------------------------------------------------------------------

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  status: string;
  lang: string;
}

interface LeetCodeContest {
  title: string;
  startTime: number;
  participantCount: number;
}

async function ingestLeetCodeSubmissions(userId: string, username: string): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  try {
    const res = await fetchWithTimeout(
      `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/submissions?limit=100`
    );
    if (!res.ok) return 0;

    const data = await res.json() as { submissions?: LeetCodeSubmission[] };
    if (!data.submissions || !Array.isArray(data.submissions)) return 0;

    for (const sub of data.submissions) {
      if (!sub.title || !sub.timestamp) continue;

      const submittedAt = new Date(parseInt(sub.timestamp) * 1000);
      if (isNaN(submittedAt.getTime())) continue;

      // Deduplication by userId + platform + externalId
      const exists = await DsaSubmission.findOne({
        userId: userObjId,
        platform: 'leetcode',
        problemId: { $exists: true }, // Will be linked after problem creation
      }).lean();
      // Use externalId-based deduplication for LeetCode
      const problemKey = sub.titleSlug;
      const existingProblem = await DsaProblem.findOne({
        userId: userObjId,
        externalId: problemKey,
        platform: 'leetcode',
      });
      if (existingProblem) {
        const existingSub = await DsaSubmission.findOne({
          userId: userObjId,
          platform: 'leetcode',
          problemId: existingProblem._id,
          submittedAt,
        }).lean();
        if (existingSub) continue;
      }

      // Determine difficulty from status (LeetCode API doesn't provide difficulty directly)
      const difficulty = 'medium'; // Default, would need separate API call

      let problem = existingProblem;
      if (!problem) {
        problem = await DsaProblem.create({
          userId: userObjId,
          externalId: problemKey,
          title: sub.title,
          platform: 'leetcode',
          difficulty,
          url: `https://leetcode.com/problems/${sub.titleSlug}`,
          tags: [],
          category: 'Data Structures & Algorithms',
          status: sub.status === 'AC' ? 'solved' : 'attempted',
          submissionCount: 1,
          isFavorite: false,
        });
      }

      const status: 'accepted' | 'wrong' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error' =
        sub.status === 'AC' ? 'accepted' : sub.status === 'TLE' ? 'time_limit_exceeded'
          : sub.status === 'MLE' ? 'runtime_error'
          : sub.status === 'CE' ? 'compilation_error'
          : 'wrong';

      await DsaSubmission.create({
        userId: userObjId,
        problemId: problem._id,
        platform: 'leetcode',
        status,
        language: sub.lang ?? 'unknown',
        codeSnippet: null,
        submittedAt,
        executionTime: null,
        memoryUsed: null,
      });

      ingested++;

      if (sub.status === 'AC' && problem.status !== 'solved') {
        await DsaProblem.findByIdAndUpdate(problem._id, {
          status: 'solved',
          solvedAt: submittedAt,
          lastSubmittedAt: submittedAt,
          $inc: { submissionCount: 1 },
        });
      }
    }
  } catch (err) {
    logger.warn('LeetCode submission ingestion error (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} LeetCode submissions`, { userId });
  }
  return ingested;
}

async function ingestLeetCodeContests(userId: string, fetched: FetchedPlatformStats): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  try {
    const username = fetched.username;
    const res = await fetchWithTimeout(
      `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/contest`
    );
    if (!res.ok) return 0;

    const data = await res.json() as Record<string, unknown>;
    const contestHistory = (data.contestHistory ?? []) as LeetCodeContest[];

    for (const contest of contestHistory) {
      if (!contest.title) continue;

      const participatedAt = new Date(contest.startTime * 1000);

      const exists = await DsaContest.findOne({
        userId: userObjId,
        platform: 'leetcode',
        contestName: contest.title,
      }).lean();
      if (exists) continue;

      await DsaContest.create({
        userId: userObjId,
        platform: 'leetcode',
        contestName: contest.title,
        rank: null,
        totalParticipants: contest.participantCount ?? null,
        problemsSolved: 0,
        ratingBefore: null,
        ratingAfter: null,
        ratingChange: null,
        participatedAt,
      });
      ingested++;
    }
  } catch (err) {
    logger.warn('LeetCode contest ingestion error (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} LeetCode contests`, { userId });
  }
  return ingested;
}

// ---------------------------------------------------------------------------
// CODECHEF INGESTION
// ---------------------------------------------------------------------------

async function ingestCodeChefSubmissions(userId: string, username: string): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  try {
    const res = await fetchWithTimeout(
      `https://codechef-api.vercel.app/submissions/${encodeURIComponent(username)}?limit=100`
    );
    if (!res.ok) return 0;

    const data = await res.json() as Record<string, unknown>;
    const submissions = (data.submissions ?? []) as Array<{
      code: string;
      problem_code: string;
      language: string;
      date: string;
      status: string;
    }>;

    for (const sub of submissions) {
      if (!sub.problem_code || !sub.date) continue;

      const submittedAt = new Date(sub.date);
      if (isNaN(submittedAt.getTime())) continue;

      const problemKey = sub.problem_code;
      let problem = await DsaProblem.findOne({
        userId: userObjId,
        externalId: problemKey,
        platform: 'codechef',
      });

      if (!problem) {
        problem = await DsaProblem.create({
          userId: userObjId,
          externalId: problemKey,
          title: sub.problem_code,
          platform: 'codechef',
          difficulty: 'medium',
          url: `https://www.codechef.com/problems/${sub.problem_code}`,
          tags: [],
          category: 'Competitive',
          status: sub.status === 'accepted' ? 'solved' : 'attempted',
          submissionCount: 1,
          isFavorite: false,
        });
      }

      // Check for duplicate
      const existingSub = await DsaSubmission.findOne({
        userId: userObjId,
        platform: 'codechef',
        problemId: problem._id,
        submittedAt,
      }).lean();
      if (existingSub) continue;

      const status: 'accepted' | 'wrong' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error' =
        sub.status === 'accepted' ? 'accepted' : sub.status === 'time limit exceeded' ? 'time_limit_exceeded'
          : sub.status === 'runtime error' ? 'runtime_error'
          : sub.status === 'compilation error' ? 'compilation_error'
          : 'wrong';

      await DsaSubmission.create({
        userId: userObjId,
        problemId: problem._id,
        platform: 'codechef',
        status,
        language: sub.language ?? 'unknown',
        codeSnippet: null,
        submittedAt,
        executionTime: null,
        memoryUsed: null,
      });

      ingested++;

      if (sub.status === 'accepted' && problem.status !== 'solved') {
        await DsaProblem.findByIdAndUpdate(problem._id, {
          status: 'solved',
          solvedAt: submittedAt,
          lastSubmittedAt: submittedAt,
          $inc: { submissionCount: 1 },
        });
      }
    }
  } catch (err) {
    logger.warn('CodeChef submission ingestion error (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} CodeChef submissions`, { userId });
  }
  return ingested;
}

// ---------------------------------------------------------------------------
// HACKERRANK INGESTION
// ---------------------------------------------------------------------------

interface HackerRankSubmission {
  name: string;
  status: string;
  time: string;
  language: string;
}

async function ingestHackerRankSubmissions(userId: string, username: string): Promise<number> {
  const userObjId = new Types.ObjectId(userId);
  let ingested = 0;

  try {
    const res = await fetchWithTimeout(
      `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/submissions?limit=100`
    );
    if (!res.ok) return 0;

    const data = await res.json() as { models?: HackerRankSubmission[] };
    if (!data.models || !Array.isArray(data.models)) return 0;

    for (const sub of data.models) {
      if (!sub.name || !sub.time) continue;

      const submittedAt = new Date(sub.time);
      if (isNaN(submittedAt.getTime())) continue;

      const problemKey = sub.name.replace(/\s+/g, '-').toLowerCase();
      let problem = await DsaProblem.findOne({
        userId: userObjId,
        externalId: problemKey,
        platform: 'hackerrank',
      });

      if (!problem) {
        problem = await DsaProblem.create({
          userId: userObjId,
          externalId: problemKey,
          title: sub.name,
          platform: 'hackerrank',
          difficulty: 'medium',
          url: `https://www.hackerrank.com/challenges/${sub.name.replace(/\s+/g, '-').toLowerCase()}`,
          tags: [],
          category: 'Practice',
          status: sub.status === 'Accepted' ? 'solved' : 'attempted',
          submissionCount: 1,
          isFavorite: false,
        });
      }

      // Check for duplicate
      const existingSub = await DsaSubmission.findOne({
        userId: userObjId,
        platform: 'hackerrank',
        problemId: problem._id,
        submittedAt,
      }).lean();
      if (existingSub) continue;

      const status: 'accepted' | 'wrong' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error' =
        sub.status === 'Accepted' ? 'accepted'
          : sub.status === 'Wrong Answer' ? 'wrong'
          : sub.status === 'Time Limit Exceeded' ? 'time_limit_exceeded'
          : sub.status === 'Runtime Error' ? 'runtime_error'
          : sub.status === 'Compilation Error' ? 'compilation_error'
          : 'wrong';

      await DsaSubmission.create({
        userId: userObjId,
        problemId: problem._id,
        platform: 'hackerrank',
        status,
        language: sub.language ?? 'unknown',
        codeSnippet: null,
        submittedAt,
        executionTime: null,
        memoryUsed: null,
      });

      ingested++;

      if (sub.status === 'Accepted' && problem.status !== 'solved') {
        await DsaProblem.findByIdAndUpdate(problem._id, {
          status: 'solved',
          solvedAt: submittedAt,
          lastSubmittedAt: submittedAt,
          $inc: { submissionCount: 1 },
        });
      }
    }
  } catch (err) {
    logger.warn('HackerRank submission ingestion error (non-fatal)', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (ingested > 0) {
    logger.info(`Ingested ${ingested} HackerRank submissions`, { userId });
  }
  return ingested;
}

/**
 * STEP 2.4: Update DsaTopicProgress from platform sync data.
 * Incremental upsert per platform topic.
 */
async function updatePlatformTopicAnalytics(
  userId: string,
  platformName: string,
  fetched: FetchedPlatformStats
): Promise<void> {
  const userObjId = new Types.ObjectId(userId);

  const topicName = platformName === 'codeforces' ? 'Competitive Programming'
    : platformName === 'leetcode' ? 'LeetCode Problems'
    : platformName === 'codechef' ? 'CodeChef Problems'
    : platformName === 'hackerrank' ? 'HackerRank Challenges'
    : 'General';

  await DsaTopicProgress.findOneAndUpdate(
    { userId: userObjId, topicName },
    {
      $set: {
        totalProblems: fetched.totalSolved,
        solvedCount: fetched.totalSolved,
        easyCount: fetched.easySolved,
        easySolved: fetched.easySolved,
        mediumCount: fetched.mediumSolved,
        mediumSolved: fetched.mediumSolved,
        hardCount: fetched.hardSolved,
        hardSolved: fetched.hardSolved,
      },
    },
    { upsert: true, new: true }
  );
}

/**
 * STEP 2.5: Generate activity events for milestones and recent contests.
 */
async function generateSyncActivityEvents(
  userId: string,
  platformName: string,
  fetched: FetchedPlatformStats
): Promise<void> {
  const { ActivityEvent } = await import('../../db/models/index.js');

  // Milestone achievements (every 50/100/200/... solved)
  const milestones = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
  for (const milestone of milestones) {
    if (fetched.totalSolved >= milestone) {
      const existing = await ActivityEvent.findOne({
        userId: new Types.ObjectId(userId),
        type: 'streak_milestone',
        'metadata.milestone': milestone,
        'metadata.platform': platformName,
      }).lean();

      if (!existing) {
        try {
          await createActivity(userId, {
            type: 'streak_milestone',
            title: `Reached ${milestone} solved problems`,
            description: `Solved ${milestone} problems on ${platformName}!`,
            platform: platformName,
            url: null,
            tags: ['milestone', platformName],
            metadata: { milestone, platform: platformName, totalSolved: fetched.totalSolved },
          });
        } catch { /* non-fatal */ }
      }
    }
  }

  // Recent contest participation activity
  const ratingHistory = (fetched.rawData?.ratingHistory ?? []) as CodeforcesRatingChange[];
  if (ratingHistory.length > 0) {
    const lastContest = ratingHistory[ratingHistory.length - 1];
    const contestDate = new Date(lastContest.ratingUpdateTimeSeconds * 1000);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (contestDate >= sevenDaysAgo) {
      const existing = await ActivityEvent.findOne({
        userId: new Types.ObjectId(userId),
        type: 'contest_participated',
        'metadata.contestName': lastContest.contestName,
      }).lean();

      if (!existing) {
        const ratingChange = lastContest.newRating - lastContest.oldRating;
        try {
          await createActivity(userId, {
            type: 'contest_participated',
            title: `Participated in ${lastContest.contestName}`,
            description: ratingChange >= 0
              ? `Rating increased by ${ratingChange} (${lastContest.oldRating} → ${lastContest.newRating})`
              : `Rating changed by ${ratingChange} (${lastContest.oldRating} → ${lastContest.newRating})`,
            platform: platformName,
            url: `https://codeforces.com/contest/${lastContest.contestId}`,
            tags: ['contest', platformName],
            metadata: { contestName: lastContest.contestName, rank: lastContest.rank, ratingChange, newRating: lastContest.newRating },
          });
        } catch { /* non-fatal */ }
      }
    }
  }
}
