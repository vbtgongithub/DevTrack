// src/modules/activity/activity.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware, validateBody } from '../../middleware/index.js';
import * as controller from './activity.controller.js';
import { z } from 'zod';

const router = Router();

const activityCreateSchema = z.object({
  type: z.enum(['problem_solved', 'commit_pushed', 'pr_merged', 'project_created', 'project_updated', 'project_deleted', 'contest_participated', 'streak_milestone', 'note_added', 'settings_updated']),
  title: z.string().min(1),
  description: z.string(),
  platform: z.string(),
  url: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// Unified: GET /api/activity → events + heatmap in single response
router.get('/', authMiddleware, asyncHandler(controller.getAll));

// Granular (kept for backward compat)
router.get('/heatmap', authMiddleware, asyncHandler(controller.getHeatmap));
router.get('/feed', authMiddleware, asyncHandler(controller.getFeed));
router.get('/date/:date', authMiddleware, asyncHandler(controller.getActivitiesByDate));
router.post('/', authMiddleware, validateBody(activityCreateSchema), asyncHandler(controller.createActivity));
router.delete('/:id', authMiddleware, asyncHandler(controller.deleteActivity));

export default router;