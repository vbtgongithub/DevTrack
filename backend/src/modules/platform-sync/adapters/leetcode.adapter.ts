// src/modules/platform-sync/adapters/leetcode.adapter.ts
// Isolated LeetCode adapter — normalizes GraphQL responses into canonical shapes.
// All LeetCode-specific parsing lives here; sync.service.ts never touches raw LC data.

import { fetchWithTimeout } from '../../../shared/fetchWithTimeout.js';
import { BasePlatformAdapter } from './BasePlatformAdapter.js';
import type {
  PlatformSubmission,
  PlatformStats,
  PlatformProfile,
} from './types.js';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const LC_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function gql(query: string, variables: Record<string, unknown>): Promise<any> {
  const res = await fetchWithTimeout(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: LC_HEADERS,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL error: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      submissionCalendar
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query recentSubmissions($username: String!, $limit: Int!) {
    recentSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
      runtime
      memory
    }
  }
`;

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class LeetCodeAdapter extends BasePlatformAdapter {
  readonly platform = 'leetcode' as const;

  async fetchSubmissions(username: string, _since?: Date): Promise<PlatformSubmission[]> {
    const response = await gql(RECENT_SUBMISSIONS_QUERY, { username, limit: 50 });
    const raw = response?.data?.recentSubmissionList ?? [];

    return raw.map((s: any) => ({
      externalId: s.titleSlug ?? s.title,
      platform: 'leetcode' as const,
      title: s.title ?? 'Unknown',
      difficulty: 'unknown' as const, // individual submissions don't carry difficulty
      status: s.statusDisplay === 'Accepted' ? 'accepted' as const : 'other' as const,
      submittedAt: new Date(parseInt(s.timestamp, 10) * 1000),
      language: s.lang ?? undefined,
      _raw: s,
    }));
  }

  async fetchStats(username: string): Promise<PlatformStats> {
    const response = await gql(PROFILE_QUERY, { username });
    const data = response?.data;

    if (!data?.matchedUser) {
      throw new Error(`LeetCode user "${username}" not found`);
    }

    const acStats = data.matchedUser.submitStatsGlobal.acSubmissionNum;
    const contest = data.userContestRanking ?? {};

    return {
      platform: 'leetcode',
      totalSolved: acStats.find((s: any) => s.difficulty === 'All')?.count ?? 0,
      easySolved: acStats.find((s: any) => s.difficulty === 'Easy')?.count ?? 0,
      mediumSolved: acStats.find((s: any) => s.difficulty === 'Medium')?.count ?? 0,
      hardSolved: acStats.find((s: any) => s.difficulty === 'Hard')?.count ?? 0,
      rating: contest.rating ? Math.round(contest.rating) : undefined,
      totalContests: contest.attendedContestsCount ?? 0,
      fetchedAt: new Date(),
    };
  }

  async fetchProfile(username: string): Promise<PlatformProfile> {
    const response = await gql(PROFILE_QUERY, { username });
    const user = response?.data?.matchedUser;

    if (!user) throw new Error(`LeetCode user "${username}" not found`);

    return {
      platform: 'leetcode',
      username: user.username,
      displayName: user.profile?.realName || undefined,
      avatarUrl: user.profile?.userAvatar || undefined,
      profileUrl: `https://leetcode.com/u/${username}/`,
      fetchedAt: new Date(),
    };
  }

}

export const leetcodeAdapter = new LeetCodeAdapter();
