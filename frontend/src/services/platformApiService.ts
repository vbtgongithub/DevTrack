// ============================================================================
// platformApiService.ts — CP Platform API Service
// ============================================================================
// Fetches real stats from LeetCode, Codeforces, and CodeChef APIs.
// Uses community-hosted APIs where official ones don't exist.
// ============================================================================

import type {
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
  HackerRankStats,
} from '../types/profile.types';

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';
const CODEFORCES_API = 'https://codeforces.com/api';
const CODECHEF_API = 'https://codechef-api.vercel.app/handle';

const FETCH_TIMEOUT = 15000; // 15s timeout

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// LEETCODE
// ---------------------------------------------------------------------------

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  if (!username.trim()) throw new Error('LeetCode username is required');

  // Fetch solved stats and contest data in parallel
  const [solvedRes, contestRes] = await Promise.allSettled([
    fetchWithTimeout(`${LEETCODE_API}/${encodeURIComponent(username)}/solved`),
    fetchWithTimeout(`${LEETCODE_API}/${encodeURIComponent(username)}/contest`),
  ]);

  // Parse solved data
  let solvedData: any = {};
  if (solvedRes.status === 'fulfilled' && solvedRes.value.ok) {
    solvedData = await solvedRes.value.json();
  } else {
    const status = solvedRes.status === 'fulfilled'
      ? (solvedRes as PromiseFulfilledResult<Response>).value.status
      : 0;
    const reason = solvedRes.status === 'rejected'
      ? solvedRes.reason?.message
      : status === 429
        ? 'API rate limited — please wait a minute and try again'
        : status === 404
          ? 'User not found. Check the username and try again'
          : `API error (status ${status})`;
    throw new Error(reason);
  }

  // Parse contest data (optional — may fail gracefully)
  let contestData: any = {};
  if (contestRes.status === 'fulfilled' && contestRes.value.ok) {
    try {
      contestData = await contestRes.value.json();
    } catch {
      // Contest data is optional
    }
  }

  return {
    solvedProblem: solvedData.solvedProblem ?? 0,
    easySolved: solvedData.easySolved ?? 0,
    mediumSolved: solvedData.mediumSolved ?? 0,
    hardSolved: solvedData.hardSolved ?? 0,
    totalEasy: 850,  // approximate totals — LeetCode doesn't expose actual totals via this API
    totalMedium: 1800,
    totalHard: 800,
    acceptanceRate: solvedData.acceptanceRate ?? 0,
    ranking: solvedData.ranking ?? 0,
    contributionPoints: solvedData.contributionPoints ?? 0,
    reputation: solvedData.reputation ?? 0,
    contestRating: Math.round(contestData.contestRating ?? 0),
    contestGlobalRanking: contestData.contestGlobalRanking ?? 0,
    totalContests: contestData.contestAttend ?? 0,
    contestTopPercentage: contestData.contestTopPercentage ?? 0,
  };
}

// ---------------------------------------------------------------------------
// CODEFORCES
// ---------------------------------------------------------------------------

export async function fetchCodeforcesStats(username: string): Promise<CodeforcesStats> {
  if (!username.trim()) throw new Error('Codeforces handle is required');

  // Fetch user info and contest history in parallel
  const [infoRes, ratingRes] = await Promise.allSettled([
    fetchWithTimeout(
      `${CODEFORCES_API}/user.info?handles=${encodeURIComponent(username)}`
    ),
    fetchWithTimeout(
      `${CODEFORCES_API}/user.rating?handle=${encodeURIComponent(username)}`
    ),
  ]);

  // Parse user info
  if (infoRes.status !== 'fulfilled' || !infoRes.value.ok) {
    const status = infoRes.status === 'fulfilled' ? infoRes.value.status : 0;
    if (status === 400) throw new Error('Codeforces user not found');
    throw new Error(`Codeforces API error: ${status}`);
  }

  const json = await infoRes.value.json();
  if (json.status !== 'OK' || !json.result?.[0]) {
    throw new Error('Invalid Codeforces response');
  }

  const user = json.result[0];

  // Parse contest count from rating history
  let totalContests = 0;
  if (ratingRes.status === 'fulfilled' && ratingRes.value.ok) {
    try {
      const ratingData = await ratingRes.value.json();
      if (ratingData.status === 'OK' && ratingData.result) {
        totalContests = ratingData.result.length;
      }
    } catch {
      // Contest data is optional
    }
  }

  // Fetch unique solved problems count from user.status
  let totalSolved = 0;
  try {
    totalSolved = await fetchCfSolvedCount(username);
  } catch {
    // Solved count is optional — don't fail the entire fetch
  }

  return {
    handle: user.handle ?? username,
    rating: user.rating ?? 0,
    maxRating: user.maxRating ?? 0,
    rank: user.rank ?? 'unrated',
    maxRank: user.maxRank ?? 'unrated',
    avatar: user.avatar ?? '',
    contribution: user.contribution ?? 0,
    friendOfCount: user.friendOfCount ?? 0,
    organization: user.organization ?? '',
    registrationTimeSeconds: user.registrationTimeSeconds ?? 0,
    totalSolved,
    totalContests,
  };
}

/**
 * Count unique solved problems from Codeforces user.status API.
 * Pages through submissions in chunks of 10000.
 */
async function fetchCfSolvedCount(handle: string): Promise<number> {
  const solved = new Set<string>();
  let from = 1;
  const count = 10000;

  while (true) {
    const res = await fetchWithTimeout(
      `${CODEFORCES_API}/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`
    );

    if (!res.ok) break;

    const data = await res.json();
    if (data.status !== 'OK' || !data.result || data.result.length === 0) break;

    for (const sub of data.result) {
      if (sub.verdict === 'OK' && sub.problem) {
        const key = `${sub.problem.contestId ?? 'na'}-${sub.problem.index ?? sub.problem.name ?? 'na'}`;
        solved.add(key);
      }
    }

    if (data.result.length < count) break;
    from += count;
  }

  return solved.size;
}

// ---------------------------------------------------------------------------
// CODECHEF
// ---------------------------------------------------------------------------

export async function fetchCodeChefStats(username: string): Promise<CodeChefStats> {
  if (!username.trim()) throw new Error('CodeChef username is required');

  const res = await fetchWithTimeout(
    `${CODECHEF_API}/${encodeURIComponent(username)}`
  );

  if (!res.ok) {
    if (res.status === 404) throw new Error('CodeChef user not found');
    throw new Error(`CodeChef API error: ${res.status}`);
  }

  const json = await res.json();

  // Handle different response shapes from community APIs
  if (json.success === false) {
    throw new Error(json.message ?? 'CodeChef user not found');
  }

  return {
    name: json.name ?? username,
    currentRating: json.currentRating ?? json.rating ?? 0,
    highestRating: json.highestRating ?? json.maxRating ?? 0,
    stars: json.stars ?? '0★',
    globalRank: json.globalRank ?? 0,
    countryRank: json.countryRank ?? 0,
    countryName: json.countryName ?? json.country ?? '',
    totalProblemsSolved: json.totalProblemsSolved
      ?? (json.fullySolved ? Object.keys(json.fullySolved).length : 0)
      ?? 0,
  };
}

// ---------------------------------------------------------------------------
// HACKERRANK
// ---------------------------------------------------------------------------

export async function fetchHackerRankStats(username: string): Promise<HackerRankStats> {
  if (!username.trim()) throw new Error('HackerRank username is required');

  // HackerRank doesn't have a public API, so we use a community scraper
  // If no community API is available, return basic stats from the profile page
  try {
    const res = await fetchWithTimeout(
      `https://hackerrank-api.vercel.app/api/${encodeURIComponent(username)}`
    );

    if (!res.ok) {
      if (res.status === 404) throw new Error('HackerRank user not found');
      throw new Error(`HackerRank API error: ${res.status}`);
    }

    const json = await res.json();

    return {
      username: json.username ?? username,
      totalSolved: json.totalSolved ?? json.solved ?? 0,
      totalContests: json.totalContests ?? json.contests ?? 0,
      badges: json.badges ?? json.badges_count ?? 0,
      certificates: json.certificates ?? json.certificates_count ?? 0,
      level: json.level ?? '—',
      score: json.score ?? json.total_score ?? 0,
    };
  } catch (error) {
    // If community API fails, return a minimal result with username only
    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('API error'))) {
      throw error;
    }
    // Network/timeout errors - return empty stats so user knows it's connected
    return {
      username,
      totalSolved: 0,
      totalContests: 0,
      badges: 0,
      certificates: 0,
      level: '—',
      score: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// CACHE HELPERS
// ---------------------------------------------------------------------------

const CACHE_KEY = 'devtrack-platform-stats';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CachedStats {
  leetcode: { data: LeetCodeStats; fetchedAt: number } | null;
  codeforces: { data: CodeforcesStats; fetchedAt: number } | null;
  codechef: { data: CodeChefStats; fetchedAt: number } | null;
  hackerrank: { data: HackerRankStats; fetchedAt: number } | null;
}

export function getCachedStats(): CachedStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedStats(stats: Partial<CachedStats>): void {
  try {
    const existing = getCachedStats() ?? { leetcode: null, codeforces: null, codechef: null, hackerrank: null };
    const merged = { ...existing, ...stats };
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage full or unavailable
  }
}

export function isCacheValid(fetchedAt: number | null): boolean {
  if (!fetchedAt) return false;
  return Date.now() - fetchedAt < CACHE_TTL;
}
