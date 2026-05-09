// ============================================================================
// activity.ts — Activity / History Page Types
// ============================================================================
// Extracted from mocks/historyMockData.ts so runtime code never imports mock files.
// ============================================================================

import type { Platform } from './dsa';

export type HistorySubmission = {
  id: string;
  problem: string;
  platform: Platform;
  topic: string;
  status: 'accepted' | 'wrong';
  time: string; // e.g. "10:30 AM"
  date: string; // e.g. "2026-04-08"
  dateLabel: string; // e.g. "Today", "Yesterday", "Apr 06"
  activityType?: string; // e.g. "settings_updated" for GitHub sync
  metadata?: Record<string, string | number | boolean>; // extra data from backend
};

export type DayActivity = {
  date: string;
  label: string;
  submissions: HistorySubmission[];
};

export type WeeklyBar = {
  day: string;
  count: number;
  isToday: boolean;
};

export type SmartInsight = {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
};

export type StreakData = {
  current: number;
  best: number;
  percentOfBest: number;
  activeDays: boolean[]; // last 7 days
};

export type ActivitySummary = {
  today: number;
  yesterday: number;
  thisWeek: number;
};

export type FilterOption = 'today' | 'week' | 'month';
