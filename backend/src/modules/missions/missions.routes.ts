// src/modules/missions/missions.routes.ts
import { Router, type Response, type NextFunction } from 'express';
import { getUserMissions } from './missionProgress.service.js';
import { authMiddleware, type AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/missions — Get user's active missions
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
