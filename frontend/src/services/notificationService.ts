// ============================================================================
// notificationService.ts — Notification API Service
// ============================================================================
// HTTP-only. Returns raw API types. No transformations.
// ============================================================================

import axiosClient from '../utils/axiosClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ApiNotificationsResponse {
  success: boolean;
  data: {
    notifications: ApiNotification[];
    total: number;
    unreadCount: number;
  };
}

export interface ApiUnreadCountResponse {
  success: boolean;
  data: { unreadCount: number };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const notificationService = {
  /**
   * GET /notifications — paginated notification list.
   */
  getAll: async (params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<ApiNotificationsResponse['data']> => {
    const { data } = await axiosClient.get<ApiNotificationsResponse>('/notifications', {
      params,
    });
    if (!data.success) throw new Error('Failed to load notifications');
    return data.data;
  },

  /**
   * GET /notifications/unread-count — lightweight unread badge count.
   */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await axiosClient.get<ApiUnreadCountResponse>(
      '/notifications/unread-count'
    );
    if (!data.success) throw new Error('Failed to load unread count');
    return data.data.unreadCount;
  },

  /**
   * POST /api/notifications/:id/read — mark a single notification as read.
   */
  markRead: async (id: string): Promise<void> => {
    await axiosClient.post(`/notifications/${id}/read`);
  },

  /**
   * POST /api/notifications/read-all — mark all notifications as read.
   */
  markAllRead: async (): Promise<void> => {
    await axiosClient.post('/notifications/read-all');
  },
};
