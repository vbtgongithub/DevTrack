// ============================================================================
// profileMockData.ts — Profile Page Mock Data
// ============================================================================

export const PROFILE_USER = {
  displayName: 'Varshith Reddy',
  username: '@varshithreddy',
  bio: 'Full-stack developer & competitive programmer. Building tools that make developers more productive.',
  location: 'Hyderabad, India',
  company: 'Open Source',
  website: 'https://varshithreddy.dev',
  github: 'https://github.com/VarshithReddy2006',
  linkedin: 'https://linkedin.com/in/varshithreddy',
  twitter: 'https://twitter.com/varshithreddy',
  email: 'varshith@dev.com',
  joinedDate: 'January 2025',
  avatarUrl: null,
};

export const PROFILE_STATS = [
  { id: 'ps1', label: 'Problems Solved', value: '1,250', icon: 'check-circle', color: 'emerald' },
  { id: 'ps2', label: 'GitHub Contributions', value: '350', icon: 'github', color: 'gray' },
  { id: 'ps3', label: 'Current Streak', value: '12 days', icon: 'fire', color: 'orange' },
  { id: 'ps4', label: 'Active Days', value: '180', icon: 'calendar', color: 'blue' },
  { id: 'ps5', label: 'Projects', value: '6', icon: 'folder', color: 'purple' },
  { id: 'ps6', label: 'Contest Rating', value: '1,684', icon: 'trophy', color: 'yellow' },
];

export const PROFILE_PLATFORMS = [
  {
    id: 'pl1',
    name: 'LeetCode',
    username: 'varshith_reddy',
    status: 'connected' as const,
    problems: 600,
    rating: 1850,
    rank: 'Knight',
    lastSynced: '2 hours ago',
  },
  {
    id: 'pl2',
    name: 'Codeforces',
    username: 'vrreddy',
    status: 'connected' as const,
    problems: 300,
    rating: 1800,
    rank: 'Expert',
    lastSynced: '5 hours ago',
  },
  {
    id: 'pl3',
    name: 'CodeChef',
    username: 'varshith_r',
    status: 'connected' as const,
    problems: 200,
    rating: 1700,
    rank: '4★',
    lastSynced: '1 day ago',
  },
  {
    id: 'pl4',
    name: 'HackerRank',
    username: 'varshithreddy',
    status: 'connected' as const,
    problems: 150,
    rating: '★ 5',
    rank: 'Gold',
    lastSynced: '3 days ago',
  },
];

export const PROFILE_TOPICS = [
  { name: 'Arrays', progress: 82, solved: 164, total: 200 },
  { name: 'Dynamic Programming', progress: 64, solved: 96, total: 150 },
  { name: 'Trees', progress: 73, solved: 110, total: 150 },
  { name: 'Graphs', progress: 39, solved: 47, total: 120 },
  { name: 'Strings', progress: 71, solved: 85, total: 120 },
  { name: 'Binary Search', progress: 88, solved: 70, total: 80 },
];

export const PROFILE_ACTIVITY = [
  { day: 'Mon', count: 5 },
  { day: 'Tue', count: 3 },
  { day: 'Wed', count: 7 },
  { day: 'Thu', count: 4 },
  { day: 'Fri', count: 6 },
  { day: 'Sat', count: 2 },
  { day: 'Sun', count: 8 },
];

export const PROFILE_ACHIEVEMENTS = [
  { id: 'pa1', icon: '🔥', title: 'Hot Streak', description: '10+ day streak', unlocked: true, date: 'Apr 2, 2026' },
  { id: 'pa2', icon: '💯', title: 'Century Club', description: '100 problems solved', unlocked: true, date: 'Mar 28, 2026' },
  { id: 'pa3', icon: '⚡', title: 'Speed Demon', description: 'Solved in under 5 min', unlocked: true, date: 'Mar 15, 2026' },
  { id: 'pa4', icon: '🏆', title: 'Contest Hero', description: 'Top 100 in a contest', unlocked: true, date: 'Mar 10, 2026' },
  { id: 'pa5', icon: '🎯', title: 'Sharpshooter', description: '10 hard problems', unlocked: true, date: 'Feb 20, 2026' },
  { id: 'pa6', icon: '🌟', title: 'All-Rounder', description: 'All topics above 70%', unlocked: false, date: null },
  { id: 'pa7', icon: '📚', title: 'Scholar', description: '500 problems total', unlocked: true, date: 'Jan 15, 2026' },
  { id: 'pa8', icon: '🚀', title: 'Rocket', description: '30-day streak', unlocked: false, date: null },
];

export const PROFILE_INSIGHTS = [
  { id: 'pi1', text: 'You solve 3× more problems in the evening', icon: 'sunrise', color: 'blue' },
  { id: 'pi2', text: 'Arrays is your strongest topic (82%)', icon: 'trending-up', color: 'green' },
  { id: 'pi3', text: 'Most active on Wednesdays', icon: 'calendar', color: 'purple' },
  { id: 'pi4', text: 'Average solve time: 12m 34s', icon: 'clock', color: 'orange' },
];
