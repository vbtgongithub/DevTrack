// ============================================================================
// useDashboardQueries.ts — TanStack Query Hooks for Dashboard
// ============================================================================
// Production-grade data fetching with caching, retries, and background refetch.
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, fetchDashboardStats, fetchStreakData, fetchPlatformStats, fetchMissions, fetchRecentActivity, fetchGithubDashboardStats, fetchAchievements } from '../services/dashboardService';
import { queryKeys } from '../lib/queryClient';
import { useUserStore } from '../store/userStore';
import type { ApiDashboardStats, ApiStreakData, ApiPlatformStats, ApiMission, ApiDashboardRecentActivity, ApiAchievementsResponse } from '../types/api.types';

// Helper hook to get authenticated user ID
function useUserId(): string | null {
  return useUserStore((s) => s.user?.id ?? null);
}

// ---------------------------------------------------------------------------
// Main Dashboard Query - Fetches all dashboard data at once
// ---------------------------------------------------------------------------

export function useDashboard() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchDashboard();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard');
      }
      return response.data;
    },
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
    gcTime: 300_000, // 5 minutes
  });
}

// ---------------------------------------------------------------------------
// Individual Dashboard Data Queries (for parallel fetching)
// ---------------------------------------------------------------------------

export function useDashboardStats() {
  const userId = useUserId();

  return useQuery<ApiDashboardStats>({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchDashboardStats();
      if (!response.success) throw new Error(response.message || 'Failed to fetch stats');
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useStreakData() {
  const userId = useUserId();

  return useQuery<ApiStreakData>({
    queryKey: queryKeys.dashboard.streak,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchStreakData();
      if (!response.success) throw new Error(response.message || 'Failed to fetch streak');
      return response.data;
    },
    enabled: !!userId,
  });
}

export function usePlatformStats() {
  const userId = useUserId();

  return useQuery<ApiPlatformStats[]>({
    queryKey: queryKeys.dashboard.platforms,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchPlatformStats();
      if (!response.success) throw new Error(response.message || 'Failed to fetch platforms');
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useMissions() {
  const userId = useUserId();

  return useQuery<ApiMission[]>({
    queryKey: queryKeys.dashboard.missions,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchMissions();
      if (!response.success) throw new Error(response.message || 'Failed to fetch missions');
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useRecentActivity(limit: number = 10) {
  const userId = useUserId();

  return useQuery<ApiDashboardRecentActivity[]>({
    queryKey: queryKeys.dashboard.recentActivity(limit),
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchRecentActivity(limit);
      if (!response.success) throw new Error(response.message || 'Failed to fetch activity');
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useGithubStats() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.dashboard.github,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchGithubDashboardStats();
      if (!response.success) throw new Error(response.message || 'Failed to fetch GitHub stats');
      return response.data;
    },
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// Achievements Query
// ---------------------------------------------------------------------------

export function useAchievements() {
  const userId = useUserId();

  return useQuery<ApiAchievementsResponse>({
    queryKey: queryKeys.achievements.all,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const response = await fetchAchievements();
      if (!response.success) throw new Error(response.message || 'Failed to fetch achievements');
      return response.data;
    },
    enabled: !!userId,
    staleTime: 120_000, // Achievements change less frequently - 2 minutes
    gcTime: 600_000, // Keep in cache for 10 minutes
  });
}