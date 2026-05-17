// src/modules/notifications/notification.controller.ts — Notification API endpoints
// GET /api/notifications, POST /api/notifications/:id/read

import { Request, Response } from 'express';
import { notificationService } from './notification.service.js';
import { logger } from '../../shared/logger.js';

export const notificationController = {
  /**
   * GET /api/notifications - Get user notifications
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';

      const result = await notificationService.getNotifications(userId, limit, offset, unreadOnly);

      res.json(result);
    } catch (error) {
      logger.error('[notifications] Failed to get notifications', { error });
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  },

  /**
   * POST /api/notifications/:id/read - Mark notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const notificationId = req.params.id as string;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!notificationId) {
        res.status(400).json({ error: 'Notification ID required' });
        return;
      }

      await notificationService.markAsRead(userId, notificationId);

      res.json({ success: true });
    } catch (error) {
      logger.error('[notifications] Failed to mark as read', { error });
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  /**
   * POST /api/notifications/read-all - Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await notificationService.markAllAsRead(userId);

      res.json({ success: true });
    } catch (error) {
      logger.error('[notifications] Failed to mark all as read', { error });
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  /**
   * GET /api/notifications/unread-count - Get unread notification count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await notificationService.getUnreadCount(userId);

      res.json({ unread: count });
    } catch (error) {
      logger.error('[notifications] Failed to get unread count', { error });
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },
};
