// ============================================================================
// dashboardMockData.ts — Dashboard Mock Data
// ============================================================================

export const TODAY_SUMMARY = [
  { id: 's1', emoji: '🔥', text: "You're on a 12-day streak", type: 'streak' as const },
  { id: 's2', emoji: '📈', text: '+20% more active than last week', type: 'growth' as const },
  { id: 's3', emoji: '⚠️', text: 'Graphs need attention', type: 'warning' as const },
  { id: 's4', emoji: '🎯', text: '2/3 daily goals completed', type: 'goal' as const },
];

export const INSIGHTS_DATA = [
  {
    id: 'i1',
    icon: 'trending-up',
    title: 'Strong in Arrays',
    description: 'You have 82% mastery — top 15% among peers.',
    color: 'green' as const,
    metric: '82%',
  },
  {
    id: 'i2',
    icon: 'trending-down',
    title: 'Graphs need improvement',
    description: 'Only 40% mastery. Try 2 problems this week.',
    color: 'red' as const,
    metric: '40%',
  },
  {
    id: 'i3',
    icon: 'activity',
    title: 'Peak productivity: Evenings',
    description: 'You solve 3× more problems between 6–10 PM.',
    color: 'blue' as const,
    metric: '3×',
  },
  {
    id: 'i4',
    icon: 'target',
    title: 'Weekly target on track',
    description: '14/20 problems solved. 6 more to hit your goal.',
    color: 'orange' as const,
    metric: '70%',
  },
];

export const PROGRESS_DATA = [
  {
    id: 'pg1',
    title: 'Weekly Problem Goal',
    progress: 70,
    insight: '14 of 20 problems solved this week',
    icon: 'target',
  },
  {
    id: 'pg2',
    title: 'Contest Rating Target',
    progress: 84,
    insight: 'Rating: 1684 / Target: 2000',
    icon: 'trophy',
  },
  {
    id: 'pg3',
    title: 'Topic Coverage',
    progress: 62,
    insight: '8 of 13 core topics practiced',
    icon: 'layers',
  },
];

export const ACHIEVEMENTS = [
  { id: 'a1', icon: '🔥', title: 'Hot Streak', description: '10-day streak', unlocked: true, date: 'Apr 2' },
  { id: 'a2', icon: '💯', title: 'Century', description: '100 problems solved', unlocked: true, date: 'Mar 28' },
  { id: 'a3', icon: '⚡', title: 'Speed Demon', description: 'Solve under 5 min', unlocked: true, date: 'Mar 15' },
  { id: 'a4', icon: '🏆', title: 'Contest Hero', description: 'Top 100 in contest', unlocked: false, date: null },
  { id: 'a5', icon: '🎯', title: 'Sharpshooter', description: '10 hard problems', unlocked: false, date: null },
  { id: 'a6', icon: '🌟', title: 'All-Rounder', description: 'All topics 70%+', unlocked: false, date: null },
];

export const DAILY_GOAL = {
  solved: 4,
  target: 6,
  timeSpent: '2h 15m',
  problemsBreakdown: { easy: 1, medium: 2, hard: 1 },
};

export const STREAK_DATA = {
  current: 12,
  longest: 31,
  isActiveToday: true,
  startDate: 'Mar 28, 2026',
  weekActivity: [true, true, true, false, true, true, true],
};
