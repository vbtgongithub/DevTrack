// ============================================================================
// dsaStore.ts — DSA Tracker Cache Store
// ============================================================================
// Stores ViewModel data ONLY. Never raw API responses.
// ============================================================================

import { create } from 'zustand';
import type { DsaPageVM, DataStatus } from '../types/vm.types';

interface DsaState {
  data: DsaPageVM | null;
  status: DataStatus;
  error: string | null;
  lastFetchedAt: number | null;

  // Current filter/pagination state
  currentPage: number;
  filters: {
    difficulty: string;
    status: string;
    category: string;
    platform: string;
    sortBy: string;
    sortOrder: string;
    search: string;
  };

  // Actions
  setData: (data: DsaPageVM) => void;
  setStatus: (status: DataStatus) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string) => void;
  setSearch: (query: string) => void;
  clearFilters: () => void;
  invalidate: () => void;
  reset: () => void;
}

const initialFilters = {
  difficulty: '',
  status: '',
  category: '',
  platform: '',
  sortBy: 'lastSubmittedAt',
  sortOrder: 'desc',
  search: '',
};

const initialState = {
  data: null,
  status: 'idle' as DataStatus,
  error: null,
  lastFetchedAt: null,
  currentPage: 1,
  filters: { ...initialFilters },
};

export const useDsaStore = create<DsaState>((set) => ({
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

  setPage: (page) =>
    set({
      currentPage: page,
      lastFetchedAt: null,
    }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      currentPage: 1,
      lastFetchedAt: null,
    })),

  setSearch: (query) =>
    set((state) => ({
      filters: { ...state.filters, search: query },
      currentPage: 1,
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
