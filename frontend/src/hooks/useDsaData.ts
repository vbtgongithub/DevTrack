// ============================================================================
// useDsaData.ts — DSA Tracker Data Hook
// ============================================================================
// The ONLY place where services are called for DSA.
// Integrates: service → ViewModel → store caching → exposes HookReturn.
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { useDsaStore } from '../store/dsaStore';
import { fetchDsaProblems } from '../services/dsaService';
import { transformDsaPage } from '../viewmodels/dsaVM';
import { isStale, TTL } from '../utils/stale';
import type { DsaPageVM, HookReturn } from '../types/vm.types';
import type { ApiError, ApiDsaFilters } from '../types/api.types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function useDsaData(): HookReturn<DsaPageVM> & {
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (query: string) => void;
  clearFilters: () => void;
  currentFilters: {
    difficulty: string;
    status: string;
    category: string;
    platform: string;
    sortBy: string;
    sortOrder: string;
    search: string;
  };
} {
  const {
    data,
    status,
    error,
    lastFetchedAt,
    currentPage,
    filters,
    setData,
    setStatus,
    setError,
    setPage,
    setFilter,
    setSearch,
    clearFilters,
  } = useDsaStore();

  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetchDataRef = useRef<(bypassCache?: boolean) => Promise<void>>(async () => {});

  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      if (!bypassCache && !isStale(lastFetchedAt, TTL.DEFAULT)) {
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStatus('loading');

      try {
        const apiFilters: ApiDsaFilters = {
          page: currentPage,
          pageSize: 20,
          sortBy: filters.sortBy as ApiDsaFilters['sortBy'],
          sortOrder: filters.sortOrder as ApiDsaFilters['sortOrder'],
        };

        if (filters.difficulty)
          apiFilters.difficulty = filters.difficulty as ApiDsaFilters['difficulty'];
        if (filters.status)
          apiFilters.status = filters.status as ApiDsaFilters['status'];
        if (filters.category) apiFilters.category = filters.category;
        if (filters.platform) apiFilters.platform = filters.platform;
        if (filters.search) apiFilters.search = filters.search;

        const response = await fetchDsaProblems(apiFilters);
        const now = Date.now();
        const vm = transformDsaPage(response.data, now);
        setData(vm);
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError.message || 'Failed to load DSA problems';

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
    [lastFetchedAt, currentPage, filters, setData, setStatus, setError]
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
    setPage,
    setFilter,
    setSearch,
    clearFilters,
    currentFilters: filters,
  };
}
