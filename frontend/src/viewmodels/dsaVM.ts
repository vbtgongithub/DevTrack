// ============================================================================
// dsaVM.ts — DSA Tracker ViewModel
// ============================================================================
// Pure functions ONLY. No React imports. No side effects.
// ============================================================================

import type {
  ApiDsaListResponse,
  ApiDsaProblem,
  ApiDsaStats,
  ApiDsaCategory,
  ApiDsaWeeklyProgress,
} from '../types/api.types';
import type {
  DsaPageVM,
  DsaStatsVM,
  DsaProblemTableVM,
  DsaProblemRowVM,
  DsaCategoryVM,
  DsaFilterOptionsVM,
  DsaProgressVM,
  DsaDifficultyStatVM,
} from '../types/vm.types';
import {
  formatNumber,
  formatDuration,
  formatTimeAgo,
  formatDateRange,
  calcPercent,
  capitalize,
  DIFFICULTY_COLORS,
  STATUS_COLORS,
  PLATFORM_ICONS,
  PROBLEM_STATUS_ICONS,
} from '../utils/formatters';

// ---------------------------------------------------------------------------
// MAIN TRANSFORMER
// ---------------------------------------------------------------------------

export function transformDsaPage(
  apiData: ApiDsaListResponse,
  now: number = Date.now()
): DsaPageVM {
  return {
    stats: transformDsaStats(apiData.stats),
    problems: transformProblemTable(apiData.problems, apiData.pagination, now),
    categories: apiData.stats.categories.map(transformCategory),
    filters: buildDsaFilterOptions(apiData.stats.categories),
    progress: transformProgress(apiData.stats.weeklyProgress),
  };
}

// ---------------------------------------------------------------------------
// STATS
// ---------------------------------------------------------------------------

export function transformDsaStats(stats: ApiDsaStats): DsaStatsVM {
  const makeDifficulty = (
    label: string,
    solved: number,
    total: number,
    color: string
  ): DsaDifficultyStatVM => ({
    solved,
    total,
    percent: calcPercent(solved, total),
    label: `${label}: ${solved}/${total}`,
    color,
  });

  return {
    totalSolved: formatNumber(stats.totalSolved),
    totalProblems: formatNumber(stats.totalProblems),
    solvedPercent: calcPercent(stats.totalSolved, stats.totalProblems),
    difficulties: {
      easy: makeDifficulty('Easy', stats.easySolved, stats.easyTotal, DIFFICULTY_COLORS.easy),
      medium: makeDifficulty('Medium', stats.mediumSolved, stats.mediumTotal, DIFFICULTY_COLORS.medium),
      hard: makeDifficulty('Hard', stats.hardSolved, stats.hardTotal, DIFFICULTY_COLORS.hard),
    },
    avgTime: formatDuration(stats.averageTime),
    fastestSolve: formatDuration(stats.fastestSolve),
    totalAttempted: formatNumber(stats.totalAttempted),
    totalRevisit: formatNumber(stats.totalRevisit),
  };
}

// ---------------------------------------------------------------------------
// PROBLEM TABLE
// ---------------------------------------------------------------------------

export function transformProblemTable(
  problems: ApiDsaProblem[],
  pagination: { page: number; totalPages: number; totalItems: number; hasNextPage: boolean },
  now: number
): DsaProblemTableVM {
  return {
    rows: problems.map((p) => transformProblemRow(p, now)),
    hasMore: pagination.hasNextPage,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
  };
}

export function transformProblemRow(
  problem: ApiDsaProblem,
  now: number
): DsaProblemRowVM {
  return {
    id: problem.id,
    title: problem.title,
    platform: capitalize(problem.platform),
    platformIcon: PLATFORM_ICONS[problem.platform] || 'globe',
    difficulty: capitalize(problem.difficulty),
    difficultyColor: DIFFICULTY_COLORS[problem.difficulty] || '#6B7280',
    category: problem.category,
    tags: problem.tags,
    statusLabel: capitalize(problem.status),
    statusIcon: PROBLEM_STATUS_ICONS[problem.status] || 'circle',
    statusColor: STATUS_COLORS[problem.status] || '#6B7280',
    timeTaken: problem.timeTaken !== null ? formatDuration(problem.timeTaken) : null,
    lastSubmitted: problem.lastSubmittedAt
      ? formatTimeAgo(problem.lastSubmittedAt, now)
      : null,
    isFavorite: problem.isFavorite,
    url: problem.url,
    notes: problem.notes,
    submissionCount: problem.submissionCount,
  };
}

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export function transformCategory(category: ApiDsaCategory): DsaCategoryVM {
  return {
    name: category.name,
    slug: category.slug,
    solved: category.solvedCount,
    total: category.totalProblems,
    percent: calcPercent(category.solvedCount, category.totalProblems),
    difficulties: {
      easy: { solved: category.easySolved, total: category.easyCount },
      medium: { solved: category.mediumSolved, total: category.mediumCount },
      hard: { solved: category.hardSolved, total: category.hardCount },
    },
    progressLabel: `${category.solvedCount}/${category.totalProblems} solved`,
  };
}

// ---------------------------------------------------------------------------
// PROGRESS
// ---------------------------------------------------------------------------

export function transformProgress(
  weeklyData: ApiDsaWeeklyProgress[]
): DsaProgressVM {
  const mapped = weeklyData.map((w) => ({
    weekLabel: formatDateRange(w.weekStart, w.weekEnd),
    easy: w.easySolved,
    medium: w.mediumSolved,
    hard: w.hardSolved,
    total: w.totalSolved,
  }));

  // Calculate trend from last 2 weeks
  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  let trendLabel = 'No change';

  if (mapped.length >= 2) {
    const current = mapped[mapped.length - 1].total;
    const previous = mapped[mapped.length - 2].total;

    if (previous > 0) {
      const change = ((current - previous) / previous) * 100;
      if (change > 0) {
        trendDirection = 'up';
        trendLabel = `+${Math.round(change)}% vs last week`;
      } else if (change < 0) {
        trendDirection = 'down';
        trendLabel = `${Math.round(change)}% vs last week`;
      }
    } else if (current > 0) {
      trendDirection = 'up';
      trendLabel = 'New activity this week';
    }
  }

  return {
    weeklyData: mapped,
    trendDirection,
    trendLabel,
  };
}

// ---------------------------------------------------------------------------
// FILTER OPTIONS
// ---------------------------------------------------------------------------

export function buildDsaFilterOptions(
  categories: ApiDsaCategory[]
): DsaFilterOptionsVM {
  return {
    difficulties: [
      { value: '', label: 'All Difficulties' },
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
    ],
    statuses: [
      { value: '', label: 'All Statuses' },
      { value: 'solved', label: 'Solved' },
      { value: 'attempted', label: 'Attempted' },
      { value: 'unsolved', label: 'Unsolved' },
      { value: 'revisit', label: 'Revisit' },
    ],
    categories: [
      { value: '', label: 'All Categories' },
      ...categories.map((c) => ({
        value: c.slug,
        label: `${c.name} (${c.solvedCount}/${c.totalProblems})`,
      })),
    ],
    platforms: [
      { value: '', label: 'All Platforms' },
      { value: 'leetcode', label: 'LeetCode' },
      { value: 'codeforces', label: 'Codeforces' },
      { value: 'hackerrank', label: 'HackerRank' },
      { value: 'codechef', label: 'CodeChef' },
    ],
    sortOptions: [
      { value: 'title', label: 'Title' },
      { value: 'difficulty', label: 'Difficulty' },
      { value: 'lastSubmittedAt', label: 'Last Submitted' },
      { value: 'solvedAt', label: 'Solved Date' },
      { value: 'timeTaken', label: 'Time Taken' },
    ],
  };
}
