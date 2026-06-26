// src/modules/platform-sync/adapters/codeforces.adapter.ts
// Isolated Codeforces adapter — normalizes REST API responses into canonical shapes.
// Handles paginated submission fetching and unique problem counting.

import { logger } from '../../../shared/logger.js';
import type {
  PlatformAdapter,
  PlatformSubmission,
  PlatformStats,
  PlatformProfile,
  AdapterSyncResult,
} from './types.js';

const FETCH_TIMEOUT = 15_000;
const CF_BASE = 'https://codeforces.com/api';

async function cfFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${CF_BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Codeforces API error (${res.status})`);

    const json = await res.json() as { status: string; result?: T };
    if (json.status !== 'OK' || !json.result) {
      throw new Error('Codeforces returned non-OK status');
    }
    return json.result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class CodeforcesAdapter implements PlatformAdapter {
  readonly platform = 'codeforces' as const;

  async fetchSubmissions(username: string, _since?: Date): Promise<PlatformSubmission[]> {
    const raw = await cfFetch<any[]>(`/user.status?handle=${encodeURIComponent(username)}&from=1&count=100`);

    return raw
      .filter((s: any) => s.verdict === 'OK')
      .map((s: any) => ({
        externalId: String(s.id),
        platform: 'codeforces' as const,
        title: s.problem?.name ?? 'Unknown',
        difficulty: this.mapDifficulty(s.problem?.rating),
        status: 'accepted' as const,
        submittedAt: new Date((s.creationTimeSeconds ?? 0) * 1000),
        language: s.programmingLanguage ?? undefined,
        _raw: s,
      }));
  }

  async fetchStats(username: string): Promise<PlatformStats> {
    const users = await cfFetch<any[]>(`/user.info?handles=${encodeURIComponent(username)}`);
    if (!users[0]) throw new Error('Codeforces user not found');
    const user = users[0];

    // Count unique solved problems via paginated user.status
    const totalSolved = await this.countUniqueSolved(username);

    // Fetch contest count
    let totalContests = 0;
    try {
      const ratings = await cfFetch<any[]>(`/user.rating?handle=${encodeURIComponent(username)}`);
      totalContests = ratings.length;
    } catch (err) {
      logger.debug('[codeforces-adapter] Failed to fetch contest count', { username, error: err instanceof Error ? err.message : String(err) });
    }

    return {
      platform: 'codeforces',
      totalSolved,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      rating: user.rating ?? undefined,
      totalContests,
      fetchedAt: new Date(),
    };
  }

  async fetchProfile(username: string): Promise<PlatformProfile> {
    const users = await cfFetch<any[]>(`/user.info?handles=${encodeURIComponent(username)}`);
    if (!users[0]) throw new Error('Codeforces user not found');
    const user = users[0];

    return {
      platform: 'codeforces',
      username: user.handle,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      avatarUrl: user.titlePhoto || undefined,
      profileUrl: `https://codeforces.com/profile/${username}`,
      fetchedAt: new Date(),
    };
  }

  async sync(username: string, since?: Date): Promise<AdapterSyncResult> {
    const start = Date.now();
    try {
      const [stats, submissions, profile] = await Promise.all([
        this.fetchStats(username),
        this.fetchSubmissions(username, since),
        this.fetchProfile(username),
      ]);

      return {
        success: true,
        submissions,
        stats,
        profile,
        newCount: submissions.length,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      logger.error('[codeforces-adapter] Sync failed', err);
      return {
        success: false,
        submissions: [],
        stats: { platform: 'codeforces', totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, fetchedAt: new Date() },
        newCount: 0,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async countUniqueSolved(handle: string): Promise<number> {
    const solved = new Set<string>();
    let from = 1;
    const count = 5000;

    while (true) {
      try {
        const batch = await cfFetch<any[]>(
          `/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`
        );
        if (!batch || batch.length === 0) break;

        for (const s of batch) {
          if (s.verdict === 'OK' && s.problem) {
            solved.add(`${s.problem.contestId ?? 'na'}-${s.problem.index ?? s.problem.name ?? 'na'}`);
          }
        }

        if (batch.length < count) break;
        from += count;
      } catch (err) {
        logger.debug('[codeforces-adapter] Submissions pagination fetch failed, stopping', { handle, error: err instanceof Error ? err.message : String(err) });
        break;
      }
    }

    return solved.size;
  }

  private mapDifficulty(rating?: number): 'easy' | 'medium' | 'hard' | 'unknown' {
    if (!rating) return 'unknown';
    if (rating <= 1200) return 'easy';
    if (rating <= 1800) return 'medium';
    return 'hard';
  }
}

export const codeforcesAdapter = new CodeforcesAdapter();
