// ============================================================================
// profileStore.ts — Profile Zustand Store
// ============================================================================
// Manages profile data, CP platform stats, persistence to localStorage.
// Supports both backend-synced data and direct external API fetches.
// ============================================================================

import { create } from 'zustand';
import type {
  ProfileData,
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
  HackerRankStats,
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
  fetchHackerRankStats,
  getCachedStats,
  setCachedStats,
  isCacheValid,
} from '../services/platformApiService';
import type {
  LeetCodeCalendar,
  LeetCodeSubmission,
  CodeforcesSubmission,
} from '../services/platformApiService';
import { fetchBackendPlatformStats } from '../services/profileService';
import type { ApiPlatformStatsItem } from '../types/api.types';

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
  hackerrank: PlatformState<HackerRankStats>;

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
  fetchHackerRank: () => Promise<void>;
  fetchAllPlatforms: () => Promise<void>;

  // Actions: Extended data
  fetchLeetCodeCalendarData: () => Promise<void>;
  fetchLeetCodeSubmissionsData: () => Promise<void>;
  fetchCodeforcesSubmissionsData: () => Promise<void>;
  fetchBackendStats: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: { ...DEFAULT_PROFILE },

  leetcode: EMPTY_PLATFORM_STATE<LeetCodeStats>(),
  codeforces: EMPTY_PLATFORM_STATE<CodeforcesStats>(),
  codechef: EMPTY_PLATFORM_STATE<CodeChefStats>(),
  hackerrank: EMPTY_PLATFORM_STATE<HackerRankStats>(),

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
        if (cached.hackerrank && isCacheValid(cached.hackerrank.fetchedAt)) {
          set({
            hackerrank: {
              data: cached.hackerrank.data,
              loading: false,
              error: null,
              lastFetchedAt: cached.hackerrank.fetchedAt,
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

  // ─── Fetch HackerRank ──────────────────────────────────────────────
  fetchHackerRank: async () => {
    const { profile } = get();
    if (!profile.hackerrankUsername.trim()) {
      set({
        hackerrank: { data: null, loading: false, error: 'Please enter a HackerRank username', lastFetchedAt: null },
      });
      return;
    }

    set({
      hackerrank: { ...get().hackerrank, loading: true, error: null },
    });

    try {
      const data = await fetchHackerRankStats(profile.hackerrankUsername);
      const now = Date.now();
      set({
        hackerrank: { data, loading: false, error: null, lastFetchedAt: now },
      });
      setCachedStats({ hackerrank: { data, fetchedAt: now } });
    } catch (err) {
      set({
        hackerrank: {
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch HackerRank stats',
          lastFetchedAt: null,
        },
      });
    }
  },

  // ─── Fetch All (direct external API calls) ──────────────────────────
  fetchAllPlatforms: async () => {
    const { profile, fetchLeetCode, fetchCodeforces, fetchCodeChef, fetchHackerRank } = get();
    const promises: Promise<void>[] = [];

    if (profile.leetcodeUsername.trim()) promises.push(fetchLeetCode());
    if (profile.codeforcesUsername.trim()) promises.push(fetchCodeforces());
    if (profile.codechefUsername.trim()) promises.push(fetchCodeChef());
    if (profile.hackerrankUsername.trim()) promises.push(fetchHackerRank());

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

  // ─── Fetch from Backend API ─────────────────────────────────────────
  fetchBackendStats: async () => {
    // Only attempt backend fetch if user is authenticated
    const token = localStorage.getItem('devtrack_access_token');
    if (!token) return;

    try {
      const response = await fetchBackendPlatformStats();
      if (!response.success || !response.data?.platforms) return;

      const { platforms } = response.data;
      const now = Date.now();

      for (const item of platforms) {
        const name = item.platformName.toLowerCase();

        if (name === 'leetcode') {
          const lcData = mapToLeetCodeStats(item);
          set({
            leetcode: { data: lcData, loading: false, error: null, lastFetchedAt: now },
          });
          setCachedStats({ leetcode: { data: lcData, fetchedAt: now } });
        } else if (name === 'codeforces') {
          const cfData = mapToCodeforcesStats(item);
          set({
            codeforces: { data: cfData, loading: false, error: null, lastFetchedAt: now },
          });
          setCachedStats({ codeforces: { data: cfData, fetchedAt: now } });
        } else if (name === 'codechef') {
          const ccData = mapToCodeChefStats(item);
          set({
            codechef: { data: ccData, loading: false, error: null, lastFetchedAt: now },
          });
          setCachedStats({ codechef: { data: ccData, fetchedAt: now } });
        } else if (name === 'hackerrank') {
          const hrData = mapToHackerRankStats(item);
          set({
            hackerrank: { data: hrData, loading: false, error: null, lastFetchedAt: now },
          });
          setCachedStats({ hackerrank: { data: hrData, fetchedAt: now } });
        }
      }
    } catch {
      // Backend not available — fall back to cached / direct API data silently
    }
  },
}));

// ---------------------------------------------------------------------------
// MAPPING HELPERS: Backend generic → Platform-specific types
// ---------------------------------------------------------------------------

function mapToLeetCodeStats(item: ApiPlatformStatsItem): LeetCodeStats {
  return {
    solvedProblem: item.totalSolved,
    easySolved: item.easySolved,
    mediumSolved: item.mediumSolved,
    hardSolved: item.hardSolved,
    totalEasy: 850,      // approximate totals
    totalMedium: 1800,
    totalHard: 800,
    acceptanceRate: 0,
    ranking: 0,
    contributionPoints: 0,
    reputation: 0,
    contestRating: typeof item.rating === 'number' ? item.rating : 0,
    contestGlobalRanking: 0,
    totalContests: item.totalContests,
    contestTopPercentage: 0,
  };
}

function mapToCodeforcesStats(item: ApiPlatformStatsItem): CodeforcesStats {
  return {
    handle: item.username,
    rating: typeof item.rating === 'number' ? item.rating : 0,
    maxRating: typeof item.rating === 'number' ? item.rating : 0,
    rank: item.rank ?? 'unrated',
    maxRank: item.rank ?? 'unrated',
    avatar: '',
    contribution: 0,
    friendOfCount: 0,
    organization: '',
    registrationTimeSeconds: 0,
    totalSolved: item.totalSolved,
    totalContests: item.totalContests,
  };
}

function mapToCodeChefStats(item: ApiPlatformStatsItem): CodeChefStats {
  return {
    name: item.username,
    currentRating: typeof item.rating === 'number' ? item.rating : 0,
    highestRating: typeof item.rating === 'number' ? item.rating : 0,
    stars: '0★',
    globalRank: 0,
    countryRank: 0,
    countryName: '',
    totalProblemsSolved: item.totalSolved,
  };
}

function mapToHackerRankStats(item: ApiPlatformStatsItem): HackerRankStats {
  return {
    username: item.username,
    totalSolved: item.totalSolved,
    totalContests: item.totalContests,
    badges: 0,
    certificates: 0,
    level: item.rank ?? '—',
    score: typeof item.rating === 'number' ? item.rating : 0,
  };
}
