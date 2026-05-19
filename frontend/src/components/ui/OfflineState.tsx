// ============================================================================
// OfflineState.tsx — Offline/Reconnecting State
// ============================================================================
// Shows when app is offline or reconnecting to SSE.
// ============================================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { fadeDown, durations } from '../../design-system/motion';
import { Button } from './Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflineStateProps {
  /**
   * Is offline?
   */
  isOffline: boolean;
  
  /**
   * Is reconnecting?
   */
  isReconnecting?: boolean;
  
  /**
   * Retry handler
   */
  onRetry?: () => void;
  
  /**
   * Position
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'center';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OfflineState: React.FC<OfflineStateProps> = ({
  isOffline,
  isReconnecting = false,
  onRetry,
  position = 'top',
}) => {
  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          variants={fadeDown}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: durations.base }}
          className={[
            'fixed z-50',
            positionClasses[position],
            position === 'center' ? '' : 'w-full',
          ].join(' ')}
        >
          <div
            className={[
              'bg-amber-50 border-amber-200 text-amber-900',
              position === 'center'
                ? 'rounded-2xl border shadow-lg p-6 max-w-sm'
                : 'border-b py-3 px-4',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Icon + Message */}
              <div className="flex items-center gap-3">
                {isReconnecting ? (
                  <RefreshCw size={20} className="animate-spin text-amber-600" />
                ) : (
                  <WifiOff size={20} className="text-amber-600" />
                )}
                
                <div>
                  <p className="text-sm font-bold">
                    {isReconnecting ? 'Reconnecting...' : 'You\'re offline'}
                  </p>
                  <p className="text-xs text-amber-700">
                    {isReconnecting
                      ? 'Attempting to restore connection'
                      : 'Check your internet connection'}
                  </p>
                </div>
              </div>

              {/* Retry button */}
              {onRetry && !isReconnecting && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onRetry}
                  icon={<RefreshCw size={14} />}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineState;
