// ============================================================================
// XpGainFloat.tsx — Floating "+N XP" Animation
// ============================================================================
// Displays a floating "+N XP" text that rises and fades when XP is gained.
// Triggered by gamificationStore.pendingXpGain.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../../store/gamificationStore';
import { prefersReducedMotion } from '../../../design-system/motion';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface XpGainFloatProps {
  /**
   * Position to render the float (relative to parent)
   */
  position?: 'top-right' | 'center' | 'top-left';
  
  /**
   * Optional className for positioning
   */
  className?: string;
}

/**
 * Floating "+N XP" animation component
 * 
 * Automatically displays when gamificationStore.pendingXpGain is set.
 * Clears itself after animation completes.
 * 
 * @example
 * // In XP progress widget
 * <div className="relative">
 *   <XpProgressBar />
 *   <XpGainFloat position="top-right" />
 * </div>
 */
export const XpGainFloat: React.FC<XpGainFloatProps> = ({
  position = 'top-right',
  className,
}) => {
  const pendingXpGain = useGamificationStore((s) => s.pendingXpGain);
  const setPendingXpGain = useGamificationStore((s) => s.setPendingXpGain);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pendingXpGain !== null && pendingXpGain > 0) {
      setShow(true);
      
      // Auto-clear after animation duration
      const timer = setTimeout(() => {
        setShow(false);
        setPendingXpGain(null);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [pendingXpGain, setPendingXpGain]);

  const positionClasses = {
    'top-right': 'absolute -top-2 -right-2',
    'center': 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-left': 'absolute -top-2 -left-2',
  };

  return (
    <AnimatePresence>
      {show && pendingXpGain !== null && (
        <motion.div
          initial={prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 0, scale: 0.8 }
          }
          animate={prefersReducedMotion
            ? { opacity: [0, 1, 1, 0] }
            : {
                opacity: [0, 1, 1, 0],
                y: [0, -20, -40, -60],
                scale: [0.8, 1.1, 1, 0.9],
              }
          }
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.8,
            ease: 'easeOut',
          }}
          className={className ?? positionClasses[position]}
          style={{ pointerEvents: 'none' }}
          role="status"
          aria-live="polite"
          aria-label={`Gained ${pendingXpGain} XP`}
        >
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 shadow-lg">
            <span className="text-sm font-black text-white tabular-nums">
              +{pendingXpGain}
            </span>
            <span className="text-xs font-black text-white/90 uppercase tracking-wider">
              XP
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XpGainFloat;
