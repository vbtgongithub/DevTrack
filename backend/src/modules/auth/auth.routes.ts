// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { asyncHandler, validateBody, authMiddleware } from '../../middleware/index.js';
import * as controller from './auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
router.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
router.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
router.post('/logout', validateBody(refreshSchema), asyncHandler(controller.logout));
router.get('/me', authMiddleware, asyncHandler(controller.getMe));

export default router;