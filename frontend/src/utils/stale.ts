// ============================================================================
// stale.ts — Cache Staleness Utilities
// ============================================================================
// Controls cache TTL and invalidation strategy.
// Used by hooks to avoid unnecessary API calls.
// ============================================================================

/** Default TTL: 5 minutes in milliseconds */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Check if cached data is stale based on last fetch timestamp.
 *
 * @param lastFetchedAt - Unix timestamp (ms) of the last fetch, or null if never fetched
 * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 * @param now - Current timestamp for determinism in tests (default: Date.now())
 * @returns true if data is stale or has never been fetched
 */
export function isStale(
  lastFetchedAt: number | null,
  ttlMs: number = DEFAULT_TTL_MS,
  now: number = Date.now()
): boolean {
  if (lastFetchedAt === null) return true;
  return now - lastFetchedAt > ttlMs;
}

/**
 * Get remaining time before cache becomes stale.
 *
 * @param lastFetchedAt - Unix timestamp (ms) of last fetch
 * @param ttlMs - TTL in milliseconds
 * @param now - Current timestamp
 * @returns Remaining time in ms (0 if already stale)
 */
export function timeUntilStale(
  lastFetchedAt: number | null,
  ttlMs: number = DEFAULT_TTL_MS,
  now: number = Date.now()
): number {
  if (lastFetchedAt === null) return 0;
  const remaining = ttlMs - (now - lastFetchedAt);
  return Math.max(0, remaining);
}

/**
 * Pre-defined TTL constants for different data types.
 */
export const TTL = {
  /** 5 minutes — default for most data */
  DEFAULT: DEFAULT_TTL_MS,
  /** 1 minute — for frequently changing data (activity, streak) */
  SHORT: 1 * 60 * 1000,
  /** 15 minutes — for rarely changing data (settings, profile) */
  LONG: 15 * 60 * 1000,
  /** 30 minutes — for very stable data (categories, filter options) */
  VERY_LONG: 30 * 60 * 1000,
  /** 0 — always refetch */
  NONE: 0,
} as const;
