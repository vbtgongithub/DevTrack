// ============================================================================
// settingsVM.ts — Settings ViewModel
// ============================================================================
// Pure functions ONLY. No React imports. No side effects.
// ============================================================================

import type {
  ApiSettingsResponse,
  ApiUserProfile,
  ApiConnectedPlatform,
  ApiNotificationPreferences,
  ApiAppearanceSettings,
  ApiPrivacySettings,
} from '../types/api.types';
import type {
  SettingsPageVM,
  SettingsProfileVM,
  SettingsPlatformVM,
  SettingsNotificationsVM,
  SettingsAppearanceVM,
  SettingsPrivacyVM,
} from '../types/vm.types';
import {
  formatTimeAgo,
  formatJoinDate,
  capitalize,
  PLATFORM_ICONS,
} from '../utils/formatters';

// ---------------------------------------------------------------------------
// MAIN TRANSFORMER
// ---------------------------------------------------------------------------

export function transformSettingsPage(
  apiData: ApiSettingsResponse,
  activeTab: string = 'profile',
  now: number = Date.now()
): SettingsPageVM {
  return {
    profile: transformProfile(apiData.profile),
    platforms: apiData.connectedPlatforms.map((p) =>
      transformPlatform(p, now)
    ),
    notifications: transformNotifications(apiData.notifications),
    appearance: transformAppearance(apiData.appearance),
    privacy: transformPrivacy(apiData.privacy),
    activeTab,
  };
}

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------

export function transformProfile(profile: ApiUserProfile): SettingsProfileVM {
  const socialEntries: {
    platform: string;
    label: string;
    icon: string;
    key: keyof typeof profile.socialLinks;
  }[] = [
    { platform: 'github', label: 'GitHub', icon: 'git-branch', key: 'github' },
    { platform: 'linkedin', label: 'LinkedIn', icon: 'link', key: 'linkedin' },
    { platform: 'twitter', label: 'Twitter', icon: 'chat-bubble', key: 'twitter' },
    { platform: 'portfolio', label: 'Portfolio', icon: 'globe', key: 'portfolio' },
    { platform: 'leetcode', label: 'LeetCode', icon: 'code-bracket', key: 'leetcode' },
    { platform: 'codeforces', label: 'Codeforces', icon: 'trophy', key: 'codeforces' },
  ];

  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio || '',
    timezone: profile.timezone,
    joinedFormatted: formatJoinDate(profile.joinedAt),
    socialLinks: socialEntries.map((entry) => ({
      platform: entry.platform,
      label: entry.label,
      url: profile.socialLinks[entry.key] || '',
      icon: entry.icon,
      isSet: profile.socialLinks[entry.key] !== null,
    })),
  };
}

// ---------------------------------------------------------------------------
// PLATFORMS
// ---------------------------------------------------------------------------

export function transformPlatform(
  platform: ApiConnectedPlatform,
  now: number
): SettingsPlatformVM {
  const syncStatusMap: Record<string, { label: string; color: string }> = {
    idle: { label: 'Idle', color: '#6B7280' },
    syncing: { label: 'Syncing...', color: '#3B82F6' },
    error: { label: 'Sync Error', color: '#EF4444' },
    success: { label: 'Synced', color: '#10B981' },
  };

  const syncInfo = syncStatusMap[platform.syncStatus] || syncStatusMap.idle;

  return {
    id: platform.id,
    name: platform.platformName,
    displayName: capitalize(platform.platformName),
    icon: PLATFORM_ICONS[platform.platformName] || 'globe',
    username: platform.username,
    isConnected: platform.isConnected,
    lastSynced: platform.lastSyncedAt
      ? formatTimeAgo(platform.lastSyncedAt, now)
      : null,
    syncStatusLabel: syncInfo.label,
    syncStatusColor: syncInfo.color,
    profileUrl: platform.profileUrl,
  };
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

export function transformNotifications(
  prefs: ApiNotificationPreferences
): SettingsNotificationsVM {
  return {
    groups: [
      {
        title: 'General',
        items: [
          {
            key: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Receive notifications via email',
            enabled: prefs.emailNotifications,
          },
          {
            key: 'pushNotifications',
            label: 'Push Notifications',
            description: 'Receive push notifications in the browser',
            enabled: prefs.pushNotifications,
          },
        ],
      },
      {
        title: 'Reports',
        items: [
          {
            key: 'dailyDigest',
            label: 'Daily Digest',
            description: 'Get a daily summary of your progress',
            enabled: prefs.dailyDigest,
          },
          {
            key: 'weeklyReport',
            label: 'Weekly Report',
            description: 'Receive a weekly progress report',
            enabled: prefs.weeklyReport,
          },
        ],
      },
      {
        title: 'Activity',
        items: [
          {
            key: 'streakReminder',
            label: 'Streak Reminder',
            description: 'Get reminded before your streak expires',
            enabled: prefs.streakReminder,
          },
          {
            key: 'missionAlerts',
            label: 'Mission Alerts',
            description: 'Notifications about new and expiring missions',
            enabled: prefs.missionAlerts,
          },
          {
            key: 'projectUpdates',
            label: 'Project Updates',
            description: 'Notifications about project changes',
            enabled: prefs.projectUpdates,
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// APPEARANCE
// ---------------------------------------------------------------------------

export function transformAppearance(
  settings: ApiAppearanceSettings
): SettingsAppearanceVM {
  return {
    currentTheme: settings.theme,
    themes: [
      { value: 'light', label: 'Light', icon: 'sun' },
      { value: 'dark', label: 'Dark', icon: 'moon' },
      { value: 'system', label: 'System', icon: 'computer-desktop' },
    ],
    accentColor: settings.accentColor,
    accentOptions: [
      { value: '#3B82F6', label: 'Blue', swatch: '#3B82F6' },
      { value: '#8B5CF6', label: 'Purple', swatch: '#8B5CF6' },
      { value: '#10B981', label: 'Green', swatch: '#10B981' },
      { value: '#F59E0B', label: 'Amber', swatch: '#F59E0B' },
      { value: '#EF4444', label: 'Red', swatch: '#EF4444' },
      { value: '#EC4899', label: 'Pink', swatch: '#EC4899' },
    ],
    compactMode: settings.compactMode,
    showHeatmap: settings.showHeatmap,
    heatmapColor: settings.heatmapColor,
    heatmapColorOptions: [
      { value: '#10B981', label: 'Green', swatch: '#10B981' },
      { value: '#3B82F6', label: 'Blue', swatch: '#3B82F6' },
      { value: '#8B5CF6', label: 'Purple', swatch: '#8B5CF6' },
      { value: '#F59E0B', label: 'Amber', swatch: '#F59E0B' },
    ],
    language: settings.language,
    languageOptions: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Español' },
      { value: 'fr', label: 'Français' },
      { value: 'de', label: 'Deutsch' },
      { value: 'ja', label: '日本語' },
      { value: 'zh', label: '中文' },
    ],
  };
}

// ---------------------------------------------------------------------------
// PRIVACY
// ---------------------------------------------------------------------------

export function transformPrivacy(
  settings: ApiPrivacySettings
): SettingsPrivacyVM {
  return {
    items: [
      {
        key: 'profileVisibility',
        label: 'Profile Visibility',
        description: 'Control who can see your profile',
        type: 'select',
        value: settings.profileVisibility,
        options: [
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' },
          { value: 'friends_only', label: 'Friends Only' },
        ],
      },
      {
        key: 'showActivity',
        label: 'Show Activity',
        description: 'Display your activity on your public profile',
        type: 'toggle',
        value: settings.showActivity,
      },
      {
        key: 'showStreak',
        label: 'Show Streak',
        description: 'Display your streak on your public profile',
        type: 'toggle',
        value: settings.showStreak,
      },
      {
        key: 'showProjects',
        label: 'Show Projects',
        description: 'Display your projects on your public profile',
        type: 'toggle',
        value: settings.showProjects,
      },
      {
        key: 'showDsaProgress',
        label: 'Show DSA Progress',
        description: 'Display your DSA progress on your public profile',
        type: 'toggle',
        value: settings.showDsaProgress,
      },
    ],
  };
}
