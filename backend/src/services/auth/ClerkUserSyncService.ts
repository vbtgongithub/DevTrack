// src/services/auth/ClerkUserSyncService.ts
import { clerkClient } from '@clerk/express';
import { User, UserSettings, UserProfile } from '../../db/models/index.js';
import { logger } from '../../shared/logger.js';
import type { ApiUser } from '../../types/api.types.js';

export async function syncClerkUser(clerkUserId: string): Promise<ApiUser> {
  // First check if user exists locally
  let user = await User.findOne({ clerkId: clerkUserId });

  if (!user) {
    logger.info(`[SYNC] New Clerk user detected, fetching details... ${clerkUserId}`);
    // Fetch details from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const username = clerkUser.username || email.split('@')[0];
    const displayName = clerkUser.firstName 
      ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() 
      : username;

    // Check if a local user already exists with the same email
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      logger.info(`[SYNC] Found existing local user by email ${email}, linking clerkId ${clerkUserId}`);
      existingByEmail.clerkId = clerkUserId;
      if (!existingByEmail.avatarUrl && clerkUser.imageUrl) {
        existingByEmail.avatarUrl = clerkUser.imageUrl;
      }
      user = await existingByEmail.save();
    } else {
      user = await User.create({
        clerkId: clerkUserId,
        email,
        username,
        displayName,
        avatarUrl: clerkUser.imageUrl,
      });

      // Create default settings and profile
      await Promise.all([
        UserSettings.create({ userId: user._id }),
        UserProfile.create({ userId: user._id }),
      ]);
    }

    logger.info(`[SYNC] Successfully synced Clerk user ${clerkUserId} to local profile`);
  } else {
    // Update lastActiveAt
    user.lastActiveAt = new Date();
    await user.save();
  }

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
    isEmailVerified: user.isEmailVerified,
    role: user.role,
  };
}
