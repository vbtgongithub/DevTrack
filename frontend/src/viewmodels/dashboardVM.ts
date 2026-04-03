// ============================================================================
// dashboardVM.ts — Dashboard ViewModel
// ============================================================================
// Pure functions ONLY. No React imports. No side effects.
// Transforms raw API data → UI-ready ViewModel shapes.
// ============================================================================

import type {
  ApiDashboardResponse,
  ApiDashboardStats,
  ApiStreakData,
  ApiPlatformStats,
  ApiMission,
  ApiDashboardRecentActivity,
  ApiUser,
} from '../types/api.types';
import type {
  DashboardVM,
  DashboardHeaderVM,
  StreakBannerVM,
  StatsGridVM,
  StatCardVM,
  PlatformSummaryVM,
  MissionPanelVM,
  MissionCardVM,
  RecentActivityVM,
  HeatmapDayVM,
} from '../types/vm.types';
import {
  formatNumber,
  formatGreeting,
  formatFullDate,
  formatTimeAgo,
  formatTimeRemaining,
  formatDate,
  calcPercent,
  getMotivationText,
  capitalize,
  slugToLabel,
  PLATFORM_ICONS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
  MISSION_CATEGORY_ICONS,
} from '../utils/formatters';

// ---------------------------------------------------------------------------
// MAIN TRANSFORMER
// ---------------------------------------------------------------------------

export function transformDashboard(
  apiData: ApiDashboardResponse,
  user: ApiUser | null | undefined,
  now: number = Date.now()
): DashboardVM {
  const hour = new Date(now).getHours();
  const todayIso = new Date(now).toISOString();

  const safeUser: ApiUser = user ?? {
    id: 'unknown',
    email: '',
    username: 'User',
    displayName: 'User',
    avatarUrl: null,
    bio: null,
    timezone: 'UTC',
    joinedAt: todayIso,
    lastActiveAt: todayIso,
    isEmailVerified: false,
    role: 'user',
  };

  const safeStats: ApiDashboardStats = apiData?.stats ?? {
    totalProblems: 0,
    totalSubmissions: 0,
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalProjects: 0,
    totalCommits: 0,
    totalPullRequests: 0,
    totalContributions: 0,
  };

  const safeStreak: ApiStreakData = apiData?.streak ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: todayIso,
    streakStartDate: todayIso,
    isActiveToday: false,
    streakHistory: [],
  };

  const safePlatformStats: ApiPlatformStats[] = Array.isArray(apiData?.platformStats)
    ? apiData.platformStats
    : [];

  const safeMissions: ApiMission[] = Array.isArray(apiData?.missions) ? apiData.missions : [];

  const safeRecentActivity: ApiDashboardRecentActivity[] = Array.isArray(apiData?.recentActivity)
    ? apiData.recentActivity
    : [];

  return {
    header: transformHeader(safeUser, safeStats, hour, todayIso),
    streak: transformStreak(safeStreak),
    stats: transformStats(safeStats),
    platforms: safePlatformStats.map((p) => transformPlatform(p, now)),
    missions: transformMissions(safeMissions, now),
    recentActivity: safeRecentActivity.map((a) => transformRecentActivity(a, now)),
  };
}

// ---------------------------------------------------------------------------
// HEADER
// ---------------------------------------------------------------------------

export function transformHeader(
  user: ApiUser,
  stats: ApiDashboardStats,
  hour: number,
  todayIso: string
): DashboardHeaderVM {
  const displayName = (user.displayName || user.username || 'User').trim() || 'User';

  return {
    greeting: formatGreeting(displayName, hour),
    displayName,
    avatarUrl: user.avatarUrl,
    todayDate: formatFullDate(todayIso),
    quickStats: [
      { label: 'Problems Solved', value: formatNumber(stats.totalProblems), icon: 'code-bracket' },
      { label: 'Current Streak', value: `${stats.currentStreak}`, icon: 'fire' },
      { label: 'Contributions', value: formatNumber(stats.totalContributions), icon: 'chart-bar' },
    ],
  };
}

// ---------------------------------------------------------------------------
// STREAK BANNER
// ---------------------------------------------------------------------------

export function transformStreak(
  streak: ApiStreakData
): StreakBannerVM {
  const percentOfLongest =
    streak.longestStreak > 0
      ? Math.round((streak.currentStreak / streak.longestStreak) * 100)
      : 0;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    streakLabel: `${streak.currentStreak} Day Streak 🔥`,
    isActiveToday: streak.isActiveToday,
    motivationText: getMotivationText(streak.currentStreak, streak.isActiveToday),
    percentOfLongest: Math.min(percentOfLongest, 100),
    streakStartFormatted: formatDate(streak.streakStartDate),
    heatmapDays: streak.streakHistory.map((day) => transformHeatmapDay(day)),
  };
}

export function transformHeatmapDay(day: {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}): HeatmapDayVM {
  const dateObj = new Date(day.date);
  const monthDay = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const tooltip =
    day.count === 0
      ? `No activities on ${monthDay}`
      : `${day.count} ${day.count === 1 ? 'activity' : 'activities'} on ${monthDay}`;

  return {
    date: day.date,
    count: day.count,
    level: day.level,
    tooltip,
  };
}

// ---------------------------------------------------------------------------
// STATS GRID
// ---------------------------------------------------------------------------

export function transformStats(stats: ApiDashboardStats): StatsGridVM {
  const cards: StatCardVM[] = [
    {
      id: 'total-problems',
      label: 'Problems Solved',
      value: formatNumber(stats.totalProblems),
      icon: 'code-bracket',
      trend: null,
      color: '#00B8A3',
    },
    {
      id: 'total-submissions',
      label: 'Submissions',
      value: formatNumber(stats.totalSubmissions),
      icon: 'paper-airplane',
      trend: null,
      color: '#3B82F6',
    },
    {
      id: 'active-days',
      label: 'Active Days',
      value: formatNumber(stats.totalActiveDays),
      icon: 'calendar',
      trend: null,
      color: '#8B5CF6',
    },
    {
      id: 'current-streak',
      label: 'Current Streak',
      value: `${stats.currentStreak}`,
      icon: 'fire',
      trend: null,
      color: '#F59E0B',
    },
    {
      id: 'total-projects',
      label: 'Projects',
      value: formatNumber(stats.totalProjects),
      icon: 'folder',
      trend: null,
      color: '#10B981',
    },
    {
      id: 'total-commits',
      label: 'Commits',
      value: formatNumber(stats.totalCommits),
      icon: 'git-commit',
      trend: null,
      color: '#238636',
    },
  ];

  return { cards };
}

// ---------------------------------------------------------------------------
// PLATFORM SUMMARY
// ---------------------------------------------------------------------------

export function transformPlatform(
  platform: ApiPlatformStats,
  now: number
): PlatformSummaryVM {
  const displayName = capitalize(platform.platformName);
  const icon = PLATFORM_ICONS[platform.platformName] || 'globe';

  const stats: { label: string; value: string }[] = [
    { label: 'Total Solved', value: formatNumber(platform.totalSolved) },
  ];

  if (platform.rating !== null) {
    stats.push({ label: 'Rating', value: formatNumber(platform.rating) });
  }
  if (platform.totalContests > 0) {
    stats.push({ label: 'Contests', value: formatNumber(platform.totalContests) });
  }

  const hasDifficulty = platform.easySolved + platform.mediumSolved + platform.hardSolved > 0;
  const totalByDifficulty = platform.easySolved + platform.mediumSolved + platform.hardSolved;

  return {
    id: platform.platformId,
    name: platform.platformName,
    displayName,
    icon,
    username: platform.username,
    isConnected: platform.isConnected,
    profileUrl: platform.profileUrl,
    stats,
    difficulty: hasDifficulty
      ? {
          easy: {
            solved: platform.easySolved,
            total: platform.easySolved + Math.round(platform.easySolved * 0.5),
            percent: calcPercent(platform.easySolved, totalByDifficulty),
          },
          medium: {
            solved: platform.mediumSolved,
            total: platform.mediumSolved + Math.round(platform.mediumSolved * 0.5),
            percent: calcPercent(platform.mediumSolved, totalByDifficulty),
          },
          hard: {
            solved: platform.hardSolved,
            total: platform.hardSolved + Math.round(platform.hardSolved * 0.5),
            percent: calcPercent(platform.hardSolved, totalByDifficulty),
          },
        }
      : null,
    rating: platform.rating !== null ? formatNumber(platform.rating) : null,
    rank: platform.rank,
    lastSynced: formatTimeAgo(platform.lastSyncedAt, now),
    syncStatusLabel: platform.isConnected ? 'Connected' : 'Not connected',
  };
}

// ---------------------------------------------------------------------------
// MISSIONS
// ---------------------------------------------------------------------------

export function transformMissions(
  missions: ApiMission[],
  now: number
): MissionPanelVM {
  const active = missions.filter((m) => m.status !== 'completed' && m.status !== 'expired');
  const completedToday = missions.filter((m) => m.status === 'completed').length;
  const totalToday = missions.length;

  return {
    title: 'Missions',
    activeMissions: active.map((m) => transformMissionCard(m, now)),
    completedToday,
    totalToday,
    completionPercent: totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0,
  };
}

export function transformMissionCard(
  mission: ApiMission,
  now: number
): MissionCardVM {
  const progress = mission.targetCount > 0
    ? Math.round((mission.currentCount / mission.targetCount) * 100)
    : 0;

  const typeColors: Record<string, string> = {
    daily: '#3B82F6',
    weekly: '#8B5CF6',
    milestone: '#F59E0B',
  };

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    typeLabel: capitalize(mission.type),
    typeBadgeColor: typeColors[mission.type] || '#6B7280',
    statusLabel: slugToLabel(mission.status),
    progress: Math.min(progress, 100),
    progressLabel: `${mission.currentCount}/${mission.targetCount} completed`,
    xpReward: `+${mission.xpReward} XP`,
    timeRemaining:
      mission.status === 'completed'
        ? 'Completed'
        : formatTimeRemaining(mission.expiresAt, now),
    isCompleted: mission.status === 'completed',
    categoryIcon: MISSION_CATEGORY_ICONS[mission.category] || 'star',
  };
}

// ---------------------------------------------------------------------------
// RECENT ACTIVITY
// ---------------------------------------------------------------------------

export function transformRecentActivity(
  activity: ApiDashboardRecentActivity,
  now: number
): RecentActivityVM {
  return {
    id: activity.id,
    icon: ACTIVITY_TYPE_ICONS[activity.type] || 'bolt',
    title: activity.title,
    description: activity.description,
    platformLabel: capitalize(activity.platform),
    timeAgo: formatTimeAgo(activity.occurredAt, now),
    url: activity.url,
    typeColor: ACTIVITY_TYPE_COLORS[activity.type] || '#6B7280',
  };
}
