// ============================================================================
// profileService.ts — Profile API Service
// ============================================================================
// Handles sync-related API calls. Stats are no longer fetched from a
// dedicated endpoint — they come from GET /api/dashboard (single source).
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type { AxiosResponse } from 'axios';

const PROFILE_BASE = '/profile';

/**
 * Connect a platform username for the authenticated user.
 * POST /profile/platforms/connect
 */
export async function connectPlatform(platformName: string, username: string): Promise<void> {
  await axiosClient.post(`${PROFILE_BASE}/platforms/connect`, { platformName, username });
}

/**
 * Trigger a server-side sync for all connected platforms.
 * POST /platforms/sync-all
 * Returns the full Axios response so callers can read per-platform results.
 */
export async function syncAllPlatforms(): Promise<AxiosResponse> {
  return axiosClient.post('/platforms/sync-all');
}
