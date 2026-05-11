// ============================================================================
// settingsApi.ts — API service for Settings
// ============================================================================
// Uses centralized axiosClient for auth, error normalization, and token refresh.
// ============================================================================

import axiosClient from '../utils/axiosClient';
import type { ApiResponse } from '../types/api.types';

const SETTINGS_PATH = '/settings';
const SYNC_PATH = '/platforms/sync';

export interface PlatformConfig {
  username?: string;
  handle?: string;
  lastSyncedAt?: string | null;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  streakReminder: boolean;
  missionAlerts: boolean;
  projectUpdates: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  compactMode: boolean;
  showHeatmap: boolean;
  heatmapColor: string;
  language: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends_only';
  showActivity: boolean;
  showStreak: boolean;
  showProjects: boolean;
  showDsaProgress: boolean;
}

export interface UserSettingsResponse {
  id: string;
  userId: string;
  platforms: {
    github: PlatformConfig;
    codeforces: PlatformConfig;
    leetcode: PlatformConfig;
    codechef: PlatformConfig;
  };
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  platforms?: {
    github?: PlatformConfig;
    codeforces?: PlatformConfig;
    leetcode?: PlatformConfig;
    codechef?: PlatformConfig;
  };
  notifications?: Partial<NotificationSettings>;
  appearance?: Partial<AppearanceSettings>;
  privacy?: Partial<PrivacySettings>;
  // For profile changes, usually goes to another endpoint, but let's assume it's here or we can just mock the UI first.
}

export interface SyncGithubResponse {
  platform: string;
  success: boolean;
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    rating: number | null;
    rank: string | null;
    totalContests: number;
  } | null;
  error: string | null;
  lastSyncedAt: string;
}

export async function getSettings(): Promise<UserSettingsResponse> {
  const { data } = await axiosClient.get<ApiResponse<UserSettingsResponse>>(SETTINGS_PATH);
  return data.data;
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<UserSettingsResponse> {
  const { data } = await axiosClient.put<ApiResponse<UserSettingsResponse>>(SETTINGS_PATH, payload);
  return data.data;
}

export async function syncGithub(): Promise<SyncGithubResponse> {
  const { data } = await axiosClient.post<ApiResponse<SyncGithubResponse>>(`${SYNC_PATH}/github`);
  return data.data;
}
