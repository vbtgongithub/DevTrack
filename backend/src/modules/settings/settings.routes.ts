// src/modules/settings/settings.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware, validateBody } from '../../middleware/index.js';
import * as controller from './settings.controller.js';
import { z } from 'zod';

const router = Router();

const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
});

const avatarUpdateSchema = z.object({
  avatarUrl: z.string().url(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const platformConnectSchema = z.object({
  platformName: z.string(),
  username: z.string().min(1),
  accessToken: z.string().optional(),
});

const notificationUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  streakReminder: z.boolean().optional(),
  missionAlerts: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
});

const appearanceUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.string().optional(),
  compactMode: z.boolean().optional(),
  showHeatmap: z.boolean().optional(),
  heatmapColor: z.string().optional(),
  language: z.string().optional(),
});

const privacyUpdateSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends_only']).optional(),
  showActivity: z.boolean().optional(),
  showStreak: z.boolean().optional(),
  showProjects: z.boolean().optional(),
  showDsaProgress: z.boolean().optional(),
});

const accountDeleteSchema = z.object({
  password: z.string().min(1),
});

router.get('/', authMiddleware, asyncHandler(controller.getSettings));
router.get('/profile', authMiddleware, asyncHandler(controller.getSettings));
router.patch('/profile', authMiddleware, validateBody(profileUpdateSchema), asyncHandler(controller.updateProfile));
router.post('/profile/avatar', authMiddleware, validateBody(avatarUpdateSchema), asyncHandler(controller.updateAvatar));
router.post('/password', authMiddleware, validateBody(passwordChangeSchema), asyncHandler(controller.changePassword));
router.get('/platforms', authMiddleware, asyncHandler(controller.getConnectedPlatforms));
router.post('/platforms/connect', authMiddleware, validateBody(platformConnectSchema), asyncHandler(controller.connectPlatform));
router.post('/platforms/:platformId/disconnect', authMiddleware, asyncHandler(controller.disconnectPlatform));
router.patch('/notifications', authMiddleware, validateBody(notificationUpdateSchema), asyncHandler(controller.updateNotifications));
router.patch('/appearance', authMiddleware, validateBody(appearanceUpdateSchema), asyncHandler(controller.updateAppearance));
router.patch('/privacy', authMiddleware, validateBody(privacyUpdateSchema), asyncHandler(controller.updatePrivacy));
router.post('/account/delete', authMiddleware, validateBody(accountDeleteSchema), asyncHandler(controller.deleteAccount));
router.get('/export', authMiddleware, asyncHandler(controller.exportUserData));

export default router;