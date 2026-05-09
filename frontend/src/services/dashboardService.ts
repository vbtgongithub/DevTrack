// ============================================================================
// dashboardService.ts — Dashboard API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type {
  ApiResponse,
  ApiDashboardResponse,
  ApiDashboardStats,
  ApiStreakData,
  ApiPlatformStats,
  ApiMission,
  ApiDashboardRecentActivity,
} from '../types/api.types';

export interface GithubDashboardStats {
  repos: number;
  followers: number;
  following: number;
  avatarUrl: string | null;
  name: string | null;
  bio: string | null;
  lastSyncedAt: string;
}

const DASHBOARD_BASE = '/dashboard';

/**
 * Fetch the full dashboard payload (stats, streak, platforms, missions, activity).
 */
export async function fetchDashboard(): Promise<ApiResponse<ApiDashboardResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDashboardResponse>>(
    `${DASHBOARD_BASE}`
  );
  return data;
}

/**
 * Fetch dashboard stats only (lightweight).
 */
export async function fetchDashboardStats(): Promise<ApiResponse<ApiDashboardStats>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDashboardStats>>(
    `${DASHBOARD_BASE}/stats`
  );
  return data;
}

/**
 * Fetch streak data.
 */
export async function fetchStreakData(): Promise<ApiResponse<ApiStreakData>> {
  const { data } = await axiosClient.get<ApiResponse<ApiStreakData>>(
    `${DASHBOARD_BASE}/streak`
  );
  return data;
}

/**
 * Fetch platform stats for all connected platforms.
 */
export async function fetchPlatformStats(): Promise<ApiResponse<ApiPlatformStats[]>> {
  const { data } = await axiosClient.get<ApiResponse<ApiPlatformStats[]>>(
    `${DASHBOARD_BASE}/platforms`
  );
  return data;
}

/**
 * Fetch active missions.
 */
export async function fetchMissions(): Promise<ApiResponse<ApiMission[]>> {
  const { data } = await axiosClient.get<ApiResponse<ApiMission[]>>(
    `${DASHBOARD_BASE}/missions`
  );
  return data;
}

/**
 * Fetch recent activity feed for dashboard.
 */
export async function fetchRecentActivity(
  limit: number = 10
): Promise<ApiResponse<ApiDashboardRecentActivity[]>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDashboardRecentActivity[]>>(
    `${DASHBOARD_BASE}/recent-activity`,
    { params: { limit } }
  );
  return data;
}

/**
 * Fetch GitHub-specific dashboard stats.
 */
export async function fetchGithubDashboardStats(): Promise<ApiResponse<GithubDashboardStats>> {
  const { data } = await axiosClient.get<ApiResponse<GithubDashboardStats>>(
    `${DASHBOARD_BASE}/github`
  );
  return data;
}
