// ============================================================================
// profileService.ts — Profile API Service
// ============================================================================
// Fetches profile and platform stats from the backend API.
// Uses axiosClient for authenticated requests.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type {
  ApiResponse,
  ApiPlatformStatsResponse,
} from '../types/api.types';

const PROFILE_BASE = '/profile';

/**
 * Fetch platform stats from the backend (server-synced data).
 * GET /profile/platforms/stats
 */
export async function fetchBackendPlatformStats(): Promise<ApiResponse<ApiPlatformStatsResponse>> {
  const { data } = await axiosClient.get<ApiResponse<ApiPlatformStatsResponse>>(
    `${PROFILE_BASE}/platforms/stats`
  );
  return data;
}
