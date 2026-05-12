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
import {
  connectPlatform,
  syncAllPlatforms as syncAllPlatformsApi,
  getProfile as getProfileApi,
  updateProfile as updateProfileApi
} from '../services/profileService';
import type { ApiPlatformStats, ApiUserProfile } from '../types/api.types';
import { type GithubDashboardStats } from '../services/dashboardService';

// ─── Extended API Profile Interface ────────────────────────────────────────
interface ExtendedApiUserProfile extends ApiUserProfile {
  roleTitle?: string;
  location?: string;
  targetRole?: string;
  targetCompanies?: string[];
  techStack?: string[];
}

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
  isLoading: boolean;

  // Actions: Profile editing
  fetchProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;
  updateField: <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => void;
  addTechStack: (tag: string) => void;
  removeTechStack: (tag: string) => void;

  // Actions: Sync (triggers backend sync, then invalidates dashboard)
  fetchAllPlatforms: () => Promise<void>;
  clearSyncMessage: () => void;

  // Actions: Populate stats from dashboard data (called by ProfilePage)
  populateFromDashboard: (platforms: ApiPlatformStats[], githubStats?: GithubDashboardStats | null) => void;
}

// ---------------------------------------------------------------------------
// MAPPING HELPERS: API -> Frontend
// ---------------------------------------------------------------------------

function mapApiToProfileData(api: ApiUserProfile): ProfileData {
  const a = api as ExtendedApiUserProfile;
  return {
    fullName: api.displayName,
    email: api.email,
    role: a.roleTitle || 'Full Stack Developer',
    bio: api.bio || '',
    location: a.location || '',
    targetRole: a.targetRole || '',
    targetCompanies: (a.targetCompanies || []).join(', '),
    techStack: a.techStack || [],
    githubUrl: api.socialLinks.github || '',
    linkedinUrl: api.socialLinks.linkedin || '',
    portfolioUrl: api.socialLinks.portfolio || '',
    leetcodeUsername: api.socialLinks.leetcode || '',
    codeforcesUsername: api.socialLinks.codeforces || '',
    codechefUsername: api.socialLinks.codechef || '',
  };
}

function mapProfileDataToApi(data: ProfileData) {
  return {
    displayName: data.fullName,
    bio: data.bio,
    roleTitle: data.role,
    targetRole: data.targetRole,
    targetCompanies: data.targetCompanies.split(',').map(s => s.trim()).filter(Boolean),
    socialLinks: {
      github: data.githubUrl || null,
      linkedin: data.linkedinUrl || null,
      portfolio: data.portfolioUrl || null,
      leetcode: data.leetcodeUsername || null,
      codeforces: data.codeforcesUsername || null,
      codechef: data.codechefUsername || null,
      twitter: null,
    }
  };
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
  isLoading: false,

  // ─── Fetch profile from API ──────────────────────────────────────────
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const response = await getProfileApi();
      const apiProfile = response.data.data as ApiUserProfile;
      set({
        profile: mapApiToProfileData(apiProfile),
        isDirty: false,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      set({ isLoading: false });
    }
  },

  // ─── Save profile to API ────────────────────────────────────────────
  saveProfile: async () => {
    const { profile } = get();
    set({ isSaving: true });
    try {
      const payload = mapProfileDataToApi(profile);
      await updateProfileApi(payload);
      set({ isDirty: false, isSaving: false });
    } catch (error) {
      console.error('Failed to save profile:', error);
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
  populateFromDashboard: (platforms: ApiPlatformStats[], githubStats?: GithubDashboardStats | null) => {
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
        const data = githubStats ? {
          username: p.username,
          publicRepos: githubStats.repos,
          followers: githubStats.followers,
          following: githubStats.following,
          totalStars: githubStats.totalStars,
          topLanguages: githubStats.topLanguages,
          createdAt: githubStats.lastSyncedAt,
          updatedAt: githubStats.lastSyncedAt,
        } : mapToGithubStats(p);

        Object.assign(gh, { data, loading: false, lastFetchedAt: now });
      }
    }

    set({ leetcode: lc, codeforces: cf, codechef: cc, github: gh });
  },

  // ─── Sync All Platforms ─────────────────────────────────────────────
  fetchAllPlatforms: async () => {
    const { profile } = get();

    set({
      syncState: 'syncing',
      syncMessage: null,
      leetcode: { ...get().leetcode, loading: true, error: null },
      codeforces: { ...get().codeforces, loading: true, error: null },
      codechef: { ...get().codechef, loading: true, error: null },
      github: { ...get().github, loading: true, error: null },
    });

    const getGithubUsername = (url: string) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (!trimmed.includes('/')) return trimmed;
      // Handle https://github.com/username or github.com/username
      return trimmed.split('/').filter(Boolean).pop() || '';
    };

    const platformMap: [string, string][] = [
      ['leetcode', profile.leetcodeUsername],
      ['codeforces', profile.codeforcesUsername],
      ['codechef', profile.codechefUsername],
      ['github', getGithubUsername(profile.githubUrl)],
    ];

    const connectPromises = platformMap
      .filter(([, username]) => username.trim().length > 0)
      .map(([name, username]) => connectPlatform(name, username).catch((err) => {
        console.error(`Failed to connect ${name}:`, err);
        throw err;
      }));

    try {
      await Promise.allSettled(connectPromises);
    } catch {
      // Handled by allSettled below
    }

    // Actually, let's use allSettled to aggregate.
    const results = await Promise.allSettled(connectPromises);
    const failedConnections = results
      .map((r, i) => r.status === 'rejected' ? platformMap[i][0] : null)
      .filter(Boolean);

    let syncSucceeded = false;
    let syncMessage = '';

    if (failedConnections.length > 0) {
      syncMessage = `Connection failed for: ${failedConnections.join(', ')}. `;
    }

    try {
      const response = await syncAllPlatformsApi();
      const data = response?.data?.data;
      if (data?.results) {
        const results = data.results as Array<{ platform: string; success: boolean; error?: string | null }>;
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success);

        if (failed.length === 0) {
          syncMessage += `All ${succeeded} platform(s) synced successfully`;
          syncSucceeded = failedConnections.length === 0;
        } else if (succeeded > 0) {
          syncMessage += `${succeeded}/${results.length} synced. Failed: ${failed.map((f) => f.platform).join(', ')}`;
          syncSucceeded = true; // Partial success
        } else {
          syncMessage += `Sync failed: ${failed.map((f) => `${f.platform}: ${f.error || 'unknown'}`).join('; ')}`;
        }
      } else {
        syncMessage += 'Sync completed';
        syncSucceeded = failedConnections.length === 0;
      }
    } catch (err) {
      syncMessage += err instanceof Error ? err.message : 'Platform sync failed';
    }

    set({
      syncState: syncSucceeded ? 'success' : 'error',
      syncMessage,
      lastSyncedAt: syncSucceeded ? new Date().toISOString() : get().lastSyncedAt,
    });

    const { useDashboardStore } = await import('./dashboardStore');
    useDashboardStore.getState().invalidate();

    window.dispatchEvent(new CustomEvent('devtrack:activity-invalidate'));

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
  const contestData = (p.rawData?.userContestRanking as Record<string, unknown>) || {};
  return {
    username: p.username,
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
    contestGlobalRanking: (contestData.globalRanking as number) || 0,
    totalContests: p.totalContests,
    contestTopPercentage: (contestData.topPercentage as number) || 0,
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
    countryRank: parseInt(String(raw.countryRank || '0'), 10),
    countryName: '',
    totalProblemsSolved: (raw.totalSolved as number) || p.totalSolved,
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
