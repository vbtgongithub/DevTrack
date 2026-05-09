// src/modules/platform-sync/sync.routes.ts
import { Router } from 'express';
import { asyncHandler, authMiddleware } from '../../middleware/index.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import * as controller from './sync.controller.js';

const router = Router();

// Rate limit sync: max 5 requests per 60 seconds per user
const syncRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5, message: 'Sync rate limit exceeded. Try again in a minute.' });

// POST /platforms/sync-all   — Sync all connected platforms
router.post('/sync-all', authMiddleware, syncRateLimit, asyncHandler(controller.syncAll));

// POST /platforms/sync/github — Dedicated GitHub sync from UserSettings
router.post('/sync/github', authMiddleware, syncRateLimit, asyncHandler(controller.syncGithub));

// POST /platforms/sync/:platformName — Sync a single platform
router.post('/sync/:platformName', authMiddleware, asyncHandler(controller.syncSingle));

// GET /platforms/sync-status — Read last sync state per platform
router.get('/sync-status', authMiddleware, asyncHandler(controller.getSyncStatus));

export default router;