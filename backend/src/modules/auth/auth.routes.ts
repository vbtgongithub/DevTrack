// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { asyncHandler, validateBody, authMiddleware, rateLimit } from '../../middleware/index.js';
import * as controller from './auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation.js';
import { env } from '../../config/env.js';

const router = Router();

// Strict rate limit for auth endpoints (5 attempts per 15 min per IP)
const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts. Please try again later.',
});

// Looser rate limit for refresh token endpoint
const refreshRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS_WINDOW_1H,
  message: 'Too many token refresh requests.',
});

router.post('/register', authRateLimit, validateBody(registerSchema), asyncHandler(controller.register));
router.post('/login', authRateLimit, validateBody(loginSchema), asyncHandler(controller.login));
router.post('/refresh', refreshRateLimit, validateBody(refreshSchema), asyncHandler(controller.refresh));
router.post('/logout', authMiddleware, validateBody(refreshSchema), asyncHandler(controller.logout));
router.get('/me', authMiddleware, asyncHandler(controller.getMe));

export default router;