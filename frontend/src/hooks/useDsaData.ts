// ============================================================================
// useDsaData.ts — DSA Data Hook (TanStack Query)
// ============================================================================
// Derives DSA page data from the DSA dashboard endpoint (GET /api/dsa/dashboard)
// AND the detail endpoints (submissions, contests, topics, platform stats).
// Uses TanStack Query for caching, polling, and cache invalidation.
// ============================================================================

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDsaDashboard,
  fetchDsaSubmissions,
  fetchDsaContests,
  fetchDsaTopics,
  fetchSchedulerStatus,
} from '../services/dsaService';
import { fetchPlatformStats } from '../services/dashboardService';
import { queryKeys } from '../lib/queryClient';
import axiosClient from '../utils/axiosClient';
import { useSse } from './useSse';
import { useXp } from './useXp';
import type {
  DsaData,
  Platform,
  Submission,
  DsaStat,
  PlatformOverviewItem,
} from '../types/dsa';
import type { ApiPlatformStats } from '../types/api.types';
import type { SchedulerStatus } from '../services/dsaService';

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
// Types mirroring backend API shapes
// ---------------------------------------------------------------------------

interface ApiDashboardStatsItem {
  label: string;
  value: string;
  icon?: string;
}

interface ApiPlatformOverviewItem {
  platform: string;
  stat: string;
  totalSolved?: number;
  rank?: string | number | null;
  rating?: number | null;
}

interface ApiDashboardResponse {
  stats: ApiDashboardStatsItem[];
  heatmap: number[];
  platformOverview: ApiPlatformOverviewItem[];
}

// ---------------------------------------------------------------------------
// Sub-queries — each fetches independently; failures are isolated
// ---------------------------------------------------------------------------

function useDsaDashboard() {
  return useQuery<ApiDashboardResponse>({
    queryKey: queryKeys.dsa.dashboard,
    queryFn: async ({ signal }) => {
      const res = await fetchDsaDashboard({ signal });
      if (!res.success) throw new Error(res.message || 'Failed to load dashboard');
      return res.data;
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

function useDsaSubmissions() {
  return useQuery<Submission[]>({
    queryKey: queryKeys.dsa.submissions({ pageSize: 100 }),
    queryFn: async ({ signal }) => {
      const res = await fetchDsaSubmissions({ pageSize: 100 }, { signal });
      if (!res.success) throw new Error(res.message || 'Failed to load submissions');
      return res.data.submissions
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
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

function useDsaContests() {
  return useQuery({
    queryKey: queryKeys.dsa.contests({ pageSize: 20 }),
    queryFn: async ({ signal }) => {
      const res = await fetchDsaContests({ pageSize: 20 }, { signal });
      if (!res.success) throw new Error(res.message || 'Failed to load contests');
      return res.data.contests
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
    },
    staleTime: 60_000,
    gcTime: 300_000,
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

function useDsaTopics() {
  return useQuery({
    queryKey: queryKeys.dsa.topics,
    queryFn: async ({ signal }) => {
      const res = await fetchDsaTopics({ signal });
      if (!res.success) throw new Error(res.message || 'Failed to load topics');
      return res.data.topics.map((t) => ({
        name: t.topicName,
        progress: t.solveRate,
      }));
    },
    staleTime: 60_000,
    gcTime: 300_000,
    refetchInterval: 300_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

function usePlatformStats() {
  return useQuery<ApiPlatformStats[]>({
    queryKey: queryKeys.dsa.platformStats,
    queryFn: async () => {
      const res = await fetchPlatformStats();
      if (!res.success) throw new Error(res.message || 'Failed to load platform stats');
      return res.data;
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// ---------------------------------------------------------------------------
// Scheduler status — drives sync state / stale-data indicators (polled)
// ---------------------------------------------------------------------------

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes without a successful sync → stale

function useSchedulerStatus() {
  return useQuery<SchedulerStatus>({
    queryKey: queryKeys.dsa.syncStatus,
    queryFn: async ({ signal }) => {
      const res = await fetchSchedulerStatus({ signal });
      if (!res.success) throw new Error(res.message || 'Failed to load scheduler status');
      return res.data;
    },
    // Poll every 20s — lightweight, no DB load on backend
    staleTime: 10_000,
    gcTime: 30_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });
}

function deriveStaleState(schedulerStatus: SchedulerStatus | undefined): boolean {
  if (!schedulerStatus) return false;
  if (schedulerStatus.status === 'running') return false;
  const lastCompleted = schedulerStatus.lastSyncCompletedAt;
  if (!lastCompleted) return true; // Never synced
  const elapsed = Date.now() - new Date(lastCompleted).getTime();
  return elapsed > STALE_THRESHOLD_MS;
}

// ---------------------------------------------------------------------------
// Sync mutation — invalidates all DSA queries on completion
// ---------------------------------------------------------------------------

function useSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platformName?: string) => {
      const url = platformName
        ? `/platforms/sync/${platformName}`
        : '/platforms/sync-all';
      const { data } = await axiosClient.post(url);
      return data;
    },
    onSuccess: () => {
      // Invalidate DSA data AND scheduler status so frontend reflects fresh state
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dsa.syncStatus });
    },
  });
}

// ---------------------------------------------------------------------------
// Main hook — merges sub-queries into unified DsaData shape
// ---------------------------------------------------------------------------

export function useDsaData(): {
  data: DsaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  sync: () => void;
  isSyncing: boolean;
  isDataStale: boolean;
  schedulerStatus: SchedulerStatus | undefined;
  connectionStatus: import('./useSse').ConnectionStatus;
  xp: import('./useXp').XpState;
} {
  const dashboardQ = useDsaDashboard();
  const submissionsQ = useDsaSubmissions();
  const contestsQ = useDsaContests();
  const topicsQ = useDsaTopics();
  const platformStatsQ = usePlatformStats();
  const schedulerStatusQ = useSchedulerStatus();
  const syncMutation = useSyncMutation();
  const sse = useSse();
  const xp = useXp();

  const isLoading =
    dashboardQ.isLoading ||
    submissionsQ.isLoading ||
    contestsQ.isLoading ||
    topicsQ.isLoading ||
    platformStatsQ.isLoading;

  const errorMessage =
    dashboardQ.error?.message ||
    submissionsQ.error?.message ||
    (contestsQ.error instanceof Error ? contestsQ.error.message : null) ||
    (topicsQ.error instanceof Error ? topicsQ.error.message : null) ||
    (platformStatsQ.error instanceof Error ? platformStatsQ.error.message : null) ||
    null;

  // Stale detection: no successful sync in 5+ minutes and not currently syncing
  const isDataStale = useMemo(
    () => deriveStaleState(schedulerStatusQ.data),
    [schedulerStatusQ.data]
  );

  const data = useMemo<DsaData | null>(() => {
    if (!dashboardQ.data) return null;

    const exactStats = new Map(
      (platformStatsQ.data ?? []).map((s) => [s.platformName, s])
    );

    const submissions = submissionsQ.data ?? [];
    // Pre-allocate with correct size to avoid repeated map access
    const solveCountsFromSubs: Record<string, number> = {};
    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      if (sub.status === 'accepted') {
        const key = sub.platform;
        solveCountsFromSubs[key] = (solveCountsFromSubs[key] || 0) + 1;
      }
    }

    const stats: DsaStat[] = dashboardQ.data.stats.map((s) => ({
      label: s.label,
      value: s.value,
      icon: s.icon,
    }));

    const platformOverview: PlatformOverviewItem[] = dashboardQ.data.platformOverview
      .filter((p) => isDsaPlatform(p.platform))
      .map((p) => {
        const platformKey = p.platform as Platform;
        const exact = exactStats.get(platformKey);
        const rankVal = exact?.rank?.toString() ?? (p.rank != null ? String(p.rank) : null);
        return {
          platform: platformKey,
          stat: p.stat,
          totalSolved: exact
            ? exact.totalSolved
            : ((solveCountsFromSubs[platformKey] as number | undefined) ?? p.totalSolved ?? 0),
          rank: rankVal,
          rating: exact?.rating ?? p.rating ?? null,
        };
      });

    return {
      stats,
      heatmap: dashboardQ.data.heatmap,
      submissions,
      contests: (contestsQ.data as Contest[]) ?? [],
      topics: (topicsQ.data as Topic[]) ?? [],
      platformOverview,
    };
  }, [dashboardQ.data, submissionsQ.data, contestsQ.data, topicsQ.data, platformStatsQ.data]);

  // Stable refetch — wrapped in useCallback so it never changes reference
  const refetch = useCallback(() => {
    void dashboardQ.refetch();
    void submissionsQ.refetch();
    void contestsQ.refetch();
    void topicsQ.refetch();
    void platformStatsQ.refetch();
    void schedulerStatusQ.refetch();
  }, [dashboardQ, submissionsQ, contestsQ, topicsQ, platformStatsQ, schedulerStatusQ]);

  const sync = () => syncMutation.mutate(undefined);

  return {
    data,
    loading: isLoading,
    error: errorMessage,
    refetch,
    sync,
    isSyncing: syncMutation.isPending,
    isDataStale,
    schedulerStatus: schedulerStatusQ.data,
    connectionStatus: sse.connectionStatus,
    xp: {
      totalXp: xp.totalXp,
      currentLevel: xp.currentLevel,
      xpToNextLevel: xp.xpToNextLevel,
      xpInCurrentLevel: xp.xpInCurrentLevel,
      progressPercent: xp.progressPercent,
      lifetimeStats: xp.lifetimeStats,
    },
  };
}

// Re-export for downstream consumers
type Contest = {
  id: string;
  contestName: string;
  platform: string;
  rank: number | null;
  totalParticipants: number | null;
  problemsSolved: number;
  ratingChange: number | null;
  participatedAt: string;
};

type Topic = {
  name: string;
  progress: number;
};
