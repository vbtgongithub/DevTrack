// ============================================================================
// useActivityData.ts — Activity Data Hook
// ============================================================================
// The ONLY place where services are called for activity.
// Integrates: service → ViewModel → store caching → exposes HookReturn.
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { useActivityStore } from '../store/activityStore';
import { fetchActivityHeatmap, fetchActivityFeed } from '../services/activityService';
import { transformActivityPage } from '../viewmodels/activityVM';
import { isStale, TTL } from '../utils/stale';
import type { ActivityPageVM, HookReturn } from '../types/vm.types';
import type { ApiError, ApiActivityFilters } from '../types/api.types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function useActivityData(): HookReturn<ActivityPageVM> & {
  setYear: (year: number) => void;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  currentFilters: { platform: string; type: string; dateRange: string };
} {
  const {
    data,
    status,
    error,
    lastFetchedAt,
    currentYear,
    currentPage,
    filters,
    setData,
    setStatus,
    setError,
    setYear,
    setPage,
    setFilter,
    clearFilters,
  } = useActivityStore();

  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetchDataRef = useRef<(bypassCache?: boolean) => Promise<void>>(async () => {});

  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      if (!bypassCache && !isStale(lastFetchedAt, TTL.SHORT)) {
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStatus('loading');

      try {
        // Build API filters from store state
        const apiFilters: ApiActivityFilters = {
          page: currentPage,
          pageSize: 20,
        };
        if (filters.platform) apiFilters.platform = filters.platform;
        if (filters.type) apiFilters.type = filters.type;

        // Fetch both heatmap and feed in parallel
        const [heatmapResponse, feedResponse] = await Promise.all([
          fetchActivityHeatmap(currentYear),
          fetchActivityFeed(apiFilters),
        ]);

        const now = Date.now();
        const vm = transformActivityPage(
          heatmapResponse.data,
          feedResponse.data,
          now
        );
        setData(vm);
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError.message || 'Failed to load activity';

        if (
          retriesRef.current < MAX_RETRIES &&
          (apiError.statusCode >= 500 || apiError.code === 'UNKNOWN_ERROR')
        ) {
          retriesRef.current++;
          setTimeout(() => {
            void fetchDataRef.current(true);
          }, RETRY_DELAY_MS * retriesRef.current);
          return;
        }

        setError(message);
        retriesRef.current = 0;
      }
    },
    [lastFetchedAt, currentYear, currentPage, filters, setData, setStatus, setError]
  );

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    retriesRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    status,
    error,
    refresh,
    setYear,
    setPage,
    setFilter,
    clearFilters,
    currentFilters: filters,
  };
}
