// src/modules/profile/profile.service.ts
import { Types } from 'mongoose';
import { User, UserProfile, ConnectedPlatform, PlatformStats, UserSettings } from '../../db/models/index.js';
import { PLATFORMS } from '../../config/constants.js';
import type { ApiUserProfile, ApiConnectedPlatform, ApiSocialLinks, ApiProfileUpdatePayload, ApiPlatformStatsResponse } from '../../types/api.types.js';

export async function getProfile(userId: string): Promise<ApiUserProfile | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const profile = await UserProfile.findOne({ userId: new Types.ObjectId(userId) });
  
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    timezone: user.timezone,
    joinedAt: user.joinedAt.toISOString(),
    lastActiveAt: user.lastActiveAt.toISOString(),
    roleTitle: profile?.roleTitle || null,
    targetRole: profile?.targetRole || null,
    targetCompanies: profile?.targetCompanies || [],
    techStack: profile?.techStack || [],
    socialLinks: {
      github: profile?.socialLinks?.github || null,
      linkedin: profile?.socialLinks?.linkedin || null,
      twitter: profile?.socialLinks?.twitter || null,
      portfolio: profile?.socialLinks?.portfolio || null,
      leetcode: profile?.socialLinks?.leetcode || null,
      codeforces: profile?.socialLinks?.codeforces || null,
      codechef: profile?.socialLinks?.codechef || null,
    },
  };
}

export async function updateProfile(userId: string, payload: ApiProfileUpdatePayload): Promise<ApiUserProfile | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  // Update user fields
  if (payload.displayName !== undefined) user.displayName = payload.displayName;
  if (payload.bio !== undefined) user.bio = payload.bio;
  if (payload.timezone !== undefined) user.timezone = payload.timezone;
  await user.save();

  // Update profile fields
  const profileUpdate: any = {};
  if (payload.roleTitle !== undefined) profileUpdate.roleTitle = payload.roleTitle;
  if (payload.targetRole !== undefined) profileUpdate.targetRole = payload.targetRole;
  if (payload.targetCompanies !== undefined) profileUpdate.targetCompanies = payload.targetCompanies;

  // Check if social links are updated
  if (payload.socialLinks !== undefined) {
    // Also sync to UserSettings and ConnectedPlatform!
    const platformUpdates: any = {};
    if (payload.socialLinks.leetcode !== undefined) platformUpdates.leetcode = payload.socialLinks.leetcode;
    if (payload.socialLinks.codeforces !== undefined) platformUpdates.codeforces = payload.socialLinks.codeforces;
    if (payload.socialLinks.github !== undefined) platformUpdates.github = payload.socialLinks.github;
    if (payload.socialLinks.codechef !== undefined) platformUpdates.codechef = payload.socialLinks.codechef;

    if (Object.keys(platformUpdates).length > 0) {
      await syncPlatformConfiguration(userId, platformUpdates);
    }
  }

  if (Object.keys(profileUpdate).length > 0) {
    await UserProfile.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: profileUpdate },
      { upsert: true, new: true }
    );
  }

  return getProfile(userId);
}

export async function getConnectedPlatforms(userId: string): Promise<ApiConnectedPlatform[]> {
  const platforms = await ConnectedPlatform.find({
    userId: new Types.ObjectId(userId),
  });

  return platforms.map((p) => ({
    id: p._id.toString(),
    platformName: p.platformName,
    username: p.username,
    profileUrl: p.profileUrl,
    isConnected: p.isConnected,
    lastSyncedAt: p.lastSyncedAt?.toISOString() || null,
    syncStatus: p.syncStatus,
    syncError: p.syncError,
  }));
}

export async function getPlatformStats(userId: string): Promise<ApiPlatformStatsResponse> {
  const stats = await PlatformStats.find({
    userId: new Types.ObjectId(userId),
  });

  const platforms = stats.map((s) => ({
    platformName: s.platformName,
    username: s.username,
    totalSolved: s.totalSolved,
    easySolved: s.easySolved,
    mediumSolved: s.mediumSolved,
    hardSolved: s.hardSolved,
    rating: s.rating,
    rank: s.rank,
    totalContests: s.totalContests,
    fetchedAt: s.fetchedAt.toISOString(),
  }));

  // Calculate aggregate total solved across all platforms
  const totalSolvedAllPlatforms = platforms.reduce((sum, p) => sum + (p.totalSolved || 0), 0);

  return {
    platforms,
    totals: {
      totalSolvedAllPlatforms,
    },
  };
}

export async function addTechStack(userId: string, tag: string): Promise<string[]> {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $addToSet: { techStack: tag.trim() } },
    { upsert: true, new: true }
  );

  return profile?.techStack || [];
}

export async function syncPlatformConfiguration(
  userId: string,
  platformUpdates: {
    leetcode?: string | null;
    codeforces?: string | null;
    github?: string | null;
    codechef?: string | null;
  }
): Promise<void> {
  const settingsUpdates: Record<string, any> = {};
  const profileUpdates: Record<string, any> = {};

  for (const [platform, value] of Object.entries(platformUpdates)) {
    if (value === undefined) continue;
    const username = value !== null ? value.trim() : '';

    // Build UserProfile updates
    profileUpdates[`socialLinks.${platform}`] = username || null;

    // Build UserSettings updates
    if (platform === 'leetcode') {
      settingsUpdates['platforms.leetcode.username'] = username || '';
    } else if (platform === 'codeforces') {
      settingsUpdates['platforms.codeforces.handle'] = username || '';
    } else if (platform === 'github') {
      settingsUpdates['platforms.github.username'] = username || '';
    } else if (platform === 'codechef') {
      settingsUpdates['platforms.codechef.username'] = username || '';
    }

    // Build or update ConnectedPlatform record
    const platformKey = platform.toUpperCase() as keyof typeof PLATFORMS;
    const platformConfig = PLATFORMS[platformKey];
    if (platformConfig) {
      if (username) {
        const profileUrl = platformConfig.profileUrl(username);
        await ConnectedPlatform.findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            platformName: platform.toLowerCase() as any,
          },
          {
            $set: {
              username,
              profileUrl,
              isConnected: true,
              syncStatus: 'idle',
              syncError: null,
            },
          },
          { upsert: true, new: true }
        );
      } else {
        // Disconnect platform if username cleared
        await ConnectedPlatform.findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            platformName: platform.toLowerCase() as any,
          },
          {
            $set: {
              isConnected: false,
              username: '',
            },
          }
        );
      }
    }
  }

  // Perform updates
  if (Object.keys(settingsUpdates).length > 0) {
    await UserSettings.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: settingsUpdates },
      { upsert: true, new: true }
    );
  }

  if (Object.keys(profileUpdates).length > 0) {
    await UserProfile.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: profileUpdates },
      { upsert: true, new: true }
    );
  }
}

export async function connectPlatform(
  userId: string,
  platformName: string,
  username: string
): Promise<ApiConnectedPlatform> {
  const platformNameLower = platformName.toLowerCase();
  await syncPlatformConfiguration(userId, { [platformNameLower]: username });

  const platform = await ConnectedPlatform.findOne({
    userId: new Types.ObjectId(userId),
    platformName: platformNameLower as any,
  });

  if (!platform) {
    throw new Error(`Failed to retrieve connected platform for ${platformName}`);
  }

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

export async function removeTechStack(userId: string, tag: string): Promise<string[]> {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $pull: { techStack: tag } },
    { new: true }
  );

  return profile?.techStack || [];
}