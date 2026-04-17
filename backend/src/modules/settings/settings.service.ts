// src/modules/settings/settings.service.ts
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserSettings, UserProfile, ConnectedPlatform, hashPassword } from '../../db/models/index.js';
import type {
  ApiSettingsResponse,
  ApiNotificationPreferences,
  ApiAppearanceSettings,
  ApiPrivacySettings,
  ApiConnectedPlatform,
} from '../../types/api.types.js';

export async function getSettings(userId: string): Promise<ApiSettingsResponse | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const [settings, profile, platforms] = await Promise.all([
    UserSettings.findOne({ userId: new Types.ObjectId(userId) }),
    UserProfile.findOne({ userId: new Types.ObjectId(userId) }),
    ConnectedPlatform.find({ userId: new Types.ObjectId(userId) }),
  ]);

  const defaultSettings = {
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      dailyDigest: true,
      weeklyReport: true,
      streakReminder: true,
      missionAlerts: true,
      projectUpdates: true,
    },
    appearance: {
      theme: 'system' as const,
      accentColor: '#3b82f6',
      compactMode: false,
      showHeatmap: true,
      heatmapColor: 'green',
      language: 'en',
    },
    privacy: {
      profileVisibility: 'public' as const,
      showActivity: true,
      showStreak: true,
      showProjects: true,
      showDsaProgress: true,
    },
  };

  return {
    profile: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      timezone: user.timezone,
      joinedAt: user.joinedAt.toISOString(),
      lastActiveAt: user.lastActiveAt.toISOString(),
      socialLinks: {
        github: profile?.socialLinks?.github || null,
        linkedin: profile?.socialLinks?.linkedin || null,
        twitter: profile?.socialLinks?.twitter || null,
        portfolio: profile?.socialLinks?.portfolio || null,
        leetcode: profile?.socialLinks?.leetcode || null,
        codeforces: profile?.socialLinks?.codeforces || null,
      },
    },
    connectedPlatforms: platforms.map((p) => ({
      id: p._id.toString(),
      platformName: p.platformName,
      username: p.username,
      profileUrl: p.profileUrl,
      isConnected: p.isConnected,
      lastSyncedAt: p.lastSyncedAt?.toISOString() || null,
      syncStatus: p.syncStatus,
      syncError: p.syncError,
    })),
    notifications: settings?.notifications || defaultSettings.notifications,
    appearance: settings?.appearance || defaultSettings.appearance,
    privacy: settings?.privacy || defaultSettings.privacy,
  };
}

export async function updateProfile(userId: string, payload: { displayName?: string; bio?: string; timezone?: string }): Promise<void> {
  await User.findByIdAndUpdate(userId, payload);
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { avatarUrl });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) return false;

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) return false;

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return true;
}

export async function connectPlatform(
  userId: string,
  platformName: string,
  username: string,
  accessToken?: string
): Promise<ApiConnectedPlatform> {
  const profileUrl = `https://${platformName}.com/${username}`;

  const platform = await ConnectedPlatform.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), platformName },
    {
      username,
      profileUrl,
      accessToken: accessToken || null,
      isConnected: true,
      syncStatus: 'idle',
      syncError: null,
    },
    { upsert: true, new: true }
  );

  return {
    id: platform._id.toString(),
    platformName: platform.platformName,
    username: platform.username,
    profileUrl: platform.profileUrl,
    isConnected: platform.isConnected,
    lastSyncedAt: platform.lastSyncedAt?.toISOString() || null,
    syncStatus: platform.syncStatus,
    syncError: platform.syncError,
  };
}

export async function disconnectPlatform(userId: string, platformId: string): Promise<boolean> {
  const result = await ConnectedPlatform.findOneAndUpdate(
    { _id: new Types.ObjectId(platformId), userId: new Types.ObjectId(userId) },
    { isConnected: false, syncStatus: 'idle' }
  );
  return !!result;
}

export async function updateNotifications(userId: string, payload: Partial<ApiNotificationPreferences>): Promise<ApiNotificationPreferences> {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { notifications: payload } },
    { upsert: true, new: true }
  );

  return settings?.notifications || payload as ApiNotificationPreferences;
}

export async function updateAppearance(userId: string, payload: Partial<ApiAppearanceSettings>): Promise<ApiAppearanceSettings> {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { appearance: payload } },
    { upsert: true, new: true }
  );

  return settings?.appearance || payload as ApiAppearanceSettings;
}

export async function updatePrivacy(userId: string, payload: Partial<ApiPrivacySettings>): Promise<ApiPrivacySettings> {
  const settings = await UserSettings.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: { privacy: payload } },
    { upsert: true, new: true }
  );

  return settings?.privacy || payload as ApiPrivacySettings;
}

export async function deleteAccount(userId: string, password: string): Promise<boolean> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) return false;

  const isValid = await user.comparePassword(password);
  if (!isValid) return false;

  // Delete all user data
  await Promise.all([
    User.findByIdAndDelete(userId),
    UserSettings.deleteOne({ userId: new Types.ObjectId(userId) }),
    UserProfile.deleteOne({ userId: new Types.ObjectId(userId) }),
    ConnectedPlatform.deleteMany({ userId: new Types.ObjectId(userId) }),
  ]);

  return true;
}

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [user, settings, profile, platforms] = await Promise.all([
    User.findById(userId).lean(),
    UserSettings.findOne({ userId: new Types.ObjectId(userId) }).lean(),
    UserProfile.findOne({ userId: new Types.ObjectId(userId) }).lean(),
    ConnectedPlatform.find({ userId: new Types.ObjectId(userId) }).lean(),
  ]);

  return {
    user,
    settings,
    profile,
    platforms,
    exportDate: new Date().toISOString(),
  };
}