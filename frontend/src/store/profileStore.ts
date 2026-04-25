// ============================================================================
// profileStore.ts — Profile Zustand Store
// ============================================================================
// Manages profile data, CP platform stats, persistence to localStorage.
// ============================================================================

import { create } from 'zustand';
import type {
  ProfileData,
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
  PlatformState,
} from '../types/profile.types';
import { DEFAULT_PROFILE, EMPTY_PLATFORM_STATE } from '../types/profile.types';
import {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchLeetCodeCalendar,
  fetchLeetCodeSubmissions,
  fetchCodeforcesSubmissions,
  getCachedStats,
  setCachedStats,
  isCacheValid,
} from '../services/platformApiService';
import type {
  LeetCodeCalendar,
  LeetCodeSubmission,
  CodeforcesSubmission,
} from '../services/platformApiService';

// ---------------------------------------------------------------------------
// STORAGE KEY
// ---------------------------------------------------------------------------

const PROFILE_KEY = 'devtrack-profile';

// ---------------------------------------------------------------------------
// STORE INTERFACE
// ---------------------------------------------------------------------------

interface ProfileStore {
  // Profile data
  profile: ProfileData;

  // Platform stats
  leetcode: PlatformState<LeetCodeStats>;
  codeforces: PlatformState<CodeforcesStats>;
  codechef: PlatformState<CodeChefStats>;

  // Extended data (heatmap + submissions)
  leetcodeCalendar: PlatformState<LeetCodeCalendar>;
  leetcodeSubmissions: PlatformState<LeetCodeSubmission[]>;
  codeforcesSubmissions: PlatformState<CodeforcesSubmission[]>;

  // Dirty tracking
  isDirty: boolean;
  isSaving: boolean;

  // Actions: Profile
  loadFromStorage: () => void;
  saveToStorage: () => void;
  updateField: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  addTechStack: (tag: string) => void;
  removeTechStack: (tag: string) => void;

  // Actions: Platform stats
  fetchLeetCode: () => Promise<void>;
  fetchCodeforces: () => Promise<void>;
  fetchCodeChef: () => Promise<void>;
  fetchAllPlatforms: () => Promise<void>;

  // Actions: Extended data
  fetchLeetCodeCalendarData: () => Promise<void>;
  fetchLeetCodeSubmissionsData: () => Promise<void>;
  fetchCodeforcesSubmissionsData: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: { ...DEFAULT_PROFILE },

  leetcode: EMPTY_PLATFORM_STATE<LeetCodeStats>(),
  codeforces: EMPTY_PLATFORM_STATE<CodeforcesStats>(),
  codechef: EMPTY_PLATFORM_STATE<CodeChefStats>(),

  leetcodeCalendar: EMPTY_PLATFORM_STATE<LeetCodeCalendar>(),
  leetcodeSubmissions: EMPTY_PLATFORM_STATE<LeetCodeSubmission[]>(),
  codeforcesSubmissions: EMPTY_PLATFORM_STATE<CodeforcesSubmission[]>(),

  isDirty: false,
  isSaving: false,

  // ─── Load from localStorage ──────────────────────────────────────────
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<ProfileData>;
        set({
          profile: { ...DEFAULT_PROFILE, ...saved },
          isDirty: false,
        });
      }

      // Restore cached platform stats
      const cached = getCachedStats();
      if (cached) {
        if (cached.leetcode && isCacheValid(cached.leetcode.fetchedAt)) {
          set({
            leetcode: {
              data: cached.leetcode.data,
              loading: false,
              error: null,
              lastFetchedAt: cached.leetcode.fetchedAt,
            },
          });
        }
        if (cached.codeforces && isCacheValid(cached.codeforces.fetchedAt)) {
          set({
            codeforces: {
              data: cached.codeforces.data,
              loading: false,
              error: null,
              lastFetchedAt: cached.codeforces.fetchedAt,
            },
          });
        }
        if (cached.codechef && isCacheValid(cached.codechef.fetchedAt)) {
          set({
            codechef: {
              data: cached.codechef.data,
              loading: false,
              error: null,
              lastFetchedAt: cached.codechef.fetchedAt,
            },
          });
        }
      }
    } catch {
      // Corrupted — start fresh
    }
  },

  // ─── Save to localStorage ───────────────────────────────────────────
  saveToStorage: () => {
    set({ isSaving: true });
    try {
      const { profile } = get();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      set({ isDirty: false, isSaving: false });
    } catch {
      set({ isSaving: false });
    }
  },

  // ─── Update single field ────────────────────────────────────────────
  updateField: (field, value) => {
    set((state) => ({
      profile: { ...state.profile, [field]: value },
      isDirty: true,
    }));
  },

  // ─── Tech stack tags ────────────────────────────────────────────────
  addTechStack: (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.profile.techStack.includes(trimmed)) return state;
      return {
        profile: {
          ...state.profile,
          techStack: [...state.profile.techStack, trimmed],
        },
        isDirty: true,
      };
    });
  },

  removeTechStack: (tag) => {
    set((state) => ({
      profile: {
        ...state.profile,
        techStack: state.profile.techStack.filter((t) => t !== tag),
      },
      isDirty: true,
    }));
  },

  // ─── Fetch LeetCode ─────────────────────────────────────────────────
  fetchLeetCode: async () => {
    const { profile } = get();
    if (!profile.leetcodeUsername.trim()) {
      set({
        leetcode: { data: null, loading: false, error: 'Please enter a LeetCode username', lastFetchedAt: null },
      });
      return;
    }

    set({
      leetcode: { ...get().leetcode, loading: true, error: null },
    });

    try {
      const data = await fetchLeetCodeStats(profile.leetcodeUsername);
      const now = Date.now();
      set({
        leetcode: { data, loading: false, error: null, lastFetchedAt: now },
      });
      setCachedStats({ leetcode: { data, fetchedAt: now } });
    } catch (err) {
      set({
        leetcode: {
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch LeetCode stats',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch Codeforces ───────────────────────────────────────────────
  fetchCodeforces: async () => {
    const { profile } = get();
    if (!profile.codeforcesUsername.trim()) {
      set({
        codeforces: { data: null, loading: false, error: 'Please enter a Codeforces handle', lastFetchedAt: null },
      });
      return;
    }

    set({
      codeforces: { ...get().codeforces, loading: true, error: null },
    });

    try {
      const data = await fetchCodeforcesStats(profile.codeforcesUsername);
      const now = Date.now();
      set({
        codeforces: { data, loading: false, error: null, lastFetchedAt: now },
      });
      setCachedStats({ codeforces: { data, fetchedAt: now } });
    } catch (err) {
      set({
        codeforces: {
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch Codeforces stats',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch CodeChef ─────────────────────────────────────────────────
  fetchCodeChef: async () => {
    const { profile } = get();
    if (!profile.codechefUsername.trim()) {
      set({
        codechef: { data: null, loading: false, error: 'Please enter a CodeChef username', lastFetchedAt: null },
      });
      return;
    }

    set({
      codechef: { ...get().codechef, loading: true, error: null },
    });

    try {
      const data = await fetchCodeChefStats(profile.codechefUsername);
      const now = Date.now();
      set({
        codechef: { data, loading: false, error: null, lastFetchedAt: now },
      });
      setCachedStats({ codechef: { data, fetchedAt: now } });
    } catch (err) {
      set({
        codechef: {
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch CodeChef stats',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch All ──────────────────────────────────────────────────────
  fetchAllPlatforms: async () => {
    const { profile, fetchLeetCode, fetchCodeforces, fetchCodeChef } = get();
    const promises: Promise<void>[] = [];

    if (profile.leetcodeUsername.trim()) promises.push(fetchLeetCode());
    if (profile.codeforcesUsername.trim()) promises.push(fetchCodeforces());
    if (profile.codechefUsername.trim()) promises.push(fetchCodeChef());

    await Promise.allSettled(promises);
  },

  // ─── Fetch LeetCode Calendar (heatmap) ─────────────────────────────
  fetchLeetCodeCalendarData: async () => {
    const { profile } = get();
    if (!profile.leetcodeUsername.trim()) return;

    set({ leetcodeCalendar: { ...get().leetcodeCalendar, loading: true, error: null } });

    try {
      const data = await fetchLeetCodeCalendar(profile.leetcodeUsername);
      set({
        leetcodeCalendar: { data, loading: false, error: null, lastFetchedAt: Date.now() },
      });
    } catch (err) {
      set({
        leetcodeCalendar: {
          data: null, loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch calendar',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch LeetCode Submissions ────────────────────────────────────
  fetchLeetCodeSubmissionsData: async () => {
    const { profile } = get();
    if (!profile.leetcodeUsername.trim()) return;

    set({ leetcodeSubmissions: { ...get().leetcodeSubmissions, loading: true, error: null } });

    try {
      const data = await fetchLeetCodeSubmissions(profile.leetcodeUsername, 20);
      set({
        leetcodeSubmissions: { data, loading: false, error: null, lastFetchedAt: Date.now() },
      });
    } catch (err) {
      set({
        leetcodeSubmissions: {
          data: null, loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch submissions',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch Codeforces Submissions ──────────────────────────────────
  fetchCodeforcesSubmissionsData: async () => {
    const { profile } = get();
    if (!profile.codeforcesUsername.trim()) return;

    set({ codeforcesSubmissions: { ...get().codeforcesSubmissions, loading: true, error: null } });

    try {
      const data = await fetchCodeforcesSubmissions(profile.codeforcesUsername, 30);
      set({
        codeforcesSubmissions: { data, loading: false, error: null, lastFetchedAt: Date.now() },
      });
    } catch (err) {
      set({
        codeforcesSubmissions: {
          data: null, loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch CF submissions',
          lastFetchedAt: null,
        },
      });
    }
  },
}));
