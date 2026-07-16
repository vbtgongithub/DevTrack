// src/modules/settings/danger.service.ts
// ---------------------------------------------------------------------------
// Destructive account actions: erase user content and permanently delete
// the account. All deletes are scoped strictly to the requesting user's
// documents — no cross-user data is ever touched.
// ---------------------------------------------------------------------------

import mongoose from 'mongoose';
import { clerkClient } from '@clerk/express';
import { User } from '../../db/models/user.model.js';
import { logger } from '../../shared/logger.js';

// Importing the models barrel for its side effects guarantees the user-scoped
// collections are registered on the connection before we enumerate them.
import '../../db/models/index.js';

/** Fields a collection may use to reference its owning user. */
const USER_REF_FIELDS = ['userId', 'user'] as const;

/**
 * Collections preserved when *erasing content*: the account, profile and
 * settings survive so the user can keep using DevTrack with a clean slate.
 */
const PRESERVE_ON_ERASE = new Set(['User', 'UserSettings', 'UserProfile']);

/**
 * Collections preserved when *deleting the account*: only the root User doc,
 * which has no `userId` field and is removed explicitly by `_id` below.
 */
const PRESERVE_ON_DELETE = new Set(['User']);

/** Map of collection name -> number of documents deleted. */
export type PurgeSummary = Record<string, number>;

/**
 * Delete every document owned by `userId` across all registered models,
 * skipping any model listed in `preserve`.
 */
async function purgeUserScopedData(
  userId: string,
  preserve: Set<string>,
): Promise<PurgeSummary> {
  const summary: PurgeSummary = {};
  const models = mongoose.connection.models;

  for (const [modelName, model] of Object.entries(models)) {
    if (preserve.has(modelName)) continue;

    // Only touch collections that actually reference a user.
    const refField = USER_REF_FIELDS.find((field) => model.schema.path(field));
    if (!refField) continue;

    const { deletedCount } = await model.deleteMany({ [refField]: userId });
    if (deletedCount) summary[modelName] = deletedCount;
  }

  return summary;
}

/**
 * Erase all tracked content for a user while keeping their account, profile
 * and settings intact.
 */
export async function eraseUserContent(userId: string): Promise<PurgeSummary> {
  const summary = await purgeUserScopedData(userId, PRESERVE_ON_ERASE);
  logger.info('[danger] Erased user content', { userId, summary });
  return summary;
}

/**
 * Permanently delete a user: purge all user-scoped data, remove the root User
 * document, and delete the external Clerk identity so the account cannot be
 * transparently re-synced on the next authenticated request.
 */
export async function deleteUserAccount(
  userId: string,
  clerkId: string,
): Promise<PurgeSummary> {
  const summary = await purgeUserScopedData(userId, PRESERVE_ON_DELETE);

  // Remove the root user document (keyed by _id, no userId field).
  await User.deleteOne({ _id: userId });
  summary.User = 1;

  // Best-effort removal of the Clerk identity. If this fails we must not leave
  // local data half-deleted, so we log and continue; the local data is gone.
  try {
    await clerkClient.users.deleteUser(clerkId);
  } catch (err) {
    logger.error(`[danger] Failed to delete Clerk user ${clerkId}`, err);
  }

  logger.info('[danger] Deleted user account', { userId, clerkId, summary });
  return summary;
}
