// ============================================================================
// useProjectsData.ts — Projects Data Hook
// ============================================================================
// The ONLY place where services are called for projects.
// Integrates: service → ViewModel → store caching → exposes HookReturn.
// ============================================================================

import { useEffect, useCallback, useRef } from 'react';
import { useProjectsStore } from '../store/projectsStore';
import {
  fetchProjects,
  fetchProject,
  fetchProjectTasks,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from '../services/projectsService';
import {
  transformProjectsPage,
  transformProjectDetail,
} from '../viewmodels/projectsVM';
import { isStale, TTL } from '../utils/stale';
import type {
  ProjectsPageVM,
  ProjectDetailVM,
  HookReturn,
} from '../types/vm.types';
import type { ApiError, ApiProjectFilters, ApiProjectCreatePayload, ApiProjectUpdatePayload } from '../types/api.types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// LIST HOOK
// ---------------------------------------------------------------------------

export function useProjectsData(): HookReturn<ProjectsPageVM> & {
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (query: string) => void;
  clearFilters: () => void;
  currentFilters: {
    status: string;
    visibility: string;
    language: string;
    sortBy: string;
    sortOrder: string;
    search: string;
  };
  createProject: (payload: ApiProjectCreatePayload) => Promise<void>;
  updateProject: (id: string, payload: ApiProjectUpdatePayload) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
} {
  const {
    listData: data,
    listStatus: status,
    listError: error,
    listLastFetchedAt: lastFetchedAt,
    currentPage,
    filters,
    setListData: setData,
    setListStatus: setStatus,
    setListError: setError,
    setPage,
    setFilter,
    setSearch,
    clearFilters,
  } = useProjectsStore();

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
        const apiFilters: ApiProjectFilters = {
          page: currentPage,
          pageSize: 12,
          sortBy: filters.sortBy as ApiProjectFilters['sortBy'],
          sortOrder: filters.sortOrder as ApiProjectFilters['sortOrder'],
        };

        if (filters.status)
          apiFilters.status = filters.status as ApiProjectFilters['status'];
        if (filters.visibility)
          apiFilters.visibility = filters.visibility as ApiProjectFilters['visibility'];
        if (filters.language) apiFilters.language = filters.language;
        if (filters.search) apiFilters.search = filters.search;

        const response = await fetchProjects(apiFilters);
        const now = Date.now();
        const vm = transformProjectsPage(response.data, now);
        setData(vm);
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError.message || 'Failed to load projects';

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

  const handleCreate = useCallback(async (payload: ApiProjectCreatePayload) => {
    await apiCreateProject(payload);
    useProjectsStore.getState().invalidateList();
    await fetchData(true);
  }, [fetchData]);

  const handleUpdate = useCallback(async (id: string, payload: ApiProjectUpdatePayload) => {
    await apiUpdateProject(id, payload);
    useProjectsStore.getState().invalidateList();
    await fetchData(true);
  }, [fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    await apiDeleteProject(id);
    useProjectsStore.getState().invalidateList();
    await fetchData(true);
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
    createProject: handleCreate,
    updateProject: handleUpdate,
    deleteProject: handleDelete,
  };
}

// ---------------------------------------------------------------------------
// DETAIL HOOK
// ---------------------------------------------------------------------------

export function useProjectDetail(
  projectId: string | null
): HookReturn<ProjectDetailVM> {
  const {
    detailData: data,
    detailStatus: status,
    detailError: error,
    detailLastFetchedAt: lastFetchedAt,
    activeProjectId,
    setDetailData: setData,
    setDetailStatus: setStatus,
    setDetailError: setError,
    setActiveProject,
  } = useProjectsStore();

  const retriesRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetchDetailRef = useRef<(bypassCache?: boolean) => Promise<void>>(async () => {});

  const fetchData = useCallback(
    async (bypassCache: boolean = false) => {
      if (!projectId) return;

      // If project changed, reset detail
      if (projectId !== activeProjectId) {
        setActiveProject(projectId);
      }

      if (!bypassCache && !isStale(lastFetchedAt, TTL.DEFAULT)) {
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStatus('loading');

      try {
        const [projectResponse, tasksResponse] = await Promise.all([
          fetchProject(projectId),
          fetchProjectTasks(projectId),
        ]);

        const now = Date.now();
        const vm = transformProjectDetail(
          projectResponse.data,
          tasksResponse.data,
          now
        );
        setData(vm);
        retriesRef.current = 0;
      } catch (err) {
        const apiError = err as ApiError;
        const message = apiError.message || 'Failed to load project';

        if (
          retriesRef.current < MAX_RETRIES &&
          (apiError.statusCode >= 500 || apiError.code === 'UNKNOWN_ERROR')
        ) {
          retriesRef.current++;
          setTimeout(() => {
            void fetchDetailRef.current(true);
          }, RETRY_DELAY_MS * retriesRef.current);
          return;
        }

        setError(message);
        retriesRef.current = 0;
      }
    },
    [
      projectId,
      activeProjectId,
      lastFetchedAt,
      setData,
      setStatus,
      setError,
      setActiveProject,
    ]
  );

  useEffect(() => {
    fetchDetailRef.current = fetchData;
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

  return { data, status, error, refresh };
}
