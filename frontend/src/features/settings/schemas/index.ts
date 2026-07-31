import type { SettingSectionConfig } from '../types';

export const SETTINGS_SCHEMA: SettingSectionConfig[] = [
  {
    id: 'account',
    title: 'Account',
    icon: 'user',
    groups: [
      {
        title: 'Linked Platforms',
        description: 'Connected coding profiles. Edit these on your Profile page.',
        fields: [
          { id: 'display.github', label: 'GitHub', type: 'display', icon: 'brand-github' },
          { id: 'display.leetcode', label: 'LeetCode', type: 'display', icon: 'code-bracket' },
          { id: 'display.codeforces', label: 'Codeforces', type: 'display', icon: 'code-bracket' },
          { id: 'display.codechef', label: 'CodeChef', type: 'display', icon: 'code-bracket' },
        ],
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: 'sparkles',
    groups: [
      {
        title: 'Workspace Density',
        fields: [
          {
            id: 'appearance.compactMode',
            label: 'Compact UI Mode',
            description: 'Reduce spacing for higher information density',
            type: 'toggle',
          },
        ],
      },
      {
        title: 'Activity Heatmap',
        fields: [
          {
            id: 'appearance.showHeatmap',
            label: 'Show Heatmap',
            description: 'Display the activity heatmap on your dashboard',
            type: 'toggle',
          },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'bell',
    groups: [
      {
        title: 'Delivery Methods',
        fields: [
          { id: 'notifications.emailNotifications', label: 'Email Notifications', description: 'Receive important updates via email', type: 'toggle' },
          { id: 'notifications.pushNotifications', label: 'Push Notifications', description: 'Receive real-time alerts in browser', type: 'toggle' },
        ],
      },
      {
        title: 'Alert Preferences',
        fields: [
          { id: 'notifications.dailyDigest', label: 'Daily Digest', description: 'Get a daily summary of your activity', type: 'toggle' },
          { id: 'notifications.weeklyReport', label: 'Weekly Report', description: 'Detailed weekly performance analytics', type: 'toggle' },
          { id: 'notifications.streakReminder', label: 'Streak Reminder', description: 'Reminders to maintain your coding streak', type: 'toggle' },
          { id: 'notifications.missionAlerts', label: 'Mission Alerts', description: 'Notifications about new learning missions', type: 'toggle' },
          { id: 'notifications.projectUpdates', label: 'Project Updates', description: 'Activity updates on your pinned projects', type: 'toggle' },
        ],
      },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace Management',
    icon: 'building-office',
    groups: [
      {
        title: 'System Health',
        description: 'Sync your connected platforms and refresh live status',
        fields: [
          {
            id: 'workspace.syncNow',
            label: 'Sync Platform Data',
            description: 'Fetch the latest stats from all connected platforms',
            type: 'button',
            buttonText: 'Sync Now',
            icon: 'arrow-path',
            action: 'syncNow',
          },
        ],
      },
      {
        title: 'Danger Zone',
        description: 'Irreversible actions. Proceed with caution.',
        fields: [
          {
            id: 'workspace.resetData',
            label: 'Erase All Content',
            description: 'Permanently delete all your tracked activity, DSA progress, projects, and stats. Your account stays active.',
            type: 'danger',
            placeholder: 'Erase All Content',
            danger: true,
            action: 'resetData',
          },
          {
            id: 'workspace.deleteAccount',
            label: 'Delete Account',
            description: 'Permanently delete your account and all associated data. This cannot be undone.',
            type: 'danger',
            placeholder: 'Permanently Delete Account',
            danger: true,
            action: 'deleteAccount',
          },
        ],
      },
    ],
  },
];
