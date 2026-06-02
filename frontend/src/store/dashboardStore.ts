// ============================================================================
// dashboardStore.ts — Dashboard Cache Store
// ============================================================================
// Central cache for GET /api/dashboard data. Shared by:
//   - Dashboard page (useDashboardData)
//   - DSA page (useDsaData → useDashboardData)
//   - Profile page (useDashboardData → populateFromDashboard)
//
// Cache invalidation: call invalidate() after sync to trigger a re-fetch.
// ============================================================================

import { create } from 'zustand';
import type { DataStatus } from '../types/vm.types';

// Re-export-safe: the data shape is defined in useDashboardData.ts
// but the store holds it as `unknown` to avoid circular imports.
// Consumers cast it via the hook.

interface DashboardState {
  data: unknown | null;
  status: DataStatus;
  error: string | null;
  lastFetchedAt: number | null;

  // Actions
  setData: (data: unknown) => void;
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

  // Setting lastFetchedAt to null signals useDashboardData to re-fetch
  invalidate: () =>
    set({ lastFetchedAt: null, status: 'idle' }),

  reset: () => set(initialState),
}));
