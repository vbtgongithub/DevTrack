// ============================================================================
// useDsaData.ts — DSA Data Hook
// ============================================================================
// Derives DSA page data from the DSA dashboard endpoint (GET /api/dsa/dashboard)
// AND the detail endpoints (submissions, contests, topics, platform stats).
// ============================================================================

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { fetchDsaDashboard, fetchDsaSubmissions, fetchDsaContests, fetchDsaTopics } from '../services/dsaService';
import { fetchPlatformStats } from '../services/dashboardService';
import type { DsaData, Platform, Submission, Contest, Topic, DsaStat, PlatformOverviewItem } from '../types/dsa';
import type { ApiPlatformStats } from '../types/api.types';

const VALID_PLATFORMS: ReadonlySet<string> = new Set<Platform>([
  'leetcode',
  'codeforces',
  'codechef',
  'github',
]);

function isDsaPlatform(name: string): name is Platform {
  return VALID_PLATFORMS.has(name);
}

export function useDsaData(): {
  data: DsaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [dsaDashboard, setDsaDashboard] = useState<{
    stats: DsaStat[];
    heatmap: number[];
    platformOverview: PlatformOverviewItem[];
  } | null>(null);
  const [dsaDashLoading, setDsaDashLoading] = useState(true);
  const [dsaDashError, setDsaDashError] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exactPlatformStats, setExactPlatformStats] = useState<ApiPlatformStats[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchDsaDash = useCallback(async () => {
    setDsaDashLoading(true);
    setDsaDashError(null);
    try {
      const res = await fetchDsaDashboard();
      const d = res.data;

      const stats: DsaStat[] = (d.stats ?? []).map((s) => ({
        label: s.label,
        value: s.value,
        icon: s.icon,
      }));

      const heatmap: number[] = d.heatmap ?? [];

      const platformOverview: PlatformOverviewItem[] = (d.platformOverview ?? [])
        .filter((p) => isDsaPlatform(p.platform))
        .map((p) => ({
          platform: p.platform as Platform,
          stat: p.stat,
          totalSolved: p.totalSolved ?? 0,
          rank: p.rank?.toString() || null,
          rating: p.rating || null,
        }));

      setDsaDashboard({ stats, heatmap, platformOverview });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DSA dashboard';
      setDsaDashError(message);
    } finally {
      setDsaDashLoading(false);
    }
  }, []);

  const fetchDetails = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const [subsRes, contestsRes, topicsRes, platformStatsRes] = await Promise.all([
        fetchDsaSubmissions({ pageSize: 100 }),
        fetchDsaContests({ pageSize: 20 }),
        fetchDsaTopics(),
        fetchPlatformStats(),
      ]);

      const mappedSubs: Submission[] = subsRes.data.submissions
        .filter((s) => isDsaPlatform(s.platform))
        .map((s) => ({
          id: s.id,
          status: s.status === 'accepted' ? 'accepted' : 'wrong',
          problem: s.problemName,
          topic: s.problemCategory ?? 'General',
          platform: s.platform as Platform,
          language: s.language,
          date: new Date(s.submittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          }),
          difficulty: (s.problemDifficulty as 'easy' | 'medium' | 'hard') ?? undefined,
        }));
      setSubmissions(mappedSubs);

      const mappedContests: Contest[] = contestsRes.data.contests
        .filter((c) => isDsaPlatform(c.platform))
        .map((c) => ({
          id: c.id,
          contestName: c.contestName,
          platform: c.platform as Platform,
          rank: c.rank,
          totalParticipants: c.totalParticipants,
          problemsSolved: c.problemsSolved,
          ratingChange: c.ratingChange,
          participatedAt: c.participatedAt,
        }));
      setContests(mappedContests);

      const mappedTopics: Topic[] = topicsRes.data.topics
        .map((t) => ({
          name: t.topicName,
          progress: t.solveRate,
        }));
      setTopics(mappedTopics);
      setExactPlatformStats(platformStatsRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DSA details';
      setDetailError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDsaDash();
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      void fetchDetails();
    }
  }, [fetchDsaDash, fetchDetails]);

  const data = useMemo<DsaData | null>(() => {
    if (!dsaDashboard) return null;

    // Create a map of exact stats from the dashboard/platforms endpoint
    const statsMap = new Map(exactPlatformStats.map(s => [s.platformName, s]));

    // Derived fallback logic: Priority 1: Exact Stats API, Priority 2: Submissions Stream, Priority 3: Dashboard Payload
    const solveCountsFromSubs = submissions.reduce((acc, sub) => {
      if (sub.status === 'accepted') {
        acc[sub.platform] = (acc[sub.platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      stats: dsaDashboard.stats,
      heatmap: dsaDashboard.heatmap,
      submissions,
      contests,
      topics,
      platformOverview: dsaDashboard.platformOverview.map(p => {
        const exact = statsMap.get(p.platform);
        return {
          ...p,
          totalSolved: exact ? exact.totalSolved : (solveCountsFromSubs[p.platform] || p.totalSolved || 0),
          rank: exact?.rank?.toString() || p.rank,
          rating: exact?.rating || p.rating
        };
      }),
    };
  }, [dsaDashboard, submissions, contests, topics, exactPlatformStats]);

  const refetch = useCallback(() => {
    void fetchDsaDash();
    fetchedRef.current = false;
    void fetchDetails();
  }, [fetchDsaDash, fetchDetails]);

  return {
    data,
    loading: dsaDashLoading || detailLoading,
    error: dsaDashError || detailError,
    refetch,
  };
}
