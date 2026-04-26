// ============================================================================
// useDashboardData.ts — Dashboard Data Hook
// ============================================================================
// Fetches dashboard data from backend only. No mocks, no localStorage.
// Single source of truth: Backend API → axiosClient → DB
// Re-fetches on every mount AND whenever the authenticated user changes.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../utils/axiosClient';
import { useUserStore } from '../store/userStore';
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
  // Aggregated problem counts (across all platforms)
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  // Streak
  streak: number;
  // Full backend payload sections (for components that need more)
  stats: ApiDashboardStats;
  streakData: ApiStreakData;
  platformStats: ApiPlatformStats[];
  missions: ApiMission[];
  recentActivity: ApiDashboardRecentActivity[];
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Subscribe to the current user's ID — when it changes, we re-fetch
  const userId = useUserStore((s) => s.user?.id ?? null);

  const fetchDashboard = useCallback(() => {
    // Don't fetch if no user is authenticated
    if (!userId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    axiosClient
      .get<ApiResponse<ApiDashboardResponse>>('/dashboard', {
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;

        const b = response.data.data;

        // Aggregate solved counts from platform stats
        const platforms = b.platformStats || [];
        const totalSolved = platforms.reduce((s, p) => s + (p.totalSolved || 0), 0);
        const easy = platforms.reduce((s, p) => s + (p.easySolved || 0), 0);
        const medium = platforms.reduce((s, p) => s + (p.mediumSolved || 0), 0);
        const hard = platforms.reduce((s, p) => s + (p.hardSolved || 0), 0);

        setData({
          totalSolved,
          easy,
          medium,
          hard,
          streak: b.streak?.currentStreak || 0,
          stats: b.stats,
          streakData: b.streak,
          platformStats: platforms,
          missions: b.missions || [],
          recentActivity: b.recentActivity || [],
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to load dashboard data';
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
  }, [userId]);

  // Re-fetch whenever userId changes (login, logout, user switch) AND on every mount
  useEffect(() => {
    // Clear stale data immediately when user changes
    setData(null);
    fetchDashboard();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}
