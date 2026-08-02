// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import * as controller from './auth.controller.js';

const router = Router();

router.get('/me', authMiddleware, asyncHandler(controller.getMe));
router.post('/sse-handshake', authMiddleware, asyncHandler(controller.sseHandshake));
router.post('/logout', asyncHandler(controller.logout));

export default router;