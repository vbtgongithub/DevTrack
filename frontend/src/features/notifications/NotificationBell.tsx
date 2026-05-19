// ============================================================================
// NotificationBell.tsx — Notification Bell with Unread Badge
// ============================================================================
// Placed in the app topbar. Shows unread count, pulses on new notification.
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { bouncy, prefersReducedMotion } from '../../design-system/motion';

interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-2 text-zinc-400 hover:text-[#8B5CF6] rounded-xl hover:bg-[#8B5CF6]/5 transition-colors duration-200"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <Bell size={20} />

      {/* Unread badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={prefersReducedMotion ? {} : { scale: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0 }}
            transition={bouncy}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#EF4444] shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
          >
            <span className="text-[9px] font-black text-white tabular-nums px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse on new notification */}
      {unreadCount > 0 && !prefersReducedMotion && (
        <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#EF4444] animate-ping opacity-30 pointer-events-none" />
      )}
    </button>
  );
};

export default NotificationBell;
