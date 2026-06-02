// notificationStore.ts — Consolidated store delegator for backward compatibility
import { useAppStateStore } from './appStateStore.js';
import type { Notification, NotificationPriority, NotificationType } from './appStateStore.js';

export type { Notification, NotificationPriority, NotificationType };
export const useNotificationStore = useAppStateStore;
