// ============================================================================
// ToastContainer.tsx — Premium Toast Notification Container
// ============================================================================
// Renders toast notifications from the UI store.
// Supports: success, error, warning, info, action, and progress toasts.
// Handles online/offline detection, SSE disconnect indicators, and
// infrastructure degradation banners.
// ============================================================================

import React, { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { prefersReducedMotion, springSnappy } from '../../lib/motion';

const typeStyles = {
  success: {
    container: 'bg-white border border-emerald-200/60 shadow-[0_8px_30px_rgba(34,197,94,0.12)]',
    icon: 'text-emerald-500',
    title: 'text-dt-text font-bold',
    message: 'text-dt-textSecondary/80 font-medium',
    progress: 'bg-emerald-500',
    badge: 'bg-emerald-50 border border-emerald-200/40 text-emerald-600',
  },
  error: {
    container: 'bg-white border border-red-200/60 shadow-[0_8px_30px_rgba(239,68,68,0.12)]',
    icon: 'text-red-500',
    title: 'text-dt-text font-bold',
    message: 'text-dt-textSecondary/80 font-medium',
    progress: 'bg-red-500',
    badge: 'bg-red-50 border border-red-200/40 text-red-600',
  },
  warning: {
    container: 'bg-white border border-amber-200/60 shadow-[0_8px_30px_rgba(245,158,11,0.12)]',
    icon: 'text-amber-500',
    title: 'text-dt-text font-bold',
    message: 'text-dt-textSecondary/80 font-medium',
    progress: 'bg-amber-500',
    badge: 'bg-amber-50 border border-amber-200/40 text-amber-600',
  },
  info: {
    container: 'bg-white border border-blue-200/60 shadow-[0_8px_30px_rgba(59,130,246,0.12)]',
    icon: 'text-blue-500',
    title: 'text-dt-text font-bold',
    message: 'text-dt-textSecondary/80 font-medium',
    progress: 'bg-blue-500',
    badge: 'bg-blue-50 border border-blue-200/40 text-blue-600',
  },
};

const typeIcons = {
  success: 'check-circle',
  error: 'exclamation-triangle',
  warning: 'exclamation-circle',
  info: 'information-circle',
};

// ─── Infrastructure Degradation Banner ────────────────────────────────────

function InfrastructureBanner() {
  const isDegraded = useUIStore((s) => s.isInfrastructureDegraded);
  const setDegraded = useUIStore((s) => s.setInfrastructureDegraded);

  if (!isDegraded) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
          <Icon name="exclamation-triangle" size={14} className="text-amber-600" />
        </div>
        <span className="text-[13px] font-semibold text-amber-800">
          Operating in degraded mode — some features may be limited
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDegraded(false)}
          className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors px-2 py-1 rounded-lg hover:bg-amber-100/50"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-200/50"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

// ─── Connection Status Indicator ──────────────────────────────────────────

function ConnectionBanner() {
  const isOnline = useUIStore((s) => s.isOnline);
  const sseStatus = useUIStore((s) => s.sseStatus);
  const setOnline = useUIStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (isOnline && (sseStatus === 'connected' || sseStatus === 'disconnected')) {
    return null;
  }

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-200/50 px-4 py-2 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[13px] font-semibold text-red-700">
          You're offline — changes will sync when connection is restored
        </span>
      </div>
    );
  }

  // SSE reconnecting indicator
  if (sseStatus === 'reconnecting') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200/50 px-4 py-2 flex items-center justify-center gap-2">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </div>
        <span className="text-[13px] font-semibold text-amber-700">
          Reconnecting to real-time sync...
        </span>
      </div>
    );
  }

  return null;
}

// ─── Single Toast Item ────────────────────────────────────────────────────

import type { Toast } from '../../store/uiStore';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useUIStore((s) => s.removeToast);
  const styles = typeStyles[toast.type];

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
      transition={springSnappy}
      className={[
        'relative flex items-start gap-3 p-4 rounded-2xl border shadow-lg',
        'overflow-hidden transition-all duration-400',
        styles.container,
      ].join(' ')}
      role="alert"
    >
      {/* Progress bar for progress toasts */}
      {toast.progress && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dt-bg/40">
          <div
            className={['h-full transition-all duration-300', styles.progress].join(' ')}
            style={{
              width: `${(toast.progress.current / toast.progress.total) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Status icon */}
      <div className="shrink-0 mt-0.5">
        {toast.icon ? (
          <Icon name={toast.icon} size={20} className={styles.icon} />
        ) : (
          <Icon name={typeIcons[toast.type]} size={20} className={styles.icon} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={['text-sm', styles.title].join(' ')}>{toast.title}</p>
        {toast.message && (
          <p className={['text-sm mt-0.5 leading-relaxed', styles.message].join(' ')}>
            {toast.message}
          </p>
        )}

        {/* Inline action button */}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className={[
              'mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
              'text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95',
              styles.badge,
            ].join(' ')}
          >
            <Icon name="arrow-path" size={12} />
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <Icon name="x" size={14} className="text-dt-textMuted/50" />
      </button>
    </motion.div>
  );
};

// ─── Container ───────────────────────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const sseStatus = useUIStore((s) => s.sseStatus);
  const setSseStatus = useUIStore((s) => s.setSseStatus);

  return (
    <>
      {/* Infrastructure & connection banners above everything */}
      <InfrastructureBanner />
      <ConnectionBanner />

      {/* Toast stack — bottom right, above everything */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* SSE disconnected badge — subtle, persistent */}
      {sseStatus === 'disconnected' && toasts.length === 0 && (
        <div className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-dt-primary/10 shadow-md">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-dt-textSecondary uppercase tracking-widest">
            Live sync offline
          </span>
          <button
            type="button"
            onClick={() => setSseStatus('reconnecting')}
            className="flex items-center gap-1 text-[10px] font-bold text-dt-primary hover:text-dt-primaryHover transition-colors"
          >
            <Icon name="arrow-path" size={10} />
            Retry
          </button>
        </div>
      )}
    </>
  );
};
