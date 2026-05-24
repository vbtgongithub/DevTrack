// src/modules/daily-challenge/daily-challenge.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import { handleGetTodayChallenge } from './daily-challenge.controller.js';

const router = Router();

router.get('/today', authMiddleware, asyncHandler(handleGetTodayChallenge));

export const dailyChallengeRoutes = router;
export default dailyChallengeRoutes;
