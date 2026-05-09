// ============================================================================
// activityVM.ts — Activity ViewModel
// ============================================================================
// Pure functions ONLY. No React imports. No side effects.
// ============================================================================

import type {
  ApiActivityHeatmapResponse,
  ApiActivityFeedResponse,
  ApiActivityEntry,
  ApiActivitySummary,
} from '../types/api.types';
import type {
  ActivityPageVM,
  ActivityHeatmapVM,
  ActivityFeedVM,
  ActivityFeedItemVM,
  ActivitySummaryVM,
  ActivityFilterOptionsVM,
  HeatmapDayVM,
} from '../types/vm.types';
import {
  formatNumber,
  formatTimeAgo,
  formatDate,
  capitalize,
  slugToLabel,
  calcPercent,
  PLATFORM_COLORS,
  PLATFORM_ICONS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from '../utils/formatters';

// ---------------------------------------------------------------------------
// MAIN TRANSFORMER
// ---------------------------------------------------------------------------

export function transformActivityPage(
  heatmapData: ApiActivityHeatmapResponse,
  feedData: ApiActivityFeedResponse,
  now: number = Date.now()
): ActivityPageVM {
  return {
    heatmap: transformHeatmap(heatmapData),
    feed: transformFeed(feedData, now),
    summary: transformSummary(heatmapData.summary),
    filters: buildFilterOptions(),
  };
}

// ---------------------------------------------------------------------------
// HEATMAP
// ---------------------------------------------------------------------------

export function transformHeatmap(
  data: ApiActivityHeatmapResponse
): ActivityHeatmapVM {
  const totalContributions = data.days.reduce((sum, d) => sum + d.count, 0);

  return {
    year: data.year,
    days: data.days.map((day) => {
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
      } satisfies HeatmapDayVM;
    }),
    monthLabels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    weekdayLabels: ['Mon', 'Wed', 'Fri'],
    totalContributions: `${formatNumber(totalContributions)} contributions in ${data.year}`,
    legendLevels: [
      { label: 'Less', level: 0 },
      { label: '', level: 1 },
      { label: '', level: 2 },
      { label: '', level: 3 },
      { label: 'More', level: 4 },
    ],
  };
}

// ---------------------------------------------------------------------------
// FEED
// ---------------------------------------------------------------------------

export function transformFeed(
  data: ApiActivityFeedResponse,
  now: number
): ActivityFeedVM {
  return {
    items: data.activities.map((a) => transformFeedItem(a, now)),
    hasMore: data.pagination.hasNextPage,
    currentPage: data.pagination.page,
    totalPages: data.pagination.totalPages,
  };
}

export function transformFeedItem(
  entry: ApiActivityEntry,
  now: number
): ActivityFeedItemVM {
  return {
    id: entry.id,
    icon: ACTIVITY_TYPE_ICONS[entry.type] || 'bolt',
    title: entry.title,
    description: entry.description,
    platform: capitalize(entry.platform),
    platformIcon: PLATFORM_ICONS[entry.platform] || 'globe',
    tags: entry.tags,
    url: entry.url,
    timeAgo: formatTimeAgo(entry.occurredAt, now),
    dateFormatted: formatDate(entry.occurredAt),
    typeLabel: slugToLabel(entry.type),
    typeColor: ACTIVITY_TYPE_COLORS[entry.type] || '#6B7280',
  };
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------

export function transformSummary(
  summary: ApiActivitySummary
): ActivitySummaryVM {
  const totalByPlatform = Object.values(summary.byPlatform).reduce(
    (sum, v) => sum + v,
    0
  );
  const totalByType = Object.values(summary.byType).reduce(
    (sum, v) => sum + v,
    0
  );

  return {
    totalActivities: formatNumber(summary.totalActivities),
    activeDays: formatNumber(summary.totalActiveDays),
    currentStreak: `${summary.currentStreak}`,
    longestStreak: `${summary.longestStreak}`,
    mostActiveDay: summary.mostActiveDay,
    avgPerDay: summary.avgPerDay.toFixed(1),
    platformBreakdown: Object.entries(summary.byPlatform).map(
      ([platform, count]) => ({
        platform: capitalize(platform),
        count: formatNumber(count),
        percent: calcPercent(count, totalByPlatform),
        color: PLATFORM_COLORS[platform] || '#6B7280',
      })
    ),
    typeBreakdown: Object.entries(summary.byType).map(([type, count]) => ({
      type,
      label: slugToLabel(type),
      count: formatNumber(count),
      percent: calcPercent(count, totalByType),
      color: ACTIVITY_TYPE_COLORS[type] || '#6B7280',
    })),
  };
}

// ---------------------------------------------------------------------------
// FILTER OPTIONS (static, never change)
// ---------------------------------------------------------------------------

export function buildFilterOptions(): ActivityFilterOptionsVM {
  return {
    platforms: [
      { value: '', label: 'All Platforms' },
      { value: 'leetcode', label: 'LeetCode' },
      { value: 'codeforces', label: 'Codeforces' },
      { value: 'github', label: 'GitHub' },
      { value: 'hackerrank', label: 'HackerRank' },
      { value: 'codechef', label: 'CodeChef' },
    ],
    types: [
      { value: '', label: 'All Types' },
      { value: 'problem_solved', label: 'Problem Solved' },
      { value: 'commit_pushed', label: 'Commit Pushed' },
      { value: 'pr_merged', label: 'PR Merged' },
      { value: 'project_created', label: 'Project Created' },
      { value: 'project_updated', label: 'Project Updated' },
      { value: 'project_deleted', label: 'Project Deleted' },
      { value: 'contest_participated', label: 'Contest Participated' },
      { value: 'contest_joined', label: 'Contest Joined' },
      { value: 'streak_milestone', label: 'Streak Milestone' },
      { value: 'github_sync_completed', label: 'GitHub Sync' },
      { value: 'settings_updated', label: 'Settings Updated' },
    ],
    dateRanges: [
      { value: '', label: 'All Time' },
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' },
      { value: '90d', label: 'Last 90 Days' },
      { value: '1y', label: 'Last Year' },
    ],
  };
}
