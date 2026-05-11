// ============================================================================
// formatters.ts — Pure Formatting Utilities
// ============================================================================
// All formatting functions are PURE — no side effects, no state.
// Used exclusively by ViewModels to transform API data into display strings.
// ============================================================================

// ---------------------------------------------------------------------------
// NUMBER FORMATTING
// ---------------------------------------------------------------------------

/**
 * Format a number with compact notation for large values.
 * 1234 → "1,234"   |   12345 → "12.3K"   |   1234567 → "1.2M"
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (value >= 10_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return value.toLocaleString('en-US');
}

/**
 * Format a percentage value. 49.4 → "49.4%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage safely (avoid division by zero).
 */
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10; // 1 decimal
}

// ---------------------------------------------------------------------------
// TIME / DURATION FORMATTING
// ---------------------------------------------------------------------------

/**
 * Format seconds into human-readable duration.
 * 62 → "1m 02s"   |   3661 → "1h 01m"   |   45 → "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

/**
 * Format an ISO timestamp into relative time string.
 * "2 minutes ago", "3 hours ago", "5 days ago"
 *
 * @param isoString - ISO 8601 timestamp
 * @param now - Current timestamp for determinism
 */
export function formatTimeAgo(isoString: string, now: number = Date.now()): string {
  const date = new Date(isoString).getTime();
  const diffMs = now - date;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

/**
 * Format a remaining time countdown.
 * "2h 30m left" | "30m left" | "Expired"
 */
export function formatTimeRemaining(expiresAt: string, now: number = Date.now()): string {
  const expiry = new Date(expiresAt).getTime();
  const diffMs = expiry - now;

  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

// ---------------------------------------------------------------------------
// DATE FORMATTING
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string into a readable date.
 * "2026-04-03" → "Apr 3, 2026"
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format an ISO date into a full readable date with day of week.
 * "2026-04-03" → "Thursday, April 3, 2026"
 */
export function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date range string for week labels.
 * ("2026-03-24", "2026-03-30") → "Mar 24 – Mar 30"
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}

/**
 * Format a join date.
 * "2025-01-15T..." → "Joined January 2025"
 */
export function formatJoinDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `Joined ${month} ${year}`;
}

// ---------------------------------------------------------------------------
// STRING FORMATTING
// ---------------------------------------------------------------------------

/**
 * Produce a time-based greeting.
 *
 * @param displayName - User's display name
 * @param hour - Hour of day (0-23) for determinism
 */
export function formatGreeting(displayName: string, hour: number): string {
  if (hour < 12) return `Good morning, ${displayName}`;
  if (hour < 17) return `Good afternoon, ${displayName}`;
  return `Good evening, ${displayName}`;
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a slug into a readable label.
 * "dynamic_programming" → "Dynamic Programming"
 */
export function slugToLabel(slug: string): string {
  return slug
    .split(/[_-]/)
    .map(capitalize)
    .join(' ');
}

// ---------------------------------------------------------------------------
// STREAK / MOTIVATION
// ---------------------------------------------------------------------------

/**
 * Get a motivational message based on streak length.
 * Pure function — always deterministic for the same input.
 */
export function getMotivationText(currentStreak: number, isActiveToday: boolean): string {
  if (!isActiveToday) {
    return "Don't break your streak! Complete an activity today.";
  }
  if (currentStreak >= 100) return "Legendary! You're a coding machine! 🏆";
  if (currentStreak >= 50) return "Incredible consistency! Half century! 🌟";
  if (currentStreak >= 30) return "A whole month! You're unstoppable! 💪";
  if (currentStreak >= 14) return "Two weeks strong! Keep the momentum! 🚀";
  if (currentStreak >= 7) return "One week down! You're building a habit! 🔥";
  if (currentStreak >= 3) return "Nice start! Keep going! ⚡";
  return "Every journey starts with a single step! 🌱";
}

// ---------------------------------------------------------------------------
// COLOR UTILITIES
// ---------------------------------------------------------------------------

/** Color map for coding platforms */
export const PLATFORM_COLORS: Record<string, string> = {
  leetcode: '#FFA116',
  codeforces: '#1F8ACB',
  github: '#238636',
  codechef: '#5B4638',
};

/** Color map for difficulty levels */
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#00B8A3',
  medium: '#FFC01E',
  hard: '#FF375F',
};

/** Color map for problem status */
export const STATUS_COLORS: Record<string, string> = {
  solved: '#00B8A3',
  attempted: '#FFC01E',
  unsolved: '#6B7280',
  revisit: '#8B5CF6',
};

/** Color map for project status */
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: '#8B5CF6',
  in_progress: '#3B82F6',
  completed: '#10B981',
  on_hold: '#F59E0B',
  archived: '#6B7280',
};

/** Color map for task priority */
export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  critical: '#EF4444',
};

/** Color map for activity types */
export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  problem_solved: '#00B8A3',
  commit_pushed: '#238636',
  pr_merged: '#8B5CF6',
  project_created: '#3B82F6',
  project_updated: '#3B82F6',
  project_deleted: '#EF4444',
  contest_participated: '#F59E0B',
  contest_joined: '#F59E0B',
  streak_milestone: '#EF4444',
  note_added: '#6B7280',
  settings_updated: '#8B5CF6',
  github_sync_completed: '#8B5CF6',
};

/** Color map for programming languages */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Java: '#ED8B00',
  'C++': '#00599C',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#CC342D',
  Swift: '#FA7343',
  Kotlin: '#7F52FF',
};

// ---------------------------------------------------------------------------
// ICON UTILITIES
// ---------------------------------------------------------------------------

/** Icon identifiers for platforms */
export const PLATFORM_ICONS: Record<string, string> = {
  leetcode: 'code-bracket',
  codeforces: 'trophy',
  github: 'git-branch',
  codechef: 'fire',
};

/** Icon identifiers for activity types */
export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  problem_solved: 'check-circle',
  commit_pushed: 'git-commit',
  pr_merged: 'git-merge',
  project_created: 'folder-plus',
  project_updated: 'pencil',
  project_deleted: 'trash',
  contest_participated: 'trophy',
  contest_joined: 'trophy',
  streak_milestone: 'fire',
  note_added: 'document-text',
  settings_updated: 'cog',
  github_sync_completed: 'refresh',
};

/** Icon identifiers for mission categories */
export const MISSION_CATEGORY_ICONS: Record<string, string> = {
  dsa: 'code-bracket',
  project: 'folder',
  learning: 'academic-cap',
  consistency: 'fire',
};

/** Icon identifiers for task statuses */
export const TASK_STATUS_ICONS: Record<string, string> = {
  todo: 'circle',
  in_progress: 'play',
  review: 'eye',
  done: 'check-circle',
};

/** Icon identifiers for problem statuses */
export const PROBLEM_STATUS_ICONS: Record<string, string> = {
  solved: 'check-circle',
  attempted: 'clock',
  unsolved: 'minus-circle',
  revisit: 'arrow-path',
};
