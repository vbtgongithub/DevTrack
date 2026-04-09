// ============================================================================
// settingsMockData.ts — Settings Page Mock Data
// ============================================================================

export const ACCOUNT_DATA = {
  displayName: 'Varshith Reddy',
  email: 'varshith@dev.com',
  username: 'varshithreddy',
  bio: 'Full-stack developer & competitive programmer.',
  avatarUrl: null,
  timezone: 'Asia/Kolkata (UTC+5:30)',
  language: 'English',
};

export const INTEGRATIONS = [
  {
    id: 'int1',
    name: 'LeetCode',
    icon: 'code-bracket',
    status: 'connected' as const,
    username: 'varshith_reddy',
    lastSynced: '2 hours ago',
    description: 'Sync your problem-solving progress',
  },
  {
    id: 'int2',
    name: 'Codeforces',
    icon: 'chart-bar',
    status: 'connected' as const,
    username: 'vrreddy',
    lastSynced: '5 hours ago',
    description: 'Track contest ratings and submissions',
  },
  {
    id: 'int3',
    name: 'GitHub',
    icon: 'github',
    status: 'connected' as const,
    username: 'VarshithReddy2006',
    lastSynced: '1 hour ago',
    description: 'Monitor contributions and repositories',
  },
  {
    id: 'int4',
    name: 'CodeChef',
    icon: 'code-bracket',
    status: 'disconnected' as const,
    username: '',
    lastSynced: null,
    description: 'Import CodeChef activity and ratings',
  },
  {
    id: 'int5',
    name: 'HackerRank',
    icon: 'terminal',
    status: 'disconnected' as const,
    username: '',
    lastSynced: null,
    description: 'Sync badges and certifications',
  },
];

export const PREFERENCES = {
  theme: 'light' as const,
  dailyGoal: 6,
  weeklyGoal: 20,
  notifications: {
    streakReminder: true,
    dailyDigest: true,
    contestAlerts: true,
    weeklyReport: false,
    achievementUnlocked: true,
  },
  privacy: {
    publicProfile: true,
    showActivity: true,
    showStreak: true,
    showRating: false,
  },
};

export const SECURITY_DATA = {
  twoFactorEnabled: false,
  lastPasswordChange: '3 months ago',
  activeSessions: 2,
  loginHistory: [
    { id: 'lh1', device: 'Chrome on Windows', location: 'Hyderabad, India', time: 'Now', current: true },
    { id: 'lh2', device: 'Safari on iPhone', location: 'Hyderabad, India', time: '2 days ago', current: false },
  ],
};

export const DATA_MANAGEMENT = {
  storageUsed: '24 MB',
  storageLimit: '100 MB',
  storagePercent: 24,
  lastBackup: 'Apr 7, 2026',
  totalExports: 3,
};
