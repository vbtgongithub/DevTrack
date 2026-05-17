// src/modules/streak/streak.routes.ts — Streak API routes
import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../../middleware/auth.js';
import { streakController } from './index.js';

const router = Router();

// Authentication middleware wrapper
const requireAuth = (req: AuthenticatedRequest, res: import('express').Response, next: import('express').NextFunction) => {
  authMiddleware(req, res, next);
};

// All streak routes require authentication
router.use(requireAuth);

// GET /streak - Get unified streak status
router.get('/', streakController.getStreak);

// GET /streak/:type - Get specific streak type (dsa, github, unified)
router.get('/:type', streakController.getStreakByType);

// POST /streak/record - Record activity (internal/triggered by other systems)
router.post('/record', streakController.recordActivity);

// POST /streak/freeze - Activate streak freeze
router.post('/freeze', streakController.activateFreeze);

export const streakRoutes = router;