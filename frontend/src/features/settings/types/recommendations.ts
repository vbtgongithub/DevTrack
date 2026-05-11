// ============================================================================
// settingsRecommendations.ts — AI-Powered Settings Recommendations
// ============================================================================
// Smart defaults and contextual suggestions based on user behavior patterns.
// ============================================================================

export interface Recommendation {
  id: string;
  type: 'suggestion' | 'tip' | 'onboarding' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    settingId: string;
    value: any;
  };
  context?: string;
  icon: string;
}

export interface RecentChange {
  settingId: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
}

// User activity context for recommendations
interface UserActivityContext {
  totalProblemsSolved?: number;
  totalProjects?: number;
  currentStreak?: number;
  averageDailyProblems?: number;
}

// Recommendation rules engine
export function generateRecommendations(
  settings: Record<string, any>,
  userActivity?: UserActivityContext,
  _recentChanges?: RecentChange[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // === CONTEXT-AWARE SUGGESTIONS ===

  // If GitHub is connected, recommend commit analytics
  if (settings['integrations.github.connected'] && !settings['analytics.commitInsights']) {
    recommendations.push({
      id: 'rec_github_analytics',
      type: 'suggestion',
      priority: 'high',
      title: 'Enable Commit Analytics',
      description: 'You\'ve connected GitHub. Enable commit analytics to track your contribution patterns.',
      action: {
        label: 'Enable',
        settingId: 'analytics.commitInsights',
        value: true,
      },
      context: 'Based on your GitHub connection',
      icon: 'chart-line-up',
    });
  }

  // If user frequently solves DSA problems, suggest contest reminders
  if (settings['integrations.leetcode.connected'] && !settings['notifications.contestReminders']) {
    recommendations.push({
      id: 'rec_contest_reminders',
      type: 'suggestion',
      priority: 'medium',
      title: 'Contest Reminders',
      description: 'Stay competitive with automated contest notifications for LeetCode and Codeforces.',
      action: {
        label: 'Enable',
        settingId: 'notifications.contestReminders',
        value: true,
      },
      context: 'Based on your coding platform activity',
      icon: 'trophy',
    });
  }

  // Dark mode late at night suggestion
  const hour = new Date().getHours();
  if (settings['appearance.theme'] === 'dark' && hour >= 22 || hour < 6) {
    recommendations.push({
      id: 'rec_night_mode',
      type: 'optimization',
      priority: 'low',
      title: 'Reduce Eye Strain',
      description: 'Night mode is active. Consider enabling reduced brightness for comfortable late-night coding.',
      action: {
        label: 'Enable',
        settingId: 'appearance.nightMode',
        value: true,
      },
      context: 'Detected late-night usage',
      icon: 'moon',
    });
  }

  // Power user mode recommendation for active users
  if (!settings['account.powerUserMode'] && userActivity?.totalProblemsSolved && userActivity.totalProblemsSolved > 50) {
    recommendations.push({
      id: 'rec_power_user',
      type: 'onboarding',
      priority: 'medium',
      title: 'Enable Power User Mode',
      description: 'You\'re an experienced developer. Unlock advanced diagnostics, experimental features, and keyboard-driven workflows.',
      action: {
        label: 'Enable Power Mode',
        settingId: 'account.powerUserMode',
        value: true,
      },
      context: 'Based on your activity level',
      icon: 'bolt',
    });
  }

  // Suggest API tokens for users with many projects
  if (settings['integrations.github.connected'] && !settings['developer.apiTokens'] && userActivity?.totalProjects && userActivity.totalProjects > 3) {
    recommendations.push({
      id: 'rec_api_tokens',
      type: 'suggestion',
      priority: 'medium',
      title: 'API Access for Automation',
      description: 'Create API tokens to integrate DevTrack with your CI/CD pipelines and custom scripts.',
      action: {
        label: 'Create Token',
        settingId: 'developer.enableApiAccess',
        value: true,
      },
      context: 'Based on your project activity',
      icon: 'code-bracket',
    });
  }

  // Compact mode for productivity-focused users
  if (!settings['appearance.compactMode'] && userActivity?.averageDailyProblems && userActivity.averageDailyProblems > 3) {
    recommendations.push({
      id: 'rec_compact_mode',
      type: 'optimization',
      priority: 'low',
      title: 'Compact UI Mode',
      description: 'Increase your information density with compact mode for faster navigation.',
      action: {
        label: 'Enable',
        settingId: 'appearance.compactMode',
        value: true,
      },
      context: 'Based on your daily activity',
      icon: 'arrows-squares-in',
    });
  }

  // Streak reminder for consistency builders
  if (!settings['notifications.streakReminder'] && userActivity?.currentStreak && userActivity.currentStreak > 7) {
    recommendations.push({
      id: 'rec_streak_protection',
      type: 'tip',
      priority: 'high',
      title: 'Protect Your Streak',
      description: 'You\'ve built an amazing streak! Enable streak reminders to never miss a day.',
      action: {
        label: 'Enable',
        settingId: 'notifications.streakReminder',
        value: true,
      },
      context: `${userActivity.currentStreak} day streak detected`,
      icon: 'fire',
    });
  }

  // === ONBOARDING SUGGESTIONS ===

  // First-time user suggestions
  if (!settings['integrations.github.connected'] && !settings['integrations.leetcode.connected']) {
    recommendations.push({
      id: 'rec_connect_platforms',
      type: 'onboarding',
      priority: 'high',
      title: 'Connect Your First Platform',
      description: 'Link your coding profiles to unlock AI insights, track progress, and sync your activity.',
      action: {
        label: 'Connect',
        settingId: 'integrations.platformSync',
        value: true,
      },
      context: 'Getting started with DevTrack',
      icon: 'link',
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Get contextual helper hint for a setting
export function getSettingHint(settingId: string, currentValue: any): string | null {
  const hints: Record<string, { condition: (v: any) => boolean; hint: string }> = {
    'appearance.theme': {
      condition: (v) => v === 'dark',
      hint: 'Dark theme is easier on the eyes during night coding sessions.',
    },
    'notifications.streakReminder': {
      condition: (v) => v === true,
      hint: 'You\'ll receive a gentle reminder at your usual activity time.',
    },
    'account.powerUserMode': {
      condition: (v) => v === true,
      hint: 'Access advanced diagnostics with Ctrl+Shift+D',
    },
    'privacy.showActivity': {
      condition: (v) => v === false,
      hint: 'Your activity will only be visible to you.',
    },
    'integrations.platformSync': {
      condition: (v) => v === true,
      hint: 'Data syncs every 15 minutes in the background.',
    },
    'analytics.weeklyReport': {
      condition: (v) => v === true,
      hint: 'Received every Monday at 9:00 AM.',
    },
  };

  const hint = hints[settingId];
  return hint && hint.condition(currentValue) ? hint.hint : null;
}