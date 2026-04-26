// src/modules/profile/profile.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware, validateBody } from '../../middleware/index.js';
import * as controller from './profile.controller.js';
import { z } from 'zod';

const router = Router();

const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  socialLinks: z.object({
    github: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    twitter: z.string().nullable().optional(),
    portfolio: z.string().nullable().optional(),
    leetcode: z.string().nullable().optional(),
    codeforces: z.string().nullable().optional(),
  }).optional(),
});

const techStackSchema = z.object({
  tag: z.string().min(1),
});

router.get('/', authMiddleware, asyncHandler(controller.getProfile));
router.patch('/', authMiddleware, validateBody(profileUpdateSchema), asyncHandler(controller.updateProfile));
router.get('/platforms', authMiddleware, asyncHandler(controller.getConnectedPlatforms));
router.get('/platforms/stats', authMiddleware, asyncHandler(controller.getPlatformStats));
router.post('/platforms/connect', authMiddleware, asyncHandler(controller.connectPlatform));
router.post('/tech-stack', authMiddleware, validateBody(techStackSchema), asyncHandler(controller.addTechStack));
router.delete('/tech-stack/:tag', authMiddleware, asyncHandler(controller.removeTechStack));

export default router;