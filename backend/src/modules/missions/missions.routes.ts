// src/modules/missions/missions.routes.ts
import { Router } from 'express';
import { getUserMissions } from './missionProgress.service.js';
import { authMiddleware, type AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/missions — Get user's active missions
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const missions = await getUserMissions(userId);

    res.json({
      success: true,
      data: missions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
