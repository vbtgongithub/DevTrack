// src/modules/xp/xp.routes.ts — XP API routes
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import type { AuthenticatedRequest } from '../../middleware/index.js';
import { getUserXp } from './processor.js';

const router = Router();

// GET /api/xp — current user's XP state
router.get('/', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const xp = await getUserXp(userId);

  if (!xp) {
    return res.json({
      success: true,
      data: {
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        xpInCurrentLevel: 0,
        progressPercent: 0,
        lifetimeStats: {
          totalProblemsSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          totalContests: 0,
          dailyStreaks: 0,
          longestStreak: 0,
          totalSyncs: 0,
          totalXpEarned: 0,
        },
      },
    });
  }

  res.json({ success: true, data: xp });
}));

export const xpRoutes = router;