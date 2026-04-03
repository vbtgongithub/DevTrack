// ============================================================================
// userStore.ts — User / Auth Store
// ============================================================================
// Stores authenticated user state. ViewModel data only.
// ============================================================================

import { create } from 'zustand';
import type { ApiUser } from '../types/api.types';

interface UserState {
  user: ApiUser | null;
  isAuthenticated: boolean;
  lastFetchedAt: number | null;

  // Actions
  setUser: (user: ApiUser) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<ApiUser>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  lastFetchedAt: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      lastFetchedAt: Date.now(),
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      lastFetchedAt: null,
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));
