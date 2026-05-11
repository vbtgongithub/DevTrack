// ============================================================================
// vm.types.ts — ViewModel Types
// ============================================================================
// These types represent the TRANSFORMED data shapes consumed by UI components.
// ViewModels are the bridge between raw API data and what the UI needs.
// All fields are pre-computed, formatted, and ready-to-render.
// ============================================================================

// ---------------------------------------------------------------------------
// 1. COMMON VM TYPES
// ---------------------------------------------------------------------------

export type DataStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DataState<T> {
  data: T | null;
  status: DataStatus;
  error: string | null;
  lastFetchedAt: number | null; // unix timestamp ms
}

export interface HookReturn<T> {
  data: T | null;
  status: DataStatus;
  error: string | null;
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// 2. DASHBOARD VM TYPES
// ---------------------------------------------------------------------------

export interface DashboardVM {
  header: DashboardHeaderVM;
  streak: StreakBannerVM;
  stats: StatsGridVM;
  platforms: PlatformSummaryVM[];
  missions: MissionPanelVM;
  recentActivity: RecentActivityVM[];
}

export interface DashboardHeaderVM {
  greeting: string;           // "Good morning, Varshith"
  displayName: string;
  avatarUrl: string | null;
  todayDate: string;          // "Thursday, April 3, 2026"
  quickStats: {
    label: string;
    value: string;
    icon: string;
  }[];
}

export interface StreakBannerVM {
  currentStreak: number;
  longestStreak: number;
  streakLabel: string;           // "12 Day Streak 🔥"
  isActiveToday: boolean;
  motivationText: string;        // "Keep going! You're on fire!"
  percentOfLongest: number;      // 0-100
  streakStartFormatted: string;  // "Mar 22, 2026"
  heatmapDays: HeatmapDayVM[];
}

export interface HeatmapDayVM {
  date: string;           // "2026-04-03"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  tooltip: string;        // "3 activities on Apr 3"
}

export interface StatsGridVM {
  cards: StatCardVM[];
}

export interface StatCardVM {
  id: string;
  label: string;
  value: string;          // pre-formatted: "247", "1.2K"
  icon: string;
  trend: StatTrendVM | null;
  color: string;          // CSS color token
}

export interface StatTrendVM {
  direction: 'up' | 'down' | 'flat';
  value: string;          // "+12%"
  label: string;          // "vs last week"
}

export interface PlatformSummaryVM {
  id: string;
  name: string;
  displayName: string;     // "LeetCode"
  icon: string;
  username: string;
  isConnected: boolean;
  profileUrl: string;
  stats: {
    label: string;
    value: string;
  }[];
  difficulty: {
    easy: { solved: number; total: number; percent: number };
    medium: { solved: number; total: number; percent: number };
    hard: { solved: number; total: number; percent: number };
  } | null;
  rating: string | null;
  rank: string | null;
  lastSynced: string;     // "2 hours ago"
  syncStatusLabel: string;
}

export interface MissionPanelVM {
  title: string;
  activeMissions: MissionCardVM[];
  completedToday: number;
  totalToday: number;
  completionPercent: number;
}

export interface MissionCardVM {
  id: string;
  title: string;
  description: string;
  typeLabel: string;       // "Daily", "Weekly", "Milestone"
  typeBadgeColor: string;
  statusLabel: string;
  progress: number;        // 0-100
  progressLabel: string;   // "3/5 completed"
  xpReward: string;        // "+50 XP"
  timeRemaining: string;   // "2h 30m left" or "Completed"
  isCompleted: boolean;
  categoryIcon: string;
}

export interface RecentActivityVM {
  id: string;
  icon: string;
  title: string;
  description: string;
  platformLabel: string;
  timeAgo: string;         // "2 hours ago"
  url: string | null;
  typeColor: string;
}

// ---------------------------------------------------------------------------
// 4. DSA TRACKER VM TYPES
// ---------------------------------------------------------------------------

export interface DsaPageVM {
  stats: DsaStatsVM;
  problems: DsaProblemTableVM;
  categories: DsaCategoryVM[];
  filters: DsaFilterOptionsVM;
  progress: DsaProgressVM;
}

export interface DsaStatsVM {
  totalSolved: string;       // "247"
  totalProblems: string;     // "500"
  solvedPercent: number;     // 49.4
  difficulties: {
    easy: DsaDifficultyStatVM;
    medium: DsaDifficultyStatVM;
    hard: DsaDifficultyStatVM;
  };
  avgTime: string;           // "12m 34s"
  fastestSolve: string;     // "1m 02s"
  totalAttempted: string;
  totalRevisit: string;
}

export interface DsaDifficultyStatVM {
  solved: number;
  total: number;
  percent: number;
  label: string;             // "Easy: 120/200"
  color: string;
}

export interface DsaProblemTableVM {
  rows: DsaProblemRowVM[];
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface DsaProblemRowVM {
  id: string;
  title: string;
  platform: string;
  platformIcon: string;
  difficulty: string;
  difficultyColor: string;
  category: string;
  tags: string[];
  statusLabel: string;
  statusIcon: string;
  statusColor: string;
  timeTaken: string | null;  // "12m 34s" or null
  lastSubmitted: string | null; // "2 days ago"
  isFavorite: boolean;
  url: string;
  notes: string | null;
  submissionCount: number;
}

export interface DsaCategoryVM {
  name: string;
  slug: string;
  solved: number;
  total: number;
  percent: number;
  difficulties: {
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
  progressLabel: string;   // "45/80 solved"
}

export interface DsaFilterOptionsVM {
  difficulties: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  platforms: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

export interface DsaProgressVM {
  weeklyData: {
    weekLabel: string;       // "Mar 24 – Mar 30"
    easy: number;
    medium: number;
    hard: number;
    total: number;
  }[];
  trendDirection: 'up' | 'down' | 'flat';
  trendLabel: string;       // "+15% vs last week"
}

// ---------------------------------------------------------------------------
// 5. PROJECTS VM TYPES
// ---------------------------------------------------------------------------

export interface ProjectsPageVM {
  stats: ProjectsStatsVM;
  projects: ProjectCardVM[];
  filters: ProjectsFilterOptionsVM;
  pagination: {
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ProjectsStatsVM {
  total: string;
  active: string;
  completed: string;
  totalCommits: string;
  totalPRs: string;
  totalIssues: string;
  topLanguages: { language: string; percent: number; color: string }[];
  commitHistory: { date: string; count: number }[];
}

export interface ProjectCardVM {
  id: string;
  name: string;
  description: string;
  status: string;
  statusColor: string;
  statusLabel: string;
  visibility: string;
  visibilityIcon: string;
  language: string;
  languageColor: string;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  thumbnailUrl: string | null;
  stars: string;
  forks: string;
  openIssues: string;
  lastCommit: string | null;     // "2 days ago"
  lastCommitMsg: string | null;
  updatedAgo: string;            // "3 days ago"
  milestonesProgress: {
    completed: number;
    total: number;
    percent: number;
  } | null;
}

export interface ProjectsFilterOptionsVM {
  statuses: { value: string; label: string }[];
  visibilities: { value: string; label: string }[];
  languages: { value: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

export interface ProjectDetailVM {
  id: string;
  name: string;
  description: string;
  status: string;
  statusColor: string;
  visibility: string;
  language: string;
  languageColor: string;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  thumbnailUrl: string | null;
  stars: string;
  forks: string;
  totalCommits: string;
  totalPRs: string;
  totalIssues: string;
  openIssues: string;
  lastCommit: string | null;
  lastCommitMsg: string | null;
  contributors: ProjectContributorVM[];
  milestones: ProjectMilestoneVM[];
  tasks: ProjectTaskVM[];
  createdFormatted: string;
  updatedFormatted: string;
}

export interface ProjectContributorVM {
  id: string;
  username: string;
  avatarUrl: string;
  contributions: string;
}

export interface ProjectMilestoneVM {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  dueDate: string | null;
  progress: number;
  progressLabel: string;  // "3/5 tasks"
  isOverdue: boolean;
}

export interface ProjectTaskVM {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  priorityLabel: string;
  priorityColor: string;
  priorityIcon: string;
  labels: string[];
  assignee: string | null;
  dueDate: string | null;
  isOverdue: boolean;
}

// ---------------------------------------------------------------------------
// 6. SETTINGS VM TYPES
// ---------------------------------------------------------------------------

export interface SettingsPageVM {
  profile: SettingsProfileVM;
  platforms: SettingsPlatformVM[];
  notifications: SettingsNotificationsVM;
  appearance: SettingsAppearanceVM;
  privacy: SettingsPrivacyVM;
  activeTab: string;
}

export interface SettingsProfileVM {
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string;
  timezone: string;
  joinedFormatted: string;    // "Joined January 2025"
  socialLinks: {
    platform: string;
    label: string;
    url: string;
    icon: string;
    isSet: boolean;
  }[];
}

export interface SettingsPlatformVM {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  username: string;
  isConnected: boolean;
  lastSynced: string | null;  // "2 hours ago"
  syncStatusLabel: string;
  syncStatusColor: string;
  profileUrl: string;
}

export interface SettingsNotificationsVM {
  groups: {
    title: string;
    items: {
      key: string;
      label: string;
      description: string;
      enabled: boolean;
    }[];
  }[];
}

export interface SettingsAppearanceVM {
  currentTheme: string;
  themes: { value: string; label: string; icon: string }[];
  accentColor: string;
  accentOptions: { value: string; label: string; swatch: string }[];
  compactMode: boolean;
  showHeatmap: boolean;
  heatmapColor: string;
  heatmapColorOptions: { value: string; label: string; swatch: string }[];
  language: string;
  languageOptions: { value: string; label: string }[];
}

export interface SettingsPrivacyVM {
  items: {
    key: string;
    label: string;
    description: string;
    type: 'toggle' | 'select';
    value: boolean | string;
    options?: { value: string; label: string }[];
  }[];
}

// ---------------------------------------------------------------------------
// 7. LAYOUT / UI VM TYPES
// ---------------------------------------------------------------------------

export interface SidebarNavItemVM {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge: string | null;
  isActive: boolean;
}

export interface TopbarVM {
  displayName: string;
  avatarUrl: string | null;
  currentPageTitle: string;
  breadcrumbs: { label: string; path: string }[];
  notifications: number;
}
