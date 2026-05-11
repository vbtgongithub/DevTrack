// ============================================================================
// ToastContainer.tsx — Toast Notification Container
// ============================================================================
// Renders toast notifications from the UI store.
// Provides success, error, warning, and info feedback.
// ============================================================================

import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { Icon } from './Icon';

const toastStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const toastIcons = {
  success: 'check-circle',
  error: 'exclamation-triangle',
  warning: 'exclamation-triangle',
  info: 'information-circle',
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg',
            'animate-[slideIn_200ms_ease-out]',
            toastStyles[toast.type],
          ].join(' ')}
          role="alert"
        >
          <Icon
            name={toastIcons[toast.type]}
            size={20}
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && (
              <p className="text-sm mt-1 opacity-90">{toast.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Dismiss notification"
          >
            <Icon name="x-mark" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};