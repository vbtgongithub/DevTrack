// src/modules/settings/settings.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as service from './settings.service.js';
import { successResponse, commonErrors, mutationResponse } from '../../shared/response.js';

export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const settings = await service.getSettings(req.user!.id);
  if (!settings) {
    commonErrors.notFound(res, 'Settings');
    return;
  }
  successResponse(res, settings, 'Settings retrieved successfully');
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  await service.updateProfile(req.user!.id, req.body);
  successResponse(res, null, 'Profile updated successfully');
}

export async function updateAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  // TODO: Handle file upload
  const { avatarUrl } = req.body;
  await service.updateAvatar(req.user!.id, avatarUrl);
  successResponse(res, { avatarUrl }, 'Avatar updated successfully');
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  const success = await service.changePassword(req.user!.id, currentPassword, newPassword);
  if (!success) {
    commonErrors.badRequest(res, 'Invalid current password');
    return;
  }
  mutationResponse(res, true, 'Password changed successfully');
}

export async function getConnectedPlatforms(req: AuthenticatedRequest, res: Response): Promise<void> {
  const settings = await service.getSettings(req.user!.id);
  if (!settings) {
    commonErrors.notFound(res, 'Settings');
    return;
  }
  successResponse(res, settings.connectedPlatforms, 'Platforms retrieved successfully');
}

export async function connectPlatform(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { platformName, username, accessToken } = req.body;
  const platform = await service.connectPlatform(req.user!.id, platformName, username, accessToken);
  successResponse(res, platform, 'Platform connected successfully', 201);
}

export async function disconnectPlatform(req: AuthenticatedRequest, res: Response): Promise<void> {
  const success = await service.disconnectPlatform(req.user!.id, req.params.platformId);
  if (!success) {
    commonErrors.notFound(res, 'Platform');
    return;
  }
  mutationResponse(res, true, 'Platform disconnected successfully');
}

export async function updateNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  const notifications = await service.updateNotifications(req.user!.id, req.body);
  successResponse(res, notifications, 'Notifications updated successfully');
}

export async function updateAppearance(req: AuthenticatedRequest, res: Response): Promise<void> {
  const appearance = await service.updateAppearance(req.user!.id, req.body);
  successResponse(res, appearance, 'Appearance updated successfully');
}

export async function updatePrivacy(req: AuthenticatedRequest, res: Response): Promise<void> {
  const privacy = await service.updatePrivacy(req.user!.id, req.body);
  successResponse(res, privacy, 'Privacy updated successfully');
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { password } = req.body;
  const success = await service.deleteAccount(req.user!.id, password);
  if (!success) {
    commonErrors.badRequest(res, 'Invalid password');
    return;
  }
  mutationResponse(res, true, 'Account deleted successfully');
}

export async function exportUserData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.exportUserData(req.user!.id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="devtrack-export.json"');
  res.send(JSON.stringify(data, null, 2));
}