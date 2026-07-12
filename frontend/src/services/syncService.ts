// ============================================================================
// syncService.ts — Client-side sequential platform sync (rate-limit aware)
// ============================================================================
// Syncs platforms one-at-a-time (concurrency = 1) against the per-platform
// backend endpoint. On HTTP 429 it backs off exponentially and retries up to
// a hard cap, then moves on to the next platform. It never retries forever.
// ============================================================================

import axiosClient from '../utils/axiosClient';

// Tunables (kept intentionally small to avoid long-running / runaway syncs)
const MAX_ATTEMPTS = 3; // total attempts per platform (initial + retries)
const BACKOFF_BASE_MS = 500; // first backoff wait
const BACKOFF_MULTIPLIER = 2; // exponential growth factor
const PLATFORM_TIMEOUT_MS = 30_000; // abort a single platform attempt after 30s

export type PlatformSyncStatus = 'synced' | 'rate_limited' | 'error';

export interface PlatformSyncResult {
  platform: string;
  success: boolean;
  status: PlatformSyncStatus;
  attempts: number;
  error?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract an HTTP status code from a normalized axios error (see axiosClient
 * response interceptor) or a raw axios error, if present.
 */
function getStatusCode(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    const e = err as { statusCode?: number; response?: { status?: number } };
    return e.statusCode ?? e.response?.status;
  }
  return undefined;
}

function getMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Sync failed';
}

/**
 * Sync a single platform. Aborts the request after PLATFORM_TIMEOUT_MS.
 * POST /platforms/sync/:platformName
 */
export async function syncPlatform(platform: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLATFORM_TIMEOUT_MS);
  try {
    await axiosClient.post(`/platforms/sync/${platform}`, undefined, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sync a single platform with limited retries on HTTP 429.
 * Uses exponential backoff (500ms, 1000ms, ...). Never loops indefinitely.
 */
export async function syncPlatformWithRetry(platform: string): Promise<PlatformSyncResult> {
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt += 1;
    try {
      await syncPlatform(platform);
      return { platform, success: true, status: 'synced', attempts: attempt };
    } catch (err) {
      const status = getStatusCode(err);

      // Retry only on rate-limit, and only while attempts remain.
      if (status === 429 && attempt < MAX_ATTEMPTS) {
        const wait = BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        console.warn(
          `[syncService] ${platform} rate limited (429). Attempt ${attempt}/${MAX_ATTEMPTS}, retrying in ${wait}ms`
        );
        await delay(wait);
        continue;
      }

      const message = getMessage(err);
      console.error(`[syncService] ${platform} sync failed (attempt ${attempt}): ${message}`);
      return {
        platform,
        success: false,
        status: status === 429 ? 'rate_limited' : 'error',
        attempts: attempt,
        error: message,
      };
    }
  }

  // Exhausted retries while still rate-limited.
  console.error(`[syncService] ${platform} exhausted ${MAX_ATTEMPTS} attempts (429). Moving on.`);
  return {
    platform,
    success: false,
    status: 'rate_limited',
    attempts: attempt,
    error: `Exhausted ${MAX_ATTEMPTS} attempts (rate limited)`,
  };
}

/**
 * Sync all provided platforms sequentially (concurrency = 1).
 * A failure on one platform never blocks the rest — we log and continue.
 */
export async function syncAllPlatforms(platforms: string[]): Promise<PlatformSyncResult[]> {
  const results: PlatformSyncResult[] = [];

  for (const platform of platforms) {
    const result = await syncPlatformWithRetry(platform);
    results.push(result);
  }

  return results;
}
