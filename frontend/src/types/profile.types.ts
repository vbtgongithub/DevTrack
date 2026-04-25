// ============================================================================
// profile.types.ts — Profile Page Types
// ============================================================================
// Types for the profile page: personal info, career goals, CP platform stats.
// ============================================================================

// ---------------------------------------------------------------------------
// 1. PROFILE DATA (persisted to localStorage)
// ---------------------------------------------------------------------------

export interface ProfileData {
  fullName: string;
  email: string;
  role: string;
  bio: string;

  // Career Goals
  targetRole: string;
  targetCompanies: string;
  techStack: string[];

  // Social Links
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;

  // CP Platform Usernames
  leetcodeUsername: string;
  codeforcesUsername: string;
  codechefUsername: string;
  hackerrankUsername: string;
}

export const DEFAULT_PROFILE: ProfileData = {
  fullName: '',
  email: '',
  role: 'Full Stack Developer',
  bio: '',
  targetRole: '',
  targetCompanies: '',
  techStack: [],
  githubUrl: '',
  linkedinUrl: '',
  portfolioUrl: '',
  leetcodeUsername: '',
  codeforcesUsername: '',
  codechefUsername: '',
  hackerrankUsername: '',
};

// ---------------------------------------------------------------------------
// 2. LEETCODE STATS (from alfa-leetcode-api)
// ---------------------------------------------------------------------------

export interface LeetCodeStats {
  solvedProblem: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  acceptanceRate: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;

  // Contest
  contestRating: number;
  contestGlobalRanking: number;
  totalContests: number;
  contestTopPercentage: number;
}

export const EMPTY_LEETCODE_STATS: LeetCodeStats = {
  solvedProblem: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  totalEasy: 0,
  totalMedium: 0,
  totalHard: 0,
  acceptanceRate: 0,
  ranking: 0,
  contributionPoints: 0,
  reputation: 0,
  contestRating: 0,
  contestGlobalRanking: 0,
  totalContests: 0,
  contestTopPercentage: 0,
};

// ---------------------------------------------------------------------------
// 3. CODEFORCES STATS (from codeforces.com/api)
// ---------------------------------------------------------------------------

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  avatar: string;
  contribution: number;
  friendOfCount: number;
  organization: string;
  registrationTimeSeconds: number;
  totalSolved: number;
  totalContests: number;
}

export const EMPTY_CODEFORCES_STATS: CodeforcesStats = {
  handle: '',
  rating: 0,
  maxRating: 0,
  rank: 'unrated',
  maxRank: 'unrated',
  avatar: '',
  contribution: 0,
  friendOfCount: 0,
  organization: '',
  registrationTimeSeconds: 0,
  totalSolved: 0,
  totalContests: 0,
};

// ---------------------------------------------------------------------------
// 4. CODECHEF STATS (from community scraper API)
// ---------------------------------------------------------------------------

export interface CodeChefStats {
  name: string;
  currentRating: number;
  highestRating: number;
  stars: string;
  globalRank: number;
  countryRank: number;
  countryName: string;
  totalProblemsSolved: number;
}

export const EMPTY_CODECHEF_STATS: CodeChefStats = {
  name: '',
  currentRating: 0,
  highestRating: 0,
  stars: '0★',
  globalRank: 0,
  countryRank: 0,
  countryName: '',
  totalProblemsSolved: 0,
};

// ---------------------------------------------------------------------------
// 5. HACKERRANK STATS
// ---------------------------------------------------------------------------

export interface HackerRankStats {
  username: string;
  totalSolved: number;
  totalContests: number;
  badges: number;
  certificates: number;
  level: string;
  score: number;
}

export const EMPTY_HACKERRANK_STATS: HackerRankStats = {
  username: '',
  totalSolved: 0,
  totalContests: 0,
  badges: 0,
  certificates: 0,
  level: '—',
  score: 0,
};

// ---------------------------------------------------------------------------
// 6. PLATFORM STATE (per-platform loading / error)
// ---------------------------------------------------------------------------

export type PlatformName = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';

export interface PlatformState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
}

export interface AllPlatformStats {
  leetcode: PlatformState<LeetCodeStats>;
  codeforces: PlatformState<CodeforcesStats>;
  codechef: PlatformState<CodeChefStats>;
  hackerrank: PlatformState<HackerRankStats>;
}

export const EMPTY_PLATFORM_STATE = <T>(): PlatformState<T> => ({
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
});
