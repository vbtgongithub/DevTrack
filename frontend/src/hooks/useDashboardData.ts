// ============================================================================
// useDashboardData.ts — Dashboard Data Hook (CACHED)
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import axiosClient from '../utils/axiosClient';
import { useUserStore } from '../store/userStore';
import { useDashboardStore } from '../store/dashboardStore';
import { type GithubDashboardStats } from '../services/dashboardService';
import type {
  ApiResponse,
  ApiDashboardResponse,
  ApiPlatformStats,
  ApiDashboardStats,
  ApiStreakData,
  ApiMission,
  ApiDashboardRecentActivity,
} from '../types/api.types';

export interface DashboardData {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
  stats: ApiDashboardStats;
  streakData: ApiStreakData;
  platformStats: ApiPlatformStats[];
  missions: ApiMission[];
  recentActivity: ApiDashboardRecentActivity[];
  githubStats: GithubDashboardStats | null;
}

const STALE_MS = 60_000;

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const userId = useUserStore((s) => s.user?.id ?? null);
  
  const storeData = useDashboardStore((s) => s.data) as DashboardData | null;
  const storeStatus = useDashboardStore((s) => s.status);
  const storeError = useDashboardStore((s) => s.error);
  const storeLastFetchedAt = useDashboardStore((s) => s.lastFetchedAt);

  const abortRef = useRef<AbortController | null>(null);

  const fetchDashboard = useCallback(
    (force = false) => {
      if (!userId) {
        useDashboardStore.getState().reset();
        return;
      }

      const state = useDashboardStore.getState();

      if (
        !force &&
        state.data !== null &&
        state.lastFetchedAt !== null &&
        Date.now() - state.lastFetchedAt < STALE_MS
      ) {
        if (state.status === 'loading') {
          useDashboardStore.getState().setStatus('success');
        }
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      useDashboardStore.getState().setStatus('loading');

      axiosClient.get<ApiResponse<ApiDashboardResponse>>('/dashboard', { signal: controller.signal })
        .then((res) => {
          if (controller.signal.aborted) return;

          const b = res.data.data;
          const platforms = b.platformStats || [];
          const githubStats = b.githubStats || null;

          const dashData: DashboardData = {
            totalSolved: platforms.reduce((s, p) => s + (p.totalSolved || 0), 0),
            easy: platforms.reduce((s, p) => s + (p.easySolved || 0), 0),
            medium: platforms.reduce((s, p) => s + (p.mediumSolved || 0), 0),
            hard: platforms.reduce((s, p) => s + (p.hardSolved || 0), 0),
            streak: b.streak?.currentStreak || 0,
            stats: b.stats,
            streakData: b.streak,
            platformStats: platforms,
            missions: b.missions || [],
            recentActivity: b.recentActivity || [],
            githubStats,
          };

          useDashboardStore.getState().setData(dashData);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          const message =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: string }).message)
              : 'Failed to load dashboard data';
          useDashboardStore.getState().setError(message);
        });
    },
    [userId]
  );

  useEffect(() => {
    fetchDashboard();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchDashboard]);

  useEffect(() => {
    if (storeLastFetchedAt === null && storeStatus !== 'loading' && userId) {
      fetchDashboard(true);
    }
  }, [storeLastFetchedAt, storeStatus, userId, fetchDashboard]);

  return {
    data: storeData,
    loading: storeStatus === 'loading',
    error: storeError,
    refetch: () => fetchDashboard(true),
  };
}
