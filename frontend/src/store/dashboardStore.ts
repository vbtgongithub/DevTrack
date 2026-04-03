// ============================================================================
// dashboardStore.ts — Dashboard Cache Store
// ============================================================================
// Stores ViewModel data ONLY. Never raw API responses.
// Includes lastFetchedAt for cache invalidation via isStale().
// ============================================================================

import { create } from 'zustand';
import type { DashboardVM, DataStatus } from '../types/vm.types';

interface DashboardState {
  data: DashboardVM | null;
  status: DataStatus;
  error: string | null;
  lastFetchedAt: number | null;

  // Actions
  setData: (data: DashboardVM) => void;
  setStatus: (status: DataStatus) => void;
  setError: (error: string | null) => void;
  invalidate: () => void;
  reset: () => void;
}

const initialState = {
  data: null,
  status: 'idle' as DataStatus,
  error: null,
  lastFetchedAt: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
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

  invalidate: () =>
    set({ lastFetchedAt: null }),

  reset: () => set(initialState),
}));
