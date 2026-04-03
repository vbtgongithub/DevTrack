// ============================================================================
// projectsStore.ts — Projects Cache Store
// ============================================================================
// Stores ViewModel data ONLY. Never raw API responses.
// ============================================================================

import { create } from 'zustand';
import type { ProjectsPageVM, ProjectDetailVM, DataStatus } from '../types/vm.types';

interface ProjectsState {
  // List view
  listData: ProjectsPageVM | null;
  listStatus: DataStatus;
  listError: string | null;
  listLastFetchedAt: number | null;

  // Detail view
  detailData: ProjectDetailVM | null;
  detailStatus: DataStatus;
  detailError: string | null;
  detailLastFetchedAt: number | null;
  activeProjectId: string | null;

  // Filters
  currentPage: number;
  filters: {
    status: string;
    visibility: string;
    language: string;
    sortBy: string;
    sortOrder: string;
    search: string;
  };

  // Actions — List
  setListData: (data: ProjectsPageVM) => void;
  setListStatus: (status: DataStatus) => void;
  setListError: (error: string | null) => void;
  invalidateList: () => void;

  // Actions — Detail
  setDetailData: (data: ProjectDetailVM) => void;
  setDetailStatus: (status: DataStatus) => void;
  setDetailError: (error: string | null) => void;
  setActiveProject: (projectId: string | null) => void;
  invalidateDetail: () => void;

  // Actions — Filters
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (query: string) => void;
  clearFilters: () => void;

  // Actions — General
  reset: () => void;
}

const initialFilters = {
  status: '',
  visibility: '',
  language: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  search: '',
};

const initialState = {
  listData: null,
  listStatus: 'idle' as DataStatus,
  listError: null,
  listLastFetchedAt: null,
  detailData: null,
  detailStatus: 'idle' as DataStatus,
  detailError: null,
  detailLastFetchedAt: null,
  activeProjectId: null,
  currentPage: 1,
  filters: { ...initialFilters },
};

export const useProjectsStore = create<ProjectsState>((set) => ({
  ...initialState,

  // List
  setListData: (data) =>
    set({
      listData: data,
      listStatus: 'success',
      listError: null,
      listLastFetchedAt: Date.now(),
    }),

  setListStatus: (status) => set({ listStatus: status }),

  setListError: (error) =>
    set({
      listError: error,
      listStatus: 'error',
    }),

  invalidateList: () => set({ listLastFetchedAt: null }),

  // Detail
  setDetailData: (data) =>
    set({
      detailData: data,
      detailStatus: 'success',
      detailError: null,
      detailLastFetchedAt: Date.now(),
    }),

  setDetailStatus: (status) => set({ detailStatus: status }),

  setDetailError: (error) =>
    set({
      detailError: error,
      detailStatus: 'error',
    }),

  setActiveProject: (projectId) =>
    set({
      activeProjectId: projectId,
      detailData: null,
      detailLastFetchedAt: null,
    }),

  invalidateDetail: () => set({ detailLastFetchedAt: null }),

  // Filters
  setPage: (page) =>
    set({
      currentPage: page,
      listLastFetchedAt: null,
    }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1,
      listLastFetchedAt: null,
    })),

  setSearch: (query) =>
    set((state) => ({
      filters: { ...state.filters, search: query },
      currentPage: 1,
      listLastFetchedAt: null,
    })),

  clearFilters: () =>
    set({
      filters: { ...initialFilters },
      currentPage: 1,
      listLastFetchedAt: null,
    }),

  reset: () => set(initialState),
}));
