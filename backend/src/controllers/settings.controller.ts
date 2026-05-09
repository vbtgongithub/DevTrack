// src/controllers/settings.controller.ts
// Hardened settings controller — platform username/handle updates only.
// Internal fields (userId, lastSyncedAt, timestamps) are never client-writable.

import type { Response } from 'express';
import { Types } from 'mongoose';
import { UserSettings } from '../db/models/userSettings.model.js';
import { ActivityEvent } from '../db/models/activityEvent.model.js';
import { successResponse, commonErrors } from '../shared/response.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../shared/logger.js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Allowed platform names — single source of truth. */
const ALLOWED_PLATFORMS = ['github', 'codeforces', 'leetcode', 'hackerrank'] as const;
type AllowedPlatform = typeof ALLOWED_PLATFORMS[number];

/** Shape a client may send for a single platform. */
interface PlatformUpdateInput {
  username?: string;
  handle?: string;
}

/** Top-level body the client may send to PUT /api/settings. */
interface SettingsUpdateInput {
  platforms?: Partial<Record<AllowedPlatform, PlatformUpdateInput>>;
}

// ---------------------------------------------------------------------------
// Zod validation — strict, no unknown keys
// ---------------------------------------------------------------------------

const platformFieldSchema = z.object({
  username: z.string().max(100).optional(),
  handle:   z.string().max(100).optional(),
}).strict();                              // rejects lastSyncedAt, userId, etc.

const updateSettingsSchema: z.ZodType<SettingsUpdateInput> = z.object({
  platforms: z.object({
    github:     platformFieldSchema.optional(),
    codeforces: platformFieldSchema.optional(),
    leetcode:   platformFieldSchema.optional(),
    hackerrank: platformFieldSchema.optional(),
  }).strict().optional(),                 // rejects platforms not in the list
}).strict();                              // rejects top-level unknowns

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mongo dot-notation $set object from validated input. */
function buildDotNotationUpdate(
  platforms: NonNullable<SettingsUpdateInput['platforms']>,
): Record<string, string> {
  const update: Record<string, string> = {};

  for (const [platform, fields] of Object.entries(platforms)) {
    if (!fields) continue;
    if (fields.username !== undefined) {
      update[`platforms.${platform}.username`] = fields.username;
    }
    if (fields.handle !== undefined) {
      update[`platforms.${platform}.handle`] = fields.handle;
    }
  }

  return update;
}

/** Produce a human-readable summary of what changed (for activity log). */
function describeChanges(
  platforms: NonNullable<SettingsUpdateInput['platforms']>,
): string {
  const parts: string[] = [];
  for (const [platform, fields] of Object.entries(platforms)) {
    if (!fields) continue;
    const changed = Object.keys(fields).join(', ');
    if (changed) parts.push(`${platform} (${changed})`);
  }
  return parts.length > 0
    ? `Updated platform settings: ${parts.join('; ')}`
    : 'Settings update (no changes)';
}

/** Map Zod formatted errors to Record<string, string[]> for the API. */
function mapZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!details[key]) details[key] = [];
    details[key].push(issue.message);
  }
  return details;
}

// ---------------------------------------------------------------------------
// GET /api/settings
// ---------------------------------------------------------------------------

/**
 * Retrieve the authenticated user's settings.
 * Creates a default document if none exists yet.
 */
export async function getSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    commonErrors.unauthorized(res);
    return;
  }

  let settings = await UserSettings.findOne({ userId });

  if (!settings) {
    settings = await UserSettings.create({ userId });
  }

  successResponse(res, settings, 'Settings retrieved successfully');
}

// ---------------------------------------------------------------------------
// PUT /api/settings
// ---------------------------------------------------------------------------

/**
 * Partially update platform usernames / handles.
 * Only explicitly provided fields are touched — existing data is never wiped.
 * Internal fields (userId, lastSyncedAt, timestamps) are rejected by Zod.
 */
export async function updateSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    commonErrors.unauthorized(res);
    return;
  }

  // 1. Validate — strict schemas reject unknown keys / internal fields
  const parseResult = updateSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    commonErrors.validationError(res, mapZodErrors(parseResult.error));
    return;
  }

  const { platforms } = parseResult.data;

  // 2. Guard: nothing to do
  if (!platforms || Object.keys(platforms).length === 0) {
    commonErrors.badRequest(res, 'No valid fields provided for update');
    return;
  }

  // 3. Build safe dot-notation update (never overwrites the whole object)
  const updateData = buildDotNotationUpdate(platforms);
  if (Object.keys(updateData).length === 0) {
    commonErrors.badRequest(res, 'No valid fields provided for update');
    return;
  }

  // 4. Persist
  const updatedSettings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { upsert: true, new: true, runValidators: true },
  );

  // 5. Activity log (fire-and-forget — never blocks the response)
  const activityDescription = describeChanges(platforms);
  ActivityEvent.create({
    userId: new Types.ObjectId(userId),
    type: 'settings_updated',
    title: 'Settings Updated',
    description: activityDescription,
    platform: 'devtrack',
    url: null,
    tags: ['settings'],
    metadata: {},
    occurredAt: new Date(),
  }).catch((err: unknown) => {
    logger.error('Failed to log settings activity', err);
  });

  successResponse(res, updatedSettings, 'Settings updated successfully');
}
