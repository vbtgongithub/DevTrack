import type { SettingSectionConfig } from '../types';

export const SETTINGS_SCHEMA: SettingSectionConfig[] = [
  {
    id: 'account',
    title: 'Account',
    icon: 'user',
    groups: [
      {
        title: 'Profile Information',
        fields: [
          { id: 'platforms.github.username', label: 'GitHub Username', type: 'input', placeholder: 'Enter GitHub username' },
          { id: 'platforms.codeforces.handle', label: 'Codeforces Handle', type: 'input', placeholder: 'Enter Codeforces handle' },
          { id: 'platforms.leetcode.username', label: 'LeetCode Username', type: 'input', placeholder: 'Enter LeetCode username' },
          { id: 'platforms.codechef.username', label: 'CodeChef Username', type: 'input', placeholder: 'Enter CodeChef username' },
        ],
      },
      {
        title: 'Developer Identity',
        fields: [
          { id: 'account.powerUserMode', label: 'Power User Mode', description: 'Unlock advanced developer capabilities and experimental features', type: 'toggle' }
        ]
      }
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: 'sparkles',
    groups: [
      {
        title: 'Theme & Layout',
        fields: [
          {
            id: 'appearance.theme',
            label: 'Theme',
            type: 'select',
            options: [
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' },
            ],
          },
          {
            id: 'appearance.accentColor',
            label: 'Accent Color',
            type: 'color',
          },
        ],
      },
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
            description: 'Display activity heatmap on dashboard',
            type: 'toggle',
          },
          {
            id: 'appearance.heatmapColor',
            label: 'Heatmap Color',
            type: 'color',
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
    id: 'privacy',
    title: 'Data & Privacy',
    icon: 'database',
    groups: [
      {
        title: 'Profile Visibility',
        fields: [
          {
            id: 'privacy.profileVisibility',
            label: 'Profile Visibility',
            type: 'select',
            options: [
              { label: 'Public', value: 'public' },
              { label: 'Private', value: 'private' },
              { label: 'Friends Only', value: 'friends_only' },
            ],
          },
        ],
      },
      {
        title: 'Public Elements',
        fields: [
          { id: 'privacy.showActivity', label: 'Show Activity', description: 'Display your activity history publicly', type: 'toggle' },
          { id: 'privacy.showStreak', label: 'Show Streak', description: 'Display your coding streak publicly', type: 'toggle' },
          { id: 'privacy.showProjects', label: 'Show Projects', description: 'Display your public projects', type: 'toggle' },
          { id: 'privacy.showDsaProgress', label: 'Show DSA Progress', description: 'Display your Data Structures & Algorithms progress', type: 'toggle' },
        ],
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI Preferences',
    icon: 'cpu-chip',
    groups: [
      {
        title: 'AI Assistant Behavior',
        description: 'Configure how DevTrack AI interacts with you',
        fields: [
          {
            id: 'ai.recommendationLevel',
            label: 'Recommendation Intensity',
            description: 'How frequently the AI should suggest topics',
            type: 'slider',
            min: 0,
            max: 100,
            step: 10,
          },
          { id: 'ai.autoSummaries', label: 'Auto Summaries', description: 'Automatically summarize complex problems', type: 'toggle' },
          { id: 'ai.debuggingAssistant', label: 'Smart Debugging', description: 'Enable AI-driven bug detection in history', type: 'toggle' },
          { id: 'ai.personalizedRoadmap', label: 'Personalized Roadmap', description: 'Allow AI to adjust your learning path', type: 'toggle' },
        ],
      },
      {
        title: 'AI Settings Insights',
        description: 'Predictive configuration recommendations based on your usage',
        fields: [
          { id: 'ai.enableInsights', label: 'Enable AI Insights', description: 'Allow AI to suggest workflow improvements', type: 'toggle' },
        ]
      }
    ],
  },
  {
    id: 'developer',
    title: 'Developer Experience',
    icon: 'code-bracket',
    groups: [
      {
        title: 'API Tokens',
        description: 'Manage personal access tokens for API integrations',
        fields: [
          { id: 'developer.apiToken', label: 'Personal Access Token', type: 'password', placeholder: 'dt_prod_xxxxxxxxxxxx' }
        ]
      },
      {
        title: 'Webhooks & Extensibility',
        fields: [
          { id: 'developer.enableWebhooks', label: 'Enable Webhooks', description: 'Fire events to external services', type: 'toggle', experimental: true },
          { 
            id: 'developer.webhookUrl', 
            label: 'Webhook Endpoint', 
            type: 'input', 
            placeholder: 'https://...',
            dependencies: [{ id: 'developer.enableWebhooks', value: true }],
            experimental: true
          }
        ]
      },
      {
        title: 'Experimental',
        fields: [
          { id: 'developer.experimentalFlags', label: 'Opt-in to Betas', description: 'Get early access to unreleased features', type: 'toggle', experimental: true }
        ]
      }
    ]
  },
  {
    id: 'workspace',
    title: 'Workspace Management',
    icon: 'building-office',
    groups: [
      {
        title: 'Team Settings',
        fields: [
          { id: 'workspace.teamName', label: 'Team Name', type: 'input', placeholder: 'Enter team name' },
          { id: 'workspace.defaultRole', label: 'Default Role for Invites', type: 'select', options: [{ label: 'Member', value: 'member' }, { label: 'Admin', value: 'admin' }] }
        ]
      },
      {
        title: 'Sync System Health',
        description: 'Monitor real-time data sync status from integrations',
        fields: [
          { id: 'workspace.liveSync', label: 'Live Sync Pulse', description: 'Show sync indicators on dashboard', type: 'toggle' },
          { id: 'workspace.autoReconnect', label: 'Auto-Reconnect', description: 'Automatically retry failed connections', type: 'toggle' }
        ]
      },
      {
        title: 'Danger Zone',
        description: 'Destructive workspace actions',
        fields: [
          { id: 'workspace.resetData', label: 'Reset Workspace Data', type: 'danger', placeholder: 'Erase All Content', danger: true },
          { id: 'workspace.deleteAccount', label: 'Delete Account', type: 'danger', placeholder: 'Permanently Delete Account', danger: true }
        ]
      }
    ]
  }
];
