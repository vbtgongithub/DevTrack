// src/modules/activity/activity.controller.ts
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import * as service from './activity.service.js';
import { successResponse, commonErrors, deleteResponse, mutationResponse } from '../../shared/response.js';

export async function getHeatmap(req: AuthenticatedRequest, res: Response): Promise<void> {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const data = await service.getHeatmap(req.user!.id, year);
  successResponse(res, data, 'Heatmap retrieved successfully');
}

export async function getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
  const filters = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    platform: req.query.platform as string,
    type: req.query.type as string,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
  };
  const data = await service.getFeed(req.user!.id, filters);
  successResponse(res, data, 'Activity feed retrieved successfully');
}

export async function getActivitiesByDate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const date = req.params.date as string;
  const activities = await service.getActivitiesByDate(req.user!.id, date);
  successResponse(res, activities, 'Activities retrieved successfully');
}

export async function createActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const activity = await service.createActivity(req.user!.id, req.body);
  successResponse(res, activity, 'Activity created successfully', 201);
}

export async function deleteActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const deleted = await service.deleteActivity(req.user!.id, id);
  if (!deleted) {
    commonErrors.notFound(res, 'Activity');
    return;
  }
  deleteResponse(res, id, 'Activity deleted successfully');
}