// src/modules/notifications/notification.routes.ts — Notification API routes
import { Router } from 'express';
import { notificationController } from './notification.controller.js';

const router = Router();

/**
 * GET /api/notifications - Get user notifications
 * Query params: limit, offset, unreadOnly
 */
router.get('/', notificationController.getNotifications.bind(notificationController));

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

/**
 * POST /api/notifications/:id/read - Mark notification as read
 */
router.post('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * POST /api/notifications/read-all - Mark all notifications as read
 */
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));

export default router;
