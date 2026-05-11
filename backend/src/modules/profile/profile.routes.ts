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
  roleTitle: z.string().max(100).nullable().optional(),
  targetRole: z.string().max(100).nullable().optional(),
  targetCompanies: z.array(z.string()).optional(),
  socialLinks: z.object({
    github: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    twitter: z.string().nullable().optional(),
    portfolio: z.string().nullable().optional(),
    leetcode: z.string().nullable().optional(),
    codeforces: z.string().nullable().optional(),
    codechef: z.string().nullable().optional(),
  }).optional(),
});

const techStackSchema = z.object({
  tag: z.string().min(1),
});

router.get('/', authMiddleware, asyncHandler(controller.getProfile));
router.patch('/', authMiddleware, validateBody(profileUpdateSchema), asyncHandler(controller.updateProfile));
router.get('/platforms', authMiddleware, asyncHandler(controller.getConnectedPlatforms));
router.post('/platforms/connect', authMiddleware, validateBody(z.object({
  platformName: z.string().min(1),
  username: z.string().min(1),
})), asyncHandler(controller.connectPlatform));
router.get('/platforms/stats', authMiddleware, asyncHandler(controller.getPlatformStats));
router.post('/tech-stack', authMiddleware, validateBody(techStackSchema), asyncHandler(controller.addTechStack));
router.delete('/tech-stack/:tag', authMiddleware, asyncHandler(controller.removeTechStack));

export default router;