// ============================================================================
// dsaService.ts — DSA Tracker API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type {
  ApiResponse,
  ApiDsaListResponse,
  ApiDsaProblem,
  ApiDsaStats,
  ApiDsaFilters,
  ApiDsaProblemCreatePayload,
  ApiDsaProblemUpdatePayload,
  ApiMutationResponse,
  ApiDeleteResponse,
  ApiDsaDashboardResponse,
  ApiDsaSubmissionsListResponse,
  ApiDsaContestsListResponse,
  ApiDsaTopicsListResponse,
} from '../types/api.types';

const DSA_BASE = '/dsa';

/**
 * Fetch complete DSA dashboard data (heatmap, submissions, topics, platform stats).
 */
export async function fetchDsaDashboard(options?: { signal?: AbortSignal }): Promise<ApiResponse<ApiDsaDashboardResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaDashboardResponse>>(`${DSA_BASE}/dashboard`, { signal: options?.signal });
  return data;
}

/**
 * Fetch paginated DSA problem list with filters and stats.
 */
export async function fetchDsaProblems(
  filters: ApiDsaFilters = {}
): Promise<ApiResponse<ApiDsaListResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaListResponse>>(
    `${DSA_BASE}/problems`,
    { params: filters }
  );
  return data;
}

/**
 * Fetch a single DSA problem by ID.
 */
export async function fetchDsaProblem(
  problemId: string
): Promise<ApiResponse<ApiDsaProblem>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaProblem>>(
    `${DSA_BASE}/problems/${problemId}`
  );
  return data;
}

/**
 * Fetch DSA stats/overview.
 */
export async function fetchDsaStats(): Promise<ApiResponse<ApiDsaStats>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaStats>>(
    `${DSA_BASE}/stats`
  );
  return data;
}

/**
 * Create a new DSA problem entry.
 */
export async function createDsaProblem(
  payload: ApiDsaProblemCreatePayload
): Promise<ApiResponse<ApiDsaProblem>> {
  const { data } = await axiosClient.post<ApiResponse<ApiDsaProblem>>(
    `${DSA_BASE}/problems`,
    payload
  );
  return data;
}

/**
 * Update an existing DSA problem.
 */
export async function updateDsaProblem(
  problemId: string,
  payload: ApiDsaProblemUpdatePayload
): Promise<ApiResponse<ApiDsaProblem>> {
  const { data } = await axiosClient.patch<ApiResponse<ApiDsaProblem>>(
    `${DSA_BASE}/problems/${problemId}`,
    payload
  );
  return data;
}

/**
 * Delete a DSA problem.
 */
export async function deleteDsaProblem(
  problemId: string
): Promise<ApiDeleteResponse> {
  const { data } = await axiosClient.delete<ApiDeleteResponse>(
    `${DSA_BASE}/problems/${problemId}`
  );
  return data;
}

/**
 * Toggle favorite on a DSA problem.
 */
export async function toggleDsaFavorite(
  problemId: string
): Promise<ApiResponse<ApiDsaProblem>> {
  const { data } = await axiosClient.post<ApiResponse<ApiDsaProblem>>(
    `${DSA_BASE}/problems/${problemId}/favorite`
  );
  return data;
}

/**
 * Bulk update problem status.
 */
export async function bulkUpdateDsaStatus(
  problemIds: string[],
  status: ApiDsaProblem['status']
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.patch<ApiMutationResponse>(
    `${DSA_BASE}/problems/bulk-status`,
    { problemIds, status }
  );
  return data;
}

/**
 * Fetch paginated submission history.
 */
export async function fetchDsaSubmissions(
  filters: { platform?: string; status?: string; page?: number; pageSize?: number } = {},
  options?: { signal?: AbortSignal }
): Promise<ApiResponse<ApiDsaSubmissionsListResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaSubmissionsListResponse>>(
    `${DSA_BASE}/submissions`,
    { params: filters, signal: options?.signal }
  );
  return data;
}

/**
 * Fetch paginated contest history.
 */
export async function fetchDsaContests(
  filters: { platform?: string; page?: number; pageSize?: number } = {},
  options?: { signal?: AbortSignal }
): Promise<ApiResponse<ApiDsaContestsListResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaContestsListResponse>>(
    `${DSA_BASE}/contests`,
    { params: filters, signal: options?.signal }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Upcoming Contests — public aggregator (client-side, read-only)
// ---------------------------------------------------------------------------

export interface UpcomingContest {
  id: string;
  platform: string; // 'leetcode' | 'codeforces' | 'codechef'
  name: string;
  startTime: number; // epoch ms (UTC)
  url: string;
}

interface RawUpcomingContest {
  site?: string;
  title?: string;
  startTime?: number;
  url?: string;
}

const UPCOMING_CONTESTS_URL = 'https://competeapi.vercel.app/contests/upcoming/';
const UPCOMING_PLATFORMS = ['leetcode', 'codeforces', 'codechef'];

/**
 * Fetch upcoming programming contests across LeetCode, Codeforces and CodeChef
 * from a public aggregator. Read-only, no auth and no user data transmitted.
 * Returns [] on any failure so callers can render an empty state gracefully.
 */
export async function fetchUpcomingContests(options?: { signal?: AbortSignal }): Promise<UpcomingContest[]> {
  try {
    const res = await fetch(UPCOMING_CONTESTS_URL, { signal: options?.signal });
    if (!res.ok) {
      console.error(`[dsaService] Upcoming contests request failed: HTTP ${res.status}`);
      return [];
    }

    const raw = (await res.json()) as RawUpcomingContest[];
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((c) => c && typeof c.site === 'string' && UPCOMING_PLATFORMS.includes(c.site.toLowerCase()))
      .map((c) => {
        const platform = (c.site as string).toLowerCase();
        return {
          platform,
          name: c.title ?? 'Untitled Contest',
          startTime: Number(c.startTime) || 0,
          url: c.url ?? '',
          id: `${platform}:${c.url ?? c.title ?? ''}`,
        };
      })
      .filter((c) => c.startTime > 0);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return [];
    console.error('[dsaService] Failed to fetch upcoming contests:', err);
    return [];
  }
}

/**
 * Fetch topic analytics with per-difficulty breakdowns.
 */
export async function fetchDsaTopics(options?: { signal?: AbortSignal }): Promise<ApiResponse<ApiDsaTopicsListResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiDsaTopicsListResponse>>(
    `${DSA_BASE}/topics`,
    { signal: options?.signal }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Sync Status — returned by the backend scheduler singleton (no DB queries)
// ---------------------------------------------------------------------------

export interface SchedulerStatus {
  status: 'idle' | 'running' | 'error';
  lastSyncStartedAt: string | null;
  lastSyncCompletedAt: string | null;
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;
  lastSyncDurationMs: number | null;
  totalSyncs: number;
  failedSyncs: number;
}

/**
 * Fetch global scheduler status — lightweight, no DB.
 * Polled by the frontend to drive sync state indicators.
 */
export async function fetchSchedulerStatus(options?: { signal?: AbortSignal }): Promise<ApiResponse<SchedulerStatus>> {
  const { data } = await axiosClient.get<ApiResponse<SchedulerStatus>>('/platforms/sync-scheduler-status', { signal: options?.signal });
  return data;
}
