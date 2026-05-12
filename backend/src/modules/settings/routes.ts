// src/modules/settings/routes.ts
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../../middleware/index.js';
import * as controller from './controller.js';

const router = Router();

/**
 * @route   GET /api/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', authMiddleware, asyncHandler(controller.getSettings));

/**
 * @route   PUT /api/settings
 * @desc    Update platform settings
 * @access  Private
 */
router.put('/', authMiddleware, asyncHandler(controller.updateSettings));

export default router;
