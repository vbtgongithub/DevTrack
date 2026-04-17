// src/modules/platform-sync/sync.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import * as syncService from './sync.service.js';
import { successResponse } from '../../shared/response.js';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

router.post('/sync-all', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const results = await syncService.syncAllPlatforms(req.user!.id);
  successResponse(res, results, 'Platform sync completed');
}));

router.post('/sync/:platformName', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const platformName = req.params.platformName as string;
  const result = await syncService.syncPlatform(req.user!.id, platformName);
  successResponse(res, result, `Platform ${platformName} sync completed`);
}));

export default router;