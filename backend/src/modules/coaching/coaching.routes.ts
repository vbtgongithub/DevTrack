import { Router } from 'express';
import { CoachingController } from './coaching.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

export const coachingRoutes = Router();

coachingRoutes.use(authMiddleware);

coachingRoutes.get('/insights', CoachingController.getInsights);
coachingRoutes.get('/reflections', CoachingController.getReflections);
coachingRoutes.get('/momentum', CoachingController.getMomentum);
coachingRoutes.get('/focus', CoachingController.getFocusAnalytics);
