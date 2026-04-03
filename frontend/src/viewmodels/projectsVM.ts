// ============================================================================
// projectsVM.ts — Projects ViewModel
// ============================================================================
// Pure functions ONLY. No React imports. No side effects.
// ============================================================================

import type {
  ApiProjectListResponse,
  ApiProject,
  ApiProjectStats,
  ApiProjectTask,
  ApiProjectMilestone,
  ApiProjectContributor,
} from '../types/api.types';
import type {
  ProjectsPageVM,
  ProjectsStatsVM,
  ProjectCardVM,
  ProjectsFilterOptionsVM,
  ProjectDetailVM,
  ProjectContributorVM,
  ProjectMilestoneVM,
  ProjectTaskVM,
} from '../types/vm.types';
import {
  formatNumber,
  formatTimeAgo,
  formatDate,
  calcPercent,
  capitalize,
  slugToLabel,
  truncate,
  PROJECT_STATUS_COLORS,
  PRIORITY_COLORS,
  LANGUAGE_COLORS,
  TASK_STATUS_ICONS,
} from '../utils/formatters';

// ---------------------------------------------------------------------------
// MAIN TRANSFORMER
// ---------------------------------------------------------------------------

export function transformProjectsPage(
  apiData: ApiProjectListResponse,
  now: number = Date.now()
): ProjectsPageVM {
  return {
    stats: transformProjectStats(apiData.stats),
    projects: apiData.projects.map((p) => transformProjectCard(p, now)),
    filters: buildProjectFilterOptions(apiData.stats),
    pagination: {
      hasMore: apiData.pagination.hasNextPage,
      currentPage: apiData.pagination.page,
      totalPages: apiData.pagination.totalPages,
      totalItems: apiData.pagination.totalItems,
    },
  };
}

// ---------------------------------------------------------------------------
// STATS
// ---------------------------------------------------------------------------

export function transformProjectStats(stats: ApiProjectStats): ProjectsStatsVM {
  const totalLang = Object.values(stats.languageDistribution).reduce(
    (sum, v) => sum + v,
    0
  );

  return {
    total: formatNumber(stats.totalProjects),
    active: formatNumber(stats.activeProjects),
    completed: formatNumber(stats.completedProjects),
    totalCommits: formatNumber(stats.totalCommits),
    totalPRs: formatNumber(stats.totalPullRequests),
    totalIssues: formatNumber(stats.totalIssues),
    topLanguages: Object.entries(stats.languageDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([language, count]) => ({
        language,
        percent: calcPercent(count, totalLang),
        color: LANGUAGE_COLORS[language] || '#6B7280',
      })),
    commitHistory: stats.commitHistory.map((d) => ({
      date: d.date,
      count: d.count,
    })),
  };
}

// ---------------------------------------------------------------------------
// PROJECT CARD
// ---------------------------------------------------------------------------

export function transformProjectCard(
  project: ApiProject,
  now: number
): ProjectCardVM {
  const hasMilestones = project.milestones.length > 0;
  const completedMilestones = project.milestones.filter(
    (m) => m.status === 'completed'
  ).length;

  return {
    id: project.id,
    name: project.name,
    description: truncate(project.description, 120),
    status: project.status,
    statusColor: PROJECT_STATUS_COLORS[project.status] || '#6B7280',
    statusLabel: slugToLabel(project.status),
    visibility: project.visibility,
    visibilityIcon: project.visibility === 'public' ? 'globe' : 'lock-closed',
    language: project.language,
    languageColor: LANGUAGE_COLORS[project.language] || '#6B7280',
    techStack: project.techStack,
    repoUrl: project.repoUrl,
    liveUrl: project.liveUrl,
    thumbnailUrl: project.thumbnailUrl,
    stars: formatNumber(project.stars),
    forks: formatNumber(project.forks),
    openIssues: formatNumber(project.openIssues),
    lastCommit: project.lastCommitAt
      ? formatTimeAgo(project.lastCommitAt, now)
      : null,
    lastCommitMsg: project.lastCommitMessage
      ? truncate(project.lastCommitMessage, 60)
      : null,
    updatedAgo: formatTimeAgo(project.updatedAt, now),
    milestonesProgress: hasMilestones
      ? {
          completed: completedMilestones,
          total: project.milestones.length,
          percent: calcPercent(completedMilestones, project.milestones.length),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// PROJECT DETAIL
// ---------------------------------------------------------------------------

export function transformProjectDetail(
  project: ApiProject,
  tasks: ApiProjectTask[],
  now: number = Date.now()
): ProjectDetailVM {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    statusColor: PROJECT_STATUS_COLORS[project.status] || '#6B7280',
    visibility: project.visibility,
    language: project.language,
    languageColor: LANGUAGE_COLORS[project.language] || '#6B7280',
    techStack: project.techStack,
    repoUrl: project.repoUrl,
    liveUrl: project.liveUrl,
    thumbnailUrl: project.thumbnailUrl,
    stars: formatNumber(project.stars),
    forks: formatNumber(project.forks),
    totalCommits: formatNumber(project.totalCommits),
    totalPRs: formatNumber(project.totalPullRequests),
    totalIssues: formatNumber(project.totalIssues),
    openIssues: formatNumber(project.openIssues),
    lastCommit: project.lastCommitAt
      ? formatTimeAgo(project.lastCommitAt, now)
      : null,
    lastCommitMsg: project.lastCommitMessage,
    contributors: project.contributors.map(transformContributor),
    milestones: project.milestones.map((m) => transformMilestone(m, now)),
    tasks: tasks.map((t) => transformTask(t, now)),
    createdFormatted: formatDate(project.createdAt),
    updatedFormatted: formatDate(project.updatedAt),
  };
}

export function transformContributor(
  contributor: ApiProjectContributor
): ProjectContributorVM {
  return {
    id: contributor.id,
    username: contributor.username,
    avatarUrl: contributor.avatarUrl,
    contributions: formatNumber(contributor.contributions),
  };
}

export function transformMilestone(
  milestone: ApiProjectMilestone,
  now: number
): ProjectMilestoneVM {
  const progress = milestone.taskCount > 0
    ? calcPercent(milestone.completedTaskCount, milestone.taskCount)
    : 0;

  const isOverdue =
    milestone.dueDate !== null &&
    milestone.status !== 'completed' &&
    new Date(milestone.dueDate).getTime() < now;

  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    statusLabel: capitalize(milestone.status),
    statusColor: PROJECT_STATUS_COLORS[milestone.status] || '#6B7280',
    dueDate: milestone.dueDate ? formatDate(milestone.dueDate) : null,
    progress,
    progressLabel: `${milestone.completedTaskCount}/${milestone.taskCount} tasks`,
    isOverdue,
  };
}

export function transformTask(
  task: ApiProjectTask,
  now: number
): ProjectTaskVM {
  const isOverdue =
    task.dueDate !== null &&
    task.status !== 'done' &&
    new Date(task.dueDate).getTime() < now;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    statusLabel: slugToLabel(task.status),
    statusColor: PROJECT_STATUS_COLORS[task.status] || '#6B7280',
    statusIcon: TASK_STATUS_ICONS[task.status] || 'circle',
    priorityLabel: capitalize(task.priority),
    priorityColor: PRIORITY_COLORS[task.priority] || '#6B7280',
    priorityIcon:
      task.priority === 'critical'
        ? 'exclamation-triangle'
        : task.priority === 'high'
        ? 'arrow-up'
        : task.priority === 'medium'
        ? 'minus'
        : 'arrow-down',
    labels: task.labels,
    assignee: task.assigneeId,
    dueDate: task.dueDate ? formatDate(task.dueDate) : null,
    isOverdue,
  };
}

// ---------------------------------------------------------------------------
// FILTER OPTIONS
// ---------------------------------------------------------------------------

export function buildProjectFilterOptions(
  stats: ApiProjectStats
): ProjectsFilterOptionsVM {
  const languages = Object.keys(stats.languageDistribution).sort();

  return {
    statuses: [
      { value: '', label: 'All Statuses' },
      { value: 'planning', label: 'Planning' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'archived', label: 'Archived' },
    ],
    visibilities: [
      { value: '', label: 'All' },
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
    languages: [
      { value: '', label: 'All Languages' },
      ...languages.map((l) => ({ value: l, label: l })),
    ],
    sortOptions: [
      { value: 'updatedAt', label: 'Recently Updated' },
      { value: 'createdAt', label: 'Recently Created' },
      { value: 'name', label: 'Name' },
      { value: 'stars', label: 'Stars' },
      { value: 'lastCommitAt', label: 'Last Commit' },
    ],
  };
}
