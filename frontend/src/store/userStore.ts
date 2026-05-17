// ============================================================================
// userStore.ts — User / Auth Store
// ============================================================================
// Stores authenticated user state + auth actions (login, register, logout,
// hydrate on app boot, fetchMe). Token persistence lives in authService.
// ============================================================================

import { create } from 'zustand';
import type { ApiUser } from '../types/api.types';
import * as authService from '../services/authService';
import { setOnAuthInvalid } from '../utils/axiosClient';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface UserState {
  user: ApiUser | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  lastFetchedAt: number | null;

  // ── Mutations (synchronous) ──
  setUser: (user: ApiUser) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<ApiUser>) => void;

  // ── Async actions ──
  /** Login with email/username + password. Stores tokens and user. */
  login: (emailOrUsername: string, password: string) => Promise<void>;
  /** Register a new account. Stores tokens and user. */
  register: (email: string, username: string, displayName: string, password: string, inviteCode?: string) => Promise<void>;
  /** Logout: revoke refresh token on backend, clear local state + tokens. */
  logout: () => Promise<void>;
  /** Fetch /auth/me to rehydrate user from a valid access token. */
  fetchMe: () => Promise<void>;
  /**
   * Boot-time hydration: if a token exists in localStorage, try fetchMe.
   * Sets status to 'authenticated' or 'unauthenticated' accordingly.
   */
  hydrate: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  status: 'idle',
  lastFetchedAt: null,

  // ── Synchronous mutations ──────────────────────────────────────────────
  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      status: 'authenticated',
      lastFetchedAt: Date.now(),
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      status: 'unauthenticated',
      lastFetchedAt: null,
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  // ── Async actions ──────────────────────────────────────────────────────
  login: async (emailOrUsername, password) => {
    set({ status: 'loading' });
    try {
      const result = await authService.login(emailOrUsername, password);
      authService.storeTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({
        user: result.user,
        isAuthenticated: true,
        status: 'authenticated',
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      set({ status: 'unauthenticated' });
      throw err; // re-throw so LoginPage can display the error
    }
  },

  register: async (email, username, displayName, password, inviteCode) => {
    set({ status: 'loading' });
    try {
      const result = await authService.register(email, username, displayName, password, inviteCode);
      authService.storeTokens(result.tokens.accessToken, result.tokens.refreshToken);
      set({
        user: result.user,
        isAuthenticated: true,
        status: 'authenticated',
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      set({ status: 'unauthenticated' });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = authService.getRefreshToken();
    // Best-effort server-side revocation
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // swallow — we still clear local state
      }
    }
    authService.clearTokens();

    // Clear all per-user data stores to prevent stale data leaking to next user
    const { useDashboardStore } = await import('./dashboardStore');
    const { useDsaStore } = await import('./dsaStore');
    const { useProjectsStore } = await import('./projectsStore');
    useDashboardStore.getState().reset();
    useDsaStore.getState().reset();
    useProjectsStore.getState().reset();

    // Clear profile editing data from localStorage
    localStorage.removeItem('devtrack-profile');

    get().clearUser();
  },

  fetchMe: async () => {
    const user = await authService.fetchMe();
    set({
      user,
      isAuthenticated: true,
      status: 'authenticated',
      lastFetchedAt: Date.now(),
    });
  },

  hydrate: async () => {
    const token = authService.getAccessToken();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      await get().fetchMe();
    } catch (err: any) {
      // ONLY clear tokens if the server explicitly tells us the session is unauthorized (401)
      // Otherwise, keep the tokens so the user doesn't get logged out on a simple network hiccup or 502!
      if (err?.statusCode === 401 || err?.status === 401) {
        authService.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          status: 'unauthenticated',
          lastFetchedAt: null,
        });
      } else {
        // Keep tokens, just transition status back to unauthenticated/idle
        set({ status: 'unauthenticated' });
      }
    }
  },
}));

setOnAuthInvalid(() => {
  useUserStore.getState().clearUser();
});

// ---------------------------------------------------------------------------
// Cross-tab auth synchronization
// ---------------------------------------------------------------------------
// When a user logs in or out in a different browser tab, this listener
// detects the localStorage change and re-hydrates state so all tabs
// stay in sync. Without this, stale auth state causes ghost sessions
// where one tab thinks the user is logged in but the token is gone.

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    // authService stores tokens under these keys
    if (event.key === 'devtrack_access_token' || event.key === 'devtrack_refresh_token') {
      const store = useUserStore.getState();

      if (event.newValue === null && store.isAuthenticated) {
        // Token was removed in another tab → logout locally
        store.clearUser();
      } else if (event.newValue && !store.isAuthenticated) {
        // Token was added in another tab → re-hydrate
        store.hydrate();
      }
    }
  });
}
