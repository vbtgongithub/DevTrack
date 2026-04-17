// src/modules/profile/profile.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as service from './profile.service.js';
import { successResponse, commonErrors } from '../../shared/response.js';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const profile = await service.getProfile(req.user!.id);
  if (!profile) {
    commonErrors.notFound(res, 'Profile');
    return;
  }
  successResponse(res, profile, 'Profile retrieved successfully');
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const profile = await service.updateProfile(req.user!.id, req.body);
  if (!profile) {
    commonErrors.notFound(res, 'Profile');
    return;
  }
  successResponse(res, profile, 'Profile updated successfully');
}

export async function getConnectedPlatforms(req: AuthenticatedRequest, res: Response): Promise<void> {
  const platforms = await service.getConnectedPlatforms(req.user!.id);
  successResponse(res, platforms, 'Connected platforms retrieved successfully');
}

export async function getPlatformStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stats = await service.getPlatformStats(req.user!.id);
  successResponse(res, stats, 'Platform stats retrieved successfully');
}

export async function addTechStack(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tag } = req.body;
  const techStack = await service.addTechStack(req.user!.id, tag);
  successResponse(res, { techStack }, 'Tech stack added successfully');
}

export async function removeTechStack(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tag = req.params.tag as string;
  const techStack = await service.removeTechStack(req.user!.id, tag);
  successResponse(res, { techStack }, 'Tech stack removed successfully');
}