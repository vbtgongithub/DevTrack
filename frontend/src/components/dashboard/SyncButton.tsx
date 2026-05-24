// ============================================================================
// SyncButton.tsx — Premium Sync Experience
// ============================================================================
// State machine: Idle → Syncing → Success → Cooldown
// Shows last sync time, progress indicator, and handles errors gracefully.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';

type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'cooldown';

interface SyncButtonProps {
  onSync?: () => Promise<void>;
  lastSyncTime?: Date | null;
  cooldownSeconds?: number;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  onSync,
  lastSyncTime,
  cooldownSeconds = 60, // 1 minute default (reduced for better UX)
}) => {
  const [state, setState] = useState<SyncState>('idle');
  const [progress, setProgress] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate time since last sync
  const getTimeSinceSync = () => {
    if (!lastSyncTime) return 'Never synced';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncTime.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Cooldown timer
  useEffect(() => {
    if (state === 'cooldown' && cooldownRemaining > 0) {
      const interval = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            setState('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state, cooldownRemaining]);

  // Format cooldown time
  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSync = async () => {
    if (state !== 'idle') return;

    setState('syncing');
    setProgress(0);
    setErrorMessage(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      if (onSync) {
        await onSync();
      } else {
        // Mock sync for demo
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      clearInterval(progressInterval);
      setProgress(100);
      setState('success');

      // Transition to cooldown after 2 seconds
      setTimeout(() => {
        setState('cooldown');
        setCooldownRemaining(cooldownSeconds);
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Sync failed');

      // Return to idle after 3 seconds
      setTimeout(() => {
        setState('idle');
        setErrorMessage(null);
      }, 3000);
    }
  };

  const isDisabled = state === 'syncing' || state === 'cooldown';

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Main Button */}
      <motion.button
        onClick={handleSync}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={[
          'relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg overflow-hidden',
          state === 'idle' && 'bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] text-white hover:shadow-[0_8px_30px_rgba(124,92,252,0.4)]',
          state === 'syncing' && 'bg-gradient-to-r from-[#7C5CFC] to-[#A78BFA] text-white cursor-wait',
          state === 'success' && 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
          state === 'error' && 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          state === 'cooldown' && 'bg-gray-300 text-gray-500 cursor-not-allowed',
        ].join(' ')}
      >
        {/* Progress bar background */}
        {state === 'syncing' && (
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white/20"
          />
        )}

        {/* Icon */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RefreshCw size={18} />
              </motion.div>
            )}
            {state === 'syncing' && (
              <motion.div
                key="syncing"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 360, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.2 } }}
              >
                <RefreshCw size={18} />
              </motion.div>
            )}
            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Check size={18} />
              </motion.div>
            )}
            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <AlertCircle size={18} />
              </motion.div>
            )}
            {state === 'cooldown' && (
              <motion.div
                key="cooldown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Clock size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text */}
        <span className="relative z-10">
          {state === 'idle' && 'Sync Now'}
          {state === 'syncing' && 'Syncing...'}
          {state === 'success' && 'Synced ✓'}
          {state === 'error' && 'Retry'}
          {state === 'cooldown' && formatCooldown(cooldownRemaining)}
        </span>
      </motion.button>

      {/* Last sync time */}
      <AnimatePresence>
        {state === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-dt-textSecondary/70 font-medium"
          >
            Last synced {getTimeSinceSync()}
          </motion.div>
        )}
        {state === 'error' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-red-600 font-medium"
          >
            {errorMessage}
          </motion.div>
        )}
        {state === 'cooldown' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-gray-500 font-medium"
          >
            Available in {formatCooldown(cooldownRemaining)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncButton;
