// ============================================================================
// SyncToast.tsx — Sync Status Notifications
// ============================================================================
// Shows sync completion status with auto-dismiss after 3 seconds.
// Positioned at bottom-right corner.
// ============================================================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface SyncToastProps {
  show: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const SyncToast: React.FC<SyncToastProps> = ({
  show,
  type,
  message,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, iconBg } = config[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-8 right-8 z-50 pointer-events-auto"
        >
          <div
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm',
              bgColor,
              borderColor,
            ].join(' ')}
          >
            <div className={['w-8 h-8 rounded-lg flex items-center justify-center', iconBg].join(' ')}>
              <Icon size={18} className={iconColor} />
            </div>
            <span className="text-sm font-bold text-dt-text max-w-xs">{message}</span>
            <button
              onClick={onClose}
              className="ml-2 text-dt-textSecondary/50 hover:text-dt-textSecondary transition-colors"
            >
              <XCircle size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SyncToast;
