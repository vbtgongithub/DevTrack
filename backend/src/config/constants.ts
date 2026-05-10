// src/config/constants.ts - Application constants

export const APP_NAME = 'DevTrack';
export const API_VERSION = 'v1';
export const API_BASE_PATH = '/api';

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PLATFORM_STATS: 3600, // 1 hour
  USER_PROFILE: 300, // 5 minutes
  DASHBOARD: 60, // 1 minute
  ACTIVITY_FEED: 300, // 5 minutes
};

// Platform configuration
export const PLATFORMS = {
  LEETCODE: {
    id: 'leetcode',
    name: 'LeetCode',
    baseUrl: 'https://leetcode.com',
    profileUrl: (username: string) => `https://leetcode.com/u/${username}`,
  },
  CODEFORCES: {
    id: 'codeforces',
    name: 'Codeforces',
    baseUrl: 'https://codeforces.com',
    profileUrl: (username: string) => `https://codeforces.com/profile/${username}`,
  },
  CODECHEF: {
    id: 'codechef',
    name: 'CodeChef',
    baseUrl: 'https://codechef.com',
    profileUrl: (username: string) => `https://codechef.com/users/${username}`,
  },
  GITHUB: {
    id: 'github',
    name: 'GitHub',
    baseUrl: 'https://github.com',
    profileUrl: (username: string) => `https://github.com/${username}`,
  },
} as const;

export type PlatformId = keyof typeof PLATFORMS;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Difficulty levels
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

// Problem status
export const PROBLEM_STATUS = {
  UNSOLVED: 'unsolved',
  ATTEMPTED: 'attempted',
  SOLVED: 'solved',
  REVISIT: 'revisit',
} as const;

// Activity types
export const ACTIVITY_TYPES = {
  PROBLEM_SOLVED: 'problem_solved',
  COMMIT_PUSHED: 'commit_pushed',
  PR_MERGED: 'pr_merged',
  PROJECT_CREATED: 'project_created',
  CONTEST_PARTICIPATED: 'contest_participated',
  STREAK_MILESTONE: 'streak_milestone',
  NOTE_ADDED: 'note_added',
  SETTINGS_UPDATED: 'settings_updated',
} as const;

// Mission types
export const MISSION_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MILESTONE: 'milestone',
} as const;

// Mission categories
export const MISSION_CATEGORIES = {
  DSA: 'dsa',
  PROJECT: 'project',
  LEARNING: 'learning',
  CONSISTENCY: 'consistency',
} as const;

// Project status
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  ARCHIVED: 'archived',
} as const;

// Task status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
} as const;

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Visibility
export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FRIENDS_ONLY: 'friends_only',
} as const;