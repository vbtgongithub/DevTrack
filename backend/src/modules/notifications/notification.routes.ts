// src/modules/notifications/notification.routes.ts — Notification API routes
import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authMiddleware, asyncHandler } from '../../middleware/index.js';

const router = Router();

// Apply authMiddleware globally to all notification routes
router.use(authMiddleware);

/**
 * GET /api/notifications - Get user notifications
 * Query params: limit, offset, unreadOnly
 */
router.get('/', asyncHandler(notificationController.getNotifications.bind(notificationController)));

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount.bind(notificationController)));

/**
 * POST /api/notifications/:id/read - Mark notification as read
 */
router.post('/:id/read', asyncHandler(notificationController.markAsRead.bind(notificationController)));

/**
 * POST /api/notifications/read-all - Mark all notifications as read
 */
router.post('/read-all', asyncHandler(notificationController.markAllAsRead.bind(notificationController)));

export default router;
