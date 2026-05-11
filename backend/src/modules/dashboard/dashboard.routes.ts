// src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(controller.getDashboard));
router.get('/stats', authMiddleware, asyncHandler(controller.getDashboardStats));
router.get('/streak', authMiddleware, asyncHandler(controller.getStreakData));
router.get('/platforms', authMiddleware, asyncHandler(controller.getPlatformStats));
router.get('/missions', authMiddleware, asyncHandler(controller.getMissions));
router.get('/github', authMiddleware, asyncHandler(controller.getGithubDashboardStats));
router.get('/recent-activity', authMiddleware, asyncHandler(controller.getRecentActivity));
router.get('/achievements', authMiddleware, asyncHandler(controller.getAchievements));

export default router;