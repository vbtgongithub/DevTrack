// ============================================================================
// historyMockData.ts — Smart History Mock Data
// ============================================================================

import type { Platform } from '../types/dsa';

export type HistorySubmission = {
  id: string;
  problem: string;
  platform: Platform;
  topic: string;
  status: 'accepted' | 'wrong';
  time: string; // e.g. "10:30 AM"
  date: string; // e.g. "2026-04-08"
  dateLabel: string; // e.g. "Today", "Yesterday", "Apr 06"
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

// ─── Today's date helpers ───
const TODAY = '2026-04-08';
const YESTERDAY = '2026-04-07';

// ─── Submissions ───
export const mockSubmissions: HistorySubmission[] = [
  {
    id: 'h1',
    problem: 'Two Sum',
    platform: 'leetcode',
    topic: 'Arrays',
    status: 'accepted',
    time: '6:45 PM',
    date: TODAY,
    dateLabel: 'Today',
  },
  {
    id: 'h2',
    problem: 'Valid Parentheses',
    platform: 'leetcode',
    topic: 'Stacks',
    status: 'accepted',
    time: '5:20 PM',
    date: TODAY,
    dateLabel: 'Today',
  },
  {
    id: 'h3',
    problem: 'Course Schedule',
    platform: 'leetcode',
    topic: 'Graphs',
    status: 'wrong',
    time: '3:15 PM',
    date: TODAY,
    dateLabel: 'Today',
  },
  {
    id: 'h4',
    problem: 'Merge Intervals',
    platform: 'leetcode',
    topic: 'Arrays',
    status: 'accepted',
    time: '11:00 AM',
    date: TODAY,
    dateLabel: 'Today',
  },
  {
    id: 'h5',
    problem: 'Binary Search',
    platform: 'codeforces',
    topic: 'Searching',
    status: 'accepted',
    time: '9:30 AM',
    date: TODAY,
    dateLabel: 'Today',
  },
  {
    id: 'h6',
    problem: 'Longest Common Subsequence',
    platform: 'leetcode',
    topic: 'DP',
    status: 'accepted',
    time: '7:45 PM',
    date: YESTERDAY,
    dateLabel: 'Yesterday',
  },
  {
    id: 'h7',
    problem: 'Knapsack Problem',
    platform: 'codechef',
    topic: 'DP',
    status: 'accepted',
    time: '4:00 PM',
    date: YESTERDAY,
    dateLabel: 'Yesterday',
  },
  {
    id: 'h8',
    problem: 'Flood Fill',
    platform: 'leetcode',
    topic: 'Graphs',
    status: 'accepted',
    time: '2:30 PM',
    date: YESTERDAY,
    dateLabel: 'Yesterday',
  },
  {
    id: 'h9',
    problem: 'Climbing Stairs',
    platform: 'leetcode',
    topic: 'DP',
    status: 'accepted',
    time: '10:00 AM',
    date: YESTERDAY,
    dateLabel: 'Yesterday',
  },
  {
    id: 'h10',
    problem: 'Maximum Subarray',
    platform: 'leetcode',
    topic: 'Arrays',
    status: 'accepted',
    time: '6:00 PM',
    date: '2026-04-06',
    dateLabel: 'Apr 06',
  },
  {
    id: 'h11',
    problem: 'Number of Islands',
    platform: 'leetcode',
    topic: 'Graphs',
    status: 'wrong',
    time: '3:30 PM',
    date: '2026-04-06',
    dateLabel: 'Apr 06',
  },
  {
    id: 'h12',
    problem: 'Coin Change',
    platform: 'codeforces',
    topic: 'DP',
    status: 'accepted',
    time: '11:15 AM',
    date: '2026-04-06',
    dateLabel: 'Apr 06',
  },
  {
    id: 'h13',
    problem: 'Reverse Linked List',
    platform: 'leetcode',
    topic: 'Linked Lists',
    status: 'accepted',
    time: '5:45 PM',
    date: '2026-04-05',
    dateLabel: 'Apr 05',
  },
  {
    id: 'h14',
    problem: 'House Robber',
    platform: 'leetcode',
    topic: 'DP',
    status: 'accepted',
    time: '2:00 PM',
    date: '2026-04-05',
    dateLabel: 'Apr 05',
  },
  {
    id: 'h15',
    problem: 'Container With Most Water',
    platform: 'hackerrank',
    topic: 'Arrays',
    status: 'accepted',
    time: '6:30 PM',
    date: '2026-04-04',
    dateLabel: 'Apr 04',
  },
  {
    id: 'h16',
    problem: 'Word Break',
    platform: 'leetcode',
    topic: 'DP',
    status: 'wrong',
    time: '4:15 PM',
    date: '2026-04-03',
    dateLabel: 'Apr 03',
  },
  {
    id: 'h17',
    problem: 'Rotate Image',
    platform: 'leetcode',
    topic: 'Arrays',
    status: 'accepted',
    time: '1:00 PM',
    date: '2026-04-03',
    dateLabel: 'Apr 03',
  },
  {
    id: 'h18',
    problem: 'Level Order Traversal',
    platform: 'codeforces',
    topic: 'Trees',
    status: 'accepted',
    time: '7:00 PM',
    date: '2026-04-02',
    dateLabel: 'Apr 02',
  },
];

// ─── Group by date ───
export function groupByDate(submissions: HistorySubmission[]): DayActivity[] {
  const map = new Map<string, DayActivity>();
  for (const s of submissions) {
    if (!map.has(s.date)) {
      map.set(s.date, { date: s.date, label: s.dateLabel, submissions: [] });
    }
    map.get(s.date)!.submissions.push(s);
  }
  return Array.from(map.values());
}

// ─── Weekly trend ───
export const mockWeeklyBars: WeeklyBar[] = [
  { day: 'Mon', count: 1, isToday: false },
  { day: 'Tue', count: 3, isToday: false },
  { day: 'Wed', count: 5, isToday: false },
  { day: 'Thu', count: 2, isToday: false },
  { day: 'Fri', count: 3, isToday: false },
  { day: 'Sat', count: 4, isToday: false },
  { day: 'Sun', count: 0, isToday: false },
  { day: 'Mon', count: 1, isToday: false },
  { day: 'Tue', count: 5, isToday: true },
];

// ─── Smart Insights ───
export const mockInsights: SmartInsight[] = [
  {
    id: 'i1',
    icon: '📆',
    label: 'Most Active Day',
    value: 'You are most active on Wednesdays',
    color: '#4F46E5',
  },
  {
    id: 'i2',
    icon: '🌙',
    label: 'Peak Time',
    value: 'You solve most problems in the evening',
    color: '#7C3AED',
  },
  {
    id: 'i3',
    icon: '💪',
    label: 'Strong Topic',
    value: 'Strong in Arrays (82% success)',
    color: '#059669',
  },
  {
    id: 'i4',
    icon: '📉',
    label: 'Needs Work',
    value: 'Graphs need improvement (40%)',
    color: '#DC2626',
  },
  {
    id: 'i5',
    icon: '📈',
    label: 'Weekly Change',
    value: '+20% more activity than last week',
    color: '#0891B2',
  },
  {
    id: 'i6',
    icon: '✅',
    label: 'Consistency',
    value: 'You solved problems 5 out of 7 days',
    color: '#D97706',
  },
];

// ─── Streak ───
export const mockStreak: StreakData = {
  current: 12,
  best: 31,
  percentOfBest: Math.round((12 / 31) * 100),
  activeDays: [true, true, false, true, true, true, true],
};

// ─── Activity Summary ───
export const mockSummary: ActivitySummary = {
  today: 5,
  yesterday: 4,
  thisWeek: 18,
};
