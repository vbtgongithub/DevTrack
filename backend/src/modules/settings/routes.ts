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
 * @desc    Update platform / notification / appearance settings
 * @access  Private
 */
router.put('/', authMiddleware, asyncHandler(controller.updateSettings));

/**
 * @route   POST /api/settings/reset-data
 * @desc    Erase all tracked content (keeps account, profile, settings)
 * @access  Private
 */
router.post('/reset-data', authMiddleware, asyncHandler(controller.resetData));

/**
 * @route   DELETE /api/settings/account
 * @desc    Permanently delete the account and all associated data
 * @access  Private
 */
router.delete('/account', authMiddleware, asyncHandler(controller.deleteAccount));

export default router;
