// src/modules/onboarding/onboarding.routes.ts — Onboarding API Router
import { Router } from 'express';
import { onboardingController } from './onboarding.controller.js';
import { authMiddleware, asyncHandler } from '../../middleware/index.js';

const router = Router();

// Apply authMiddleware globally to all onboarding routes
router.use(authMiddleware);

router.get('/progress', asyncHandler(onboardingController.getProgress.bind(onboardingController)));
router.post('/step/:stepId/complete', asyncHandler(onboardingController.completeStep.bind(onboardingController)));
router.post('/step/:stepId/skip', asyncHandler(onboardingController.skipStep.bind(onboardingController)));
router.post('/complete', asyncHandler(onboardingController.completeOnboarding.bind(onboardingController)));

export default router;
