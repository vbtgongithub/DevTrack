// src/modules/profile/profile.service.ts
import { Types } from 'mongoose';
import { User, UserProfile, ConnectedPlatform, PlatformStats } from '../../db/models/index.js';
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
    socialLinks: {
      github: profile?.socialLinks?.github || null,
      linkedin: profile?.socialLinks?.linkedin || null,
      twitter: profile?.socialLinks?.twitter || null,
      portfolio: profile?.socialLinks?.portfolio || null,
      leetcode: profile?.socialLinks?.leetcode || null,
      codeforces: profile?.socialLinks?.codeforces || null,
    },
  };
}

export async function updateProfile(userId: string, payload: ApiProfileUpdatePayload): Promise<ApiUserProfile | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  // Update user fields
  if (payload.displayName) user.displayName = payload.displayName;
  if (payload.bio !== undefined) user.bio = payload.bio;
  if (payload.timezone) user.timezone = payload.timezone;
  await user.save();

  // Update profile fields
  if (payload.socialLinks) {
    await UserProfile.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { socialLinks: payload.socialLinks } },
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

export async function removeTechStack(userId: string, tag: string): Promise<string[]> {
  const profile = await UserProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $pull: { techStack: tag } },
    { new: true }
  );

  return profile?.techStack || [];
}

const PROFILE_URL_MAP: Record<string, (u: string) => string> = {
  leetcode: (u) => `https://leetcode.com/u/${u}`,
  codeforces: (u) => `https://codeforces.com/profile/${u}`,
  codechef: (u) => `https://codechef.com/users/${u}`,
  github: (u) => `https://github.com/${u}`,
  hackerrank: (u) => `https://hackerrank.com/${u}`,
};

export async function connectPlatform(
  userId: string,
  platformName: string,
  username: string,
): Promise<ApiConnectedPlatform> {
  const profileUrl = PROFILE_URL_MAP[platformName]?.(username) ?? `https://${platformName}.com/${username}`;

  const platform = await ConnectedPlatform.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), platformName },
    {
      username,
      profileUrl,
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