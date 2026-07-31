// src/modules/settings/controller.ts
// Hardened settings controller — platform username/handle updates only.
// Internal fields (userId, lastSyncedAt, timestamps) are never client-writable.

import type { Response } from 'express';
import { Types } from 'mongoose';
import { UserSettings } from '../../db/models/userSettings.model.js';
import { ActivityEvent } from '../../db/models/activityEvent.model.js';
import { successResponse, commonErrors } from '../../shared/response.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { logger } from '../../shared/logger.js';
import { z } from 'zod';
import { eraseUserContent, deleteUserAccount } from './danger.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Allowed platform names — single source of truth. */
const ALLOWED_PLATFORMS = ['github', 'codeforces', 'leetcode', 'codechef'] as const;
type AllowedPlatform = typeof ALLOWED_PLATFORMS[number];

/** Shape a client may send for a single platform. */
interface PlatformUpdateInput {
  username?: string;
  handle?: string;
}

/** User-facing preference sections the client may update. */
interface NotificationsUpdateInput {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  dailyDigest?: boolean;
  weeklyReport?: boolean;
  streakReminder?: boolean;
  missionAlerts?: boolean;
  projectUpdates?: boolean;
}

interface AppearanceUpdateInput {
  theme?: 'light' | 'dark' | 'system';
  accentColor?: string;
  compactMode?: boolean;
  showHeatmap?: boolean;
  heatmapColor?: string;
  language?: string;
}

/** Top-level body the client may send to PUT /api/settings. */
interface SettingsUpdateInput {
  platforms?: Partial<Record<AllowedPlatform, PlatformUpdateInput>>;
  notifications?: NotificationsUpdateInput;
  appearance?: AppearanceUpdateInput;
}

// ---------------------------------------------------------------------------
// Zod validation — strict, no unknown keys
// ---------------------------------------------------------------------------

const platformFieldSchema = z.object({
  username: z.string().max(100).optional(),
  handle:   z.string().max(100).optional(),
}).strict();

const notificationsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications:  z.boolean().optional(),
  dailyDigest:        z.boolean().optional(),
  weeklyReport:       z.boolean().optional(),
  streakReminder:     z.boolean().optional(),
  missionAlerts:      z.boolean().optional(),
  projectUpdates:     z.boolean().optional(),
}).strict();

const appearanceSchema = z.object({
  theme:        z.enum(['light', 'dark', 'system']).optional(),
  accentColor:  z.string().max(32).optional(),
  compactMode:  z.boolean().optional(),
  showHeatmap:  z.boolean().optional(),
  heatmapColor: z.string().max(32).optional(),
  language:     z.string().max(16).optional(),
}).strict();

const updateSettingsSchema: z.ZodType<SettingsUpdateInput> = z.object({
  platforms: z.object({
    github:     platformFieldSchema.optional(),
    codeforces: platformFieldSchema.optional(),
    leetcode:   platformFieldSchema.optional(),
    codechef:   platformFieldSchema.optional(),
  }).strict().optional(),
  notifications: notificationsSchema.optional(),
  appearance:    appearanceSchema.optional(),
}).strict();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDotNotationUpdate(
  data: SettingsUpdateInput,
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  // Platforms are nested two levels deep (platforms.<name>.<field>).
  if (data.platforms) {
    for (const [platform, fields] of Object.entries(data.platforms)) {
      if (!fields) continue;
      if (fields.username !== undefined) {
        update[`platforms.${platform}.username`] = fields.username;
      }
      if (fields.handle !== undefined) {
        update[`platforms.${platform}.handle`] = fields.handle;
      }
    }
  }

  // Preference sections are a single level deep (<section>.<field>).
  for (const section of ['notifications', 'appearance'] as const) {
    const fields = data[section];
    if (!fields) continue;
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        update[`${section}.${key}`] = value;
      }
    }
  }

  return update;
}

function describeChanges(data: SettingsUpdateInput): string {
  const parts: string[] = [];

  if (data.platforms) {
    for (const [platform, fields] of Object.entries(data.platforms)) {
      if (!fields) continue;
      const changed = Object.keys(fields).join(', ');
      if (changed) parts.push(`${platform} (${changed})`);
    }
  }

  for (const section of ['notifications', 'appearance'] as const) {
    const fields = data[section];
    if (!fields) continue;
    const changed = Object.keys(fields).join(', ');
    if (changed) parts.push(`${section} (${changed})`);
  }

  return parts.length > 0
    ? `Updated settings: ${parts.join('; ')}`
    : 'Settings update (no changes)';
}

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

export async function updateSettings(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    commonErrors.unauthorized(res);
    return;
  }

  const parseResult = updateSettingsSchema.safeParse(req.body);
  if (!parseResult.success) {
    commonErrors.validationError(res, mapZodErrors(parseResult.error));
    return;
  }

  const data = parseResult.data;

  const updateData = buildDotNotationUpdate(data);
  if (Object.keys(updateData).length === 0) {
    commonErrors.badRequest(res, 'No valid fields provided for update');
    return;
  }

  const updatedSettings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { upsert: true, new: true, runValidators: true },
  );

  const activityDescription = describeChanges(data);
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

// ---------------------------------------------------------------------------
// POST /api/settings/reset-data
// Erase all tracked content for the user. Account, profile and settings are
// preserved. Requires an explicit confirmation phrase to guard against
// accidental or CSRF-style triggers.
// ---------------------------------------------------------------------------

export async function resetData(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    commonErrors.unauthorized(res);
    return;
  }

  if (req.body?.confirmation !== 'ERASE') {
    commonErrors.badRequest(
      res,
      'Confirmation phrase required. Send { "confirmation": "ERASE" } to erase content.',
    );
    return;
  }

  const cleared = await eraseUserContent(userId);

  ActivityEvent.create({
    userId: new Types.ObjectId(userId),
    type: 'settings_updated',
    title: 'Workspace Content Erased',
    description: 'All tracked activity, progress, and stats were erased by the user.',
    platform: 'devtrack',
    url: null,
    tags: ['settings', 'danger-zone'],
    metadata: { cleared },
    occurredAt: new Date(),
  }).catch((err: unknown) => {
    logger.error('Failed to log reset activity', err);
  });

  successResponse(res, { cleared }, 'All workspace content erased successfully');
}

// ---------------------------------------------------------------------------
// DELETE /api/settings/account
// Permanently delete the account, all associated data, and the Clerk identity.
// Requires an explicit confirmation phrase.
// ---------------------------------------------------------------------------

export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;
  const clerkId = req.user?.clerkId;
  if (!userId || !clerkId) {
    commonErrors.unauthorized(res);
    return;
  }

  if (req.body?.confirmation !== 'DELETE') {
    commonErrors.badRequest(
      res,
      'Confirmation phrase required. Send { "confirmation": "DELETE" } to delete the account.',
    );
    return;
  }

  const cleared = await deleteUserAccount(userId, clerkId);

  successResponse(res, { cleared }, 'Account permanently deleted');
}
