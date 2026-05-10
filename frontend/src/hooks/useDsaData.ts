// ============================================================================
// useDsaData.ts — DSA Data Hook
// ============================================================================
// Derives DSA page data from the dashboard endpoint (GET /api/dashboard)
// AND the detail endpoints (submissions, contests, topics).
// ============================================================================

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useDashboardData } from './useDashboardData';
import { fetchDsaSubmissions, fetchDsaContests, fetchDsaTopics } from '../services/dsaService';
import type { DsaData, Platform, Submission, Contest, Topic } from '../types/dsa';

// ---------------------------------------------------------------------------
// Valid DSA platform names — used to safely narrow ApiPlatformStats.platformName
// ---------------------------------------------------------------------------

const VALID_PLATFORMS: ReadonlySet<string> = new Set<Platform>([
  'leetcode',
  'codeforces',
  'codechef',
  'github',
]);

function isDsaPlatform(name: string): name is Platform {
  return VALID_PLATFORMS.has(name);
}

// ---------------------------------------------------------------------------
// Hook — derives DsaData from dashboard + detail endpoints
// ---------------------------------------------------------------------------

export function useDsaData(): {
  data: DsaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data: dashboard, loading: dashLoading, error: dashError, refetch: dashRefetch } = useDashboardData();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchDetails = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [subsRes, contestsRes, topicsRes] = await Promise.all([
        fetchDsaSubmissions({ pageSize: 100 }),
        fetchDsaContests({ pageSize: 20 }),
        fetchDsaTopics(),
      ]);

      // Map submissions API → local Submission type
      const mappedSubs: Submission[] = subsRes.data.submissions.map((s) => ({
        id: s.id,
        status: s.status === 'accepted' ? 'accepted' : 'wrong',
        problem: s.problemName,
        topic: s.problemCategory ?? 'General',
        platform: (isDsaPlatform(s.platform) ? s.platform : 'leetcode') as Platform,
        language: s.language,
        date: new Date(s.submittedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        difficulty: (s.problemDifficulty as 'easy' | 'medium' | 'hard') ?? undefined,
      }));
      setSubmissions(mappedSubs);

      // Map contests API → local Contest type
      const mappedContests: Contest[] = contestsRes.data.contests.map((c) => ({
        id: c.id,
        contestName: c.contestName,
        platform: c.platform,
        rank: c.rank,
        totalParticipants: c.totalParticipants,
        problemsSolved: c.problemsSolved,
        ratingChange: c.ratingChange,
        participatedAt: c.participatedAt,
      }));
      setContests(mappedContests);

      // Map topics API → local Topic type
      const mappedTopics: Topic[] = topicsRes.data.topics.map((t) => ({
        name: t.topicName,
        progress: t.solveRate,
      }));
      setTopics(mappedTopics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DSA details';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      void fetchDetails();
    }
  }, [fetchDetails]);

  const data = useMemo<DsaData | null>(() => {
    if (!dashboard) return null;

    const platformStats = dashboard.platformStats;
    const dashStats = dashboard.stats;
    const streakData = dashboard.streakData;

    // ── stats: summary items for the DSA page header ──────────────────
    const totalSolved = platformStats.reduce((sum, p) => sum + p.totalSolved, 0);
    const bestRating = platformStats.reduce((best, p) => {
      const r = typeof p.rating === 'number' ? p.rating : 0;
      return r > best ? r : best;
    }, 0);

    const dsaStats: DsaData['stats'] = [
      { label: 'Problems Solved', value: String(totalSolved) },
      { label: 'Current Rating', value: bestRating > 0 ? String(bestRating) : '—' },
      { label: 'Current Streak', value: String(dashStats.currentStreak) },
      { label: 'Max Streak', value: String(dashStats.longestStreak) },
    ];

    // ── heatmap: 365-day activity from streak history ─────────────────
    const heatmap: number[] = streakData.streakHistory.map((d) => d.count);

    // ── platformOverview: per-platform summary cards ──────────────────
    const platformOverview: DsaData['platformOverview'] = platformStats
      .filter((p) => isDsaPlatform(p.platformName))
      .map((p) => ({
        platform: p.platformName as Platform,
        stat: p.totalSolved > 0 ? `${p.totalSolved} solved` : 'No data',
        totalSolved: p.totalSolved,
        easy: p.easySolved,
        medium: p.mediumSolved,
        hard: p.hardSolved,
        rating: typeof p.rating === 'number' ? p.rating : null,
        rank: p.rank,
      }));

    return {
      stats: dsaStats,
      heatmap,
      submissions,
      contests,
      topics,
      platformOverview,
    };
  }, [dashboard, submissions, contests, topics]);

  const refetch = useCallback(() => {
    dashRefetch();
    fetchedRef.current = false;
    void fetchDetails();
  }, [dashRefetch, fetchDetails]);

  return {
    data,
    loading: dashLoading || detailLoading,
    error: dashError || detailError,
    refetch,
  };
}
