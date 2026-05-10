// ============================================================================
// profileStore.ts — Profile Zustand Store
// ============================================================================
// Manages profile editing data and sync lifecycle.
// Platform stats are derived from the dashboard response (GET /api/dashboard)
// via useDashboardData — the ONLY data endpoint used by the frontend.
// Profile editing fields are persisted in localStorage.
// ============================================================================

import { create } from 'zustand';
import type {
  ProfileData,
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
  GithubStats,
  PlatformState,
} from '../types/profile.types';
import { DEFAULT_PROFILE, EMPTY_PLATFORM_STATE } from '../types/profile.types';
import { connectPlatform, syncAllPlatforms as syncAllPlatformsApi } from '../services/profileService';
import type { ApiPlatformStats } from '../types/api.types';

// ---------------------------------------------------------------------------
// STORAGE KEY (profile editing data only — NOT stats)
// ---------------------------------------------------------------------------

const PROFILE_KEY = 'devtrack-profile';

// ---------------------------------------------------------------------------
// STORE INTERFACE
// ---------------------------------------------------------------------------

type SyncState = 'idle' | 'syncing' | 'success' | 'error';

interface ProfileStore {
  // Profile data
  profile: ProfileData;

  // Platform stats (derived from dashboard data)
  leetcode: PlatformState<LeetCodeStats>;
  codeforces: PlatformState<CodeforcesStats>;
  codechef: PlatformState<CodeChefStats>;
  github: PlatformState<GithubStats>;

  // Sync lifecycle
  syncState: SyncState;
  syncMessage: string | null;
  lastSyncedAt: string | null;

  // Dirty tracking
  isDirty: boolean;
  isSaving: boolean;

  // Actions: Profile editing
  loadFromStorage: () => void;
  saveToStorage: () => void;
  updateField: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  addTechStack: (tag: string) => void;
  removeTechStack: (tag: string) => void;

  // Actions: Sync (triggers backend sync, then invalidates dashboard)
  fetchAllPlatforms: () => Promise<void>;
  clearSyncMessage: () => void;

  // Actions: Populate stats from dashboard data (called by ProfilePage)
  populateFromDashboard: (platforms: ApiPlatformStats[], githubStats?: any) => void;
}

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: { ...DEFAULT_PROFILE },

  leetcode: EMPTY_PLATFORM_STATE<LeetCodeStats>(),
  codeforces: EMPTY_PLATFORM_STATE<CodeforcesStats>(),
  codechef: EMPTY_PLATFORM_STATE<CodeChefStats>(),
  github: EMPTY_PLATFORM_STATE<GithubStats>(),

  syncState: 'idle',
  syncMessage: null,
  lastSyncedAt: null,

  isDirty: false,
  isSaving: false,

  // ─── Load profile editing data from localStorage ────────────────────
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
    } catch {
      // Corrupted — start fresh
    }
  },

  // ─── Save profile editing data to localStorage ──────────────────────
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

  // ─── Clear sync feedback message ────────────────────────────────────
  clearSyncMessage: () => set({ syncMessage: null }),

  // ─── Populate platform stats from dashboard data ────────────────────
  // Called by ProfilePage with data from useDashboardData.
  // This avoids a separate /api/profile/platforms/stats call.
  populateFromDashboard: (platforms: ApiPlatformStats[], githubStats?: any) => {
    const now = Date.now();
 
    // Reset all first
    const lc = EMPTY_PLATFORM_STATE<LeetCodeStats>();
    const cf = EMPTY_PLATFORM_STATE<CodeforcesStats>();
    const cc = EMPTY_PLATFORM_STATE<CodeChefStats>();
    const gh = EMPTY_PLATFORM_STATE<GithubStats>();
 
    for (const p of platforms) {
      const name = p.platformName.toLowerCase();
      if (name === 'leetcode') {
        Object.assign(lc, { data: mapToLeetCodeStats(p), loading: false, lastFetchedAt: now });
      } else if (name === 'codeforces') {
        Object.assign(cf, { data: mapToCodeforcesStats(p), loading: false, lastFetchedAt: now });
      } else if (name === 'codechef') {
        Object.assign(cc, { data: mapToCodeChefStats(p), loading: false, lastFetchedAt: now });
      } else if (name === 'github') {
        // If we have specialized githubStats, use them as they are more detailed
        const data = githubStats ? {
          username: p.username,
          publicRepos: githubStats.repos,
          followers: githubStats.followers,
          following: githubStats.following,
          totalStars: githubStats.totalStars,
          topLanguages: githubStats.topLanguages,
          createdAt: githubStats.lastSyncedAt, // Fallback if created_at not available
          updatedAt: githubStats.lastSyncedAt,
        } : mapToGithubStats(p);
        
        Object.assign(gh, { data, loading: false, lastFetchedAt: now });
      }
    }
 
    set({ leetcode: lc, codeforces: cf, codechef: cc, github: gh });
  },

  // ─── Sync All Platforms ─────────────────────────────────────────────
  // 1. Connect usernames in backend
  // 2. POST /api/platforms/sync-all
  // 3. Invalidate dashboard store (triggers GET /api/dashboard re-fetch)
  // 4. All pages auto-update from the same dashboard data
  fetchAllPlatforms: async () => {
    const { profile } = get();

    // 1. Set sync state to loading
    set({
      syncState: 'syncing',
      syncMessage: null,
      leetcode: { ...get().leetcode, loading: true, error: null },
      codeforces: { ...get().codeforces, loading: true, error: null },
      codechef: { ...get().codechef, loading: true, error: null },
      github: { ...get().github, loading: true, error: null },
    });

    // 2. Connect platforms in the backend
    const platformMap: [string, string][] = [
      ['leetcode', profile.leetcodeUsername],
      ['codeforces', profile.codeforcesUsername],
      ['codechef', profile.codechefUsername],
    ];

    const connectPromises = platformMap
      .filter(([, username]) => username.trim().length > 0)
      .map(([name, username]) => connectPlatform(name, username).catch(() => {}));

    await Promise.allSettled(connectPromises);

    // 3. Trigger backend sync
    let syncSucceeded = false;
    let syncMessage = '';
    try {
      const response = await syncAllPlatformsApi();
      const data = response?.data?.data;
      if (data?.results) {
        const results = data.results as Array<{ platform: string; success: boolean; error?: string | null }>;
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          syncMessage = `All ${succeeded} platform(s) synced successfully`;
          syncSucceeded = true;
        } else if (succeeded > 0) {
          syncMessage = `${succeeded}/${results.length} synced. Failed: ${failed.map((f) => f.platform).join(', ')}`;
          syncSucceeded = true;
        } else {
          syncMessage = `Sync failed: ${failed.map((f) => `${f.platform}: ${f.error || 'unknown'}`).join('; ')}`;
        }
      } else {
        syncMessage = 'Sync completed';
        syncSucceeded = true;
      }
    } catch (err) {
      syncMessage = err instanceof Error ? err.message : 'Platform sync failed';
    }

    // 4. Update sync state
    set({
      syncState: syncSucceeded ? 'success' : 'error',
      syncMessage,
      lastSyncedAt: syncSucceeded ? new Date().toISOString() : get().lastSyncedAt,
    });

    // 5. Invalidate dashboard store → triggers GET /api/dashboard re-fetch
    //    This is the ONLY data endpoint. All pages derive from it.
    const { useDashboardStore } = await import('./dashboardStore');
    useDashboardStore.getState().invalidate();

    // 6. Signal activity page to refetch (if mounted)
    window.dispatchEvent(new CustomEvent('devtrack:activity-invalidate'));

    // 6. Auto-clear success message after 5 seconds
    if (syncSucceeded) {
      setTimeout(() => {
        if (get().syncState === 'success') {
          set({ syncMessage: null });
        }
      }, 5000);
    }
  },
}));

// ---------------------------------------------------------------------------
// MAPPING HELPERS: Dashboard ApiPlatformStats → Profile-specific types
// ---------------------------------------------------------------------------

function mapToLeetCodeStats(p: ApiPlatformStats): LeetCodeStats {
  return {
    solvedProblem: p.totalSolved,
    easySolved: p.easySolved,
    mediumSolved: p.mediumSolved,
    hardSolved: p.hardSolved,
    totalEasy: 850,
    totalMedium: 1800,
    totalHard: 800,
    acceptanceRate: 0,
    ranking: 0,
    contributionPoints: 0,
    reputation: 0,
    contestRating: typeof p.rating === 'number' ? p.rating : 0,
    contestGlobalRanking: 0,
    totalContests: p.totalContests,
    contestTopPercentage: 0,
  };
}

function mapToCodeforcesStats(p: ApiPlatformStats): CodeforcesStats {
  return {
    handle: p.username,
    rating: typeof p.rating === 'number' ? p.rating : 0,
    maxRating: typeof p.rating === 'number' ? p.rating : 0,
    rank: p.rank ?? 'unrated',
    maxRank: p.rank ?? 'unrated',
    avatar: '',
    contribution: 0,
    friendOfCount: 0,
    organization: '',
    registrationTimeSeconds: 0,
    totalSolved: p.totalSolved,
    totalContests: p.totalContests,
  };
}

function mapToCodeChefStats(p: ApiPlatformStats): CodeChefStats {
  const raw = p.rawData || {};
  return {
    name: p.username,
    currentRating: typeof p.rating === 'number' ? p.rating : 0,
    highestRating: (raw.highestRating as number) ?? (typeof p.rating === 'number' ? p.rating : 0),
    stars: (raw.stars as string) ?? '0★',
    globalRank: parseInt(String(raw.globalRank || '0'), 10),
    countryRank: 0,
    countryName: '',
    totalProblemsSolved: p.totalSolved,
  };
}

function mapToGithubStats(p: ApiPlatformStats): GithubStats {
  const raw = p.rawData || {};
  return {
    username: p.username,
    publicRepos: (raw.public_repos as number) ?? 0,
    followers: (raw.followers as number) ?? 0,
    following: (raw.following as number) ?? 0,
    totalStars: (raw.total_stars as number) ?? 0,
    topLanguages: (raw.top_languages as string[]) ?? [],
    createdAt: (raw.created_at as string) ?? '',
    updatedAt: (raw.updated_at as string) ?? '',
  };
}
