// src/modules/platform-sync/adapters/github.adapter.ts
// Isolated GitHub adapter — normalizes REST API responses into canonical shapes.
// Handles auth token injection, rate-limit awareness, and repo enrichment.

import { logger } from '../../../shared/logger.js';
import { env } from '../../../config/env.js';
import type {
  PlatformAdapter,
  PlatformSubmission,
  PlatformStats,
  PlatformProfile,
  AdapterSyncResult,
} from './types.js';

const FETCH_TIMEOUT = 15_000;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function ghFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: getHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 404) throw new Error('GitHub user not found');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded');
    if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class GitHubAdapter implements PlatformAdapter {
  readonly platform = 'github' as const;

  async fetchSubmissions(username: string, _since?: Date): Promise<PlatformSubmission[]> {
    // GitHub doesn't have "submissions" in the DSA sense.
    // We map recent public events as a rough proxy.
    try {
      const events = await ghFetch<any[]>(`/users/${encodeURIComponent(username)}/events/public?per_page=30`);
      return events
        .filter((e: any) => e.type === 'PushEvent')
        .map((e: any) => ({
          externalId: e.id,
          platform: 'github' as const,
          title: `Push to ${e.repo?.name ?? 'unknown'}`,
          difficulty: 'unknown' as const,
          status: 'accepted' as const,
          submittedAt: new Date(e.created_at),
          _raw: e,
        }));
    } catch (err) {
      logger.warn('[github-adapter] Failed to fetch submissions', { username, error: err instanceof Error ? err.message : String(err) });
      return [];
    }
  }

  async fetchStats(username: string): Promise<PlatformStats> {
    const user = await ghFetch<Record<string, any>>(`/users/${encodeURIComponent(username)}`);
    const publicRepos = user.public_repos ?? 0;

    // Enrichment: aggregate stars and languages from repos
    let totalStars = 0;
    try {
      const repos = await ghFetch<any[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
      for (const r of repos) {
        totalStars += r.stargazers_count ?? 0;
      }
    } catch (err) {
      logger.debug('[github-adapter] Failed to fetch repos for star count', { username, error: err instanceof Error ? err.message : String(err) });
    }

    return {
      platform: 'github',
      totalSolved: publicRepos,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      totalContributions: totalStars,
      fetchedAt: new Date(),
    };
  }

  async fetchProfile(username: string): Promise<PlatformProfile> {
    const user = await ghFetch<Record<string, any>>(`/users/${encodeURIComponent(username)}`);
    return {
      platform: 'github',
      username: user.login,
      displayName: user.name || undefined,
      avatarUrl: user.avatar_url || undefined,
      profileUrl: user.html_url,
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
      logger.error('[github-adapter] Sync failed', err);
      return {
        success: false,
        submissions: [],
        stats: { platform: 'github', totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, fetchedAt: new Date() },
        newCount: 0,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    }
  }
}

export const githubAdapter = new GitHubAdapter();
