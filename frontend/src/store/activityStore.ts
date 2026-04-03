// ============================================================================
// activityStore.ts — Activity Cache Store
// ============================================================================
// Stores ViewModel data ONLY. Never raw API responses.
// ============================================================================

import { create } from 'zustand';
import type { ActivityPageVM, DataStatus } from '../types/vm.types';

interface ActivityState {
  data: ActivityPageVM | null;
  status: DataStatus;
  error: string | null;
  lastFetchedAt: number | null;

  // Current filter/pagination state
  currentYear: number;
  currentPage: number;
  filters: {
    platform: string;
    type: string;
    dateRange: string;
  };

  // Actions
  setData: (data: ActivityPageVM) => void;
  setStatus: (status: DataStatus) => void;
  setError: (error: string | null) => void;
  setYear: (year: number) => void;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  invalidate: () => void;
  reset: () => void;
}

const currentYear = new Date().getFullYear();

const initialFilters = {
  platform: '',
  type: '',
  dateRange: '',
};

const initialState = {
  data: null,
  status: 'idle' as DataStatus,
  error: null,
  lastFetchedAt: null,
  currentYear,
  currentPage: 1,
  filters: { ...initialFilters },
};

export const useActivityStore = create<ActivityState>((set) => ({
  ...initialState,

  setData: (data) =>
    set({
      data,
      status: 'success',
      error: null,
      lastFetchedAt: Date.now(),
    }),

  setStatus: (status) => set({ status }),

  setError: (error) =>
    set({
      error,
      status: 'error',
    }),

  setYear: (year) =>
    set({
      currentYear: year,
      lastFetchedAt: null, // invalidate on year change
    }),

  setPage: (page) =>
    set({
      currentPage: page,
      lastFetchedAt: null,
    }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1, // reset to page 1 on filter change
      lastFetchedAt: null,
    })),

  clearFilters: () =>
    set({
      filters: { ...initialFilters },
      currentPage: 1,
      lastFetchedAt: null,
    }),

  invalidate: () => set({ lastFetchedAt: null }),

  reset: () => set(initialState),
}));
