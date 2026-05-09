// src/modules/dashboard/dashboard.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as service from './dashboard.service.js';
import { successResponse } from '../../shared/response.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getDashboard(req.user!.id);
  successResponse(res, data, 'Dashboard data retrieved successfully');
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getDashboardStats(req.user!.id);
  successResponse(res, data, 'Dashboard stats retrieved successfully');
}

export async function getStreakData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getStreakData(req.user!.id);
  successResponse(res, data, 'Streak data retrieved successfully');
}

export async function getPlatformStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getPlatformStats(req.user!.id);
  successResponse(res, data, 'Platform stats retrieved successfully');
}

export async function getMissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getMissions(req.user!.id);
  successResponse(res, data, 'Missions retrieved successfully');
}

export async function getRecentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await service.getRecentActivity(req.user!.id, limit);
  successResponse(res, data, 'Recent activity retrieved successfully');
}

export async function getGithubDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = await service.getGithubDashboardStats(req.user!.id);
  successResponse(res, data, 'GitHub dashboard stats retrieved successfully');
}