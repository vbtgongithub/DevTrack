// ============================================================================
// ConfirmDangerModal.tsx — Type-to-confirm modal for destructive actions
// ============================================================================
// Requires the user to type an exact confirmation phrase before the
// destructive action is enabled. Used for "Erase All Content" and
// "Permanently Delete Account".
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';

interface ConfirmDangerModalProps {
  open: boolean;
  title: string;
  /** Explanation of exactly what will happen. */
  message: string;
  /** Phrase the user must type verbatim to enable the confirm button. */
  confirmPhrase: string;
  /** Label for the destructive confirm button. */
  confirmLabel: string;
  /** Whether the action is in flight. */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDangerModal: React.FC<ConfirmDangerModalProps> = ({
  open,
  title,
  message,
  confirmPhrase,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}) => {
  const [typed, setTyped] = useState('');

  // Reset the input whenever the modal is (re)opened.
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  // Allow Escape to cancel when not mid-action.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  const isMatch = typed.trim() === confirmPhrase;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !pending && onCancel()}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="danger-modal-title"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.24)] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <Icon name="exclamation-triangle" size={20} className="text-red-600" />
                </div>
                <h3 id="danger-modal-title" className="text-lg font-black text-dt-text">
                  {title}
                </h3>
              </div>

              <p className="text-sm text-dt-textSecondary/80 leading-relaxed mb-5">
                {message}
              </p>

              <label className="block text-xs font-bold text-dt-textSecondary/70 mb-2">
                Type <span className="font-black text-red-600">{confirmPhrase}</span> to confirm
              </label>
              <input
                type="text"
                value={typed}
                autoFocus
                disabled={pending}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmPhrase}
                className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-[14px] text-sm font-semibold text-dt-text focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all disabled:opacity-50"
              />

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={pending}
                  className="px-5 py-2.5 text-sm font-bold text-dt-textSecondary/70 hover:text-dt-text hover:bg-black/5 rounded-full transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!isMatch || pending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-black hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pending && <Icon name="arrow-path" size={16} className="animate-spin" />}
                  {pending ? 'Working…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
