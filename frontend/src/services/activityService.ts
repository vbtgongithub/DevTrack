// ============================================================================
// activityService.ts — Activity API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type {
  ApiResponse,
  ApiActivityHeatmapResponse,
  ApiActivityFeedResponse,
  ApiActivityFilters,
  ApiActivityEntry,
  ApiMutationResponse,
} from '../types/api.types';

const ACTIVITY_BASE = '/activity';

/**
 * Fetch heatmap data for a given year.
 */
export async function fetchActivityHeatmap(
  year: number
): Promise<ApiResponse<ApiActivityHeatmapResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiActivityHeatmapResponse>>(
    `${ACTIVITY_BASE}/heatmap`,
    { params: { year } }
  );
  return data;
}

/**
 * Fetch paginated activity feed with optional filters.
 */
export async function fetchActivityFeed(
  filters: ApiActivityFilters = {}
): Promise<ApiResponse<ApiActivityFeedResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiActivityFeedResponse>>(
    `${ACTIVITY_BASE}/feed`,
    { params: filters }
  );
  return data;
}

/**
 * Fetch activities for a specific date.
 */
export async function fetchActivitiesByDate(
  date: string
): Promise<ApiResponse<ApiActivityEntry[]>> {
  const { data } = await axiosClient.get<ApiResponse<ApiActivityEntry[]>>(
    `${ACTIVITY_BASE}/date/${date}`
  );
  return data;
}

/**
 * Create a manual activity entry (e.g., a note).
 */
export async function createActivity(
  payload: Omit<ApiActivityEntry, 'id' | 'occurredAt'>
): Promise<ApiResponse<ApiActivityEntry>> {
  const { data } = await axiosClient.post<ApiResponse<ApiActivityEntry>>(
    `${ACTIVITY_BASE}`,
    payload
  );
  return data;
}

/**
 * Delete an activity entry.
 */
export async function deleteActivity(
  activityId: string
): Promise<ApiMutationResponse> {
  const { data } = await axiosClient.delete<ApiMutationResponse>(
    `${ACTIVITY_BASE}/${activityId}`
  );
  return data;
}
