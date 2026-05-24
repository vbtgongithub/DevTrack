// ============================================================================
// XpRevealSequence.tsx — Sequential XP Gain Animations
// ============================================================================
// Shows XP gains one by one with 300ms gap, then displays total summary.
// Triggered after sync completes with multiple XP sources.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';

export interface XpGainSource {
  amount: number;
  reason: string;
}

interface XpRevealSequenceProps {
  gains: XpGainSource[];
  onComplete?: () => void;
}

export const XpRevealSequence: React.FC<XpRevealSequenceProps> = ({ gains, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const totalXp = gains.reduce((sum, gain) => sum + gain.amount, 0);

  useEffect(() => {
    if (currentIndex < gains.length) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 800); // Show each gain for 800ms
      return () => clearTimeout(timer);
    } else if (currentIndex === gains.length && !showSummary) {
      // Show summary after last gain
      const timer = setTimeout(() => {
        setShowSummary(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (showSummary) {
      // Auto-dismiss after showing summary
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, gains.length, showSummary, onComplete]);

  if (gains.length === 0) return null;

  return (
    <div className="fixed top-24 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none">
      {/* Individual XP gains */}
      <AnimatePresence>
        {gains.slice(0, currentIndex).map((gain, index) => (
          <motion.div
            key={`${gain.reason}-${index}`}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: index * 0.1,
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-amber-200 shadow-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap size={16} className="text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-amber-600 tabular-nums leading-none">
                +{gain.amount} XP
              </span>
              <span className="text-xs text-dt-textSecondary/70 font-medium mt-0.5">
                {gain.reason}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Summary */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl border border-amber-400"
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tabular-nums leading-none drop-shadow-md">
                +{totalXp} XP
              </span>
              <span className="text-xs font-bold opacity-90 mt-1">
                Total from {gains.length} source{gains.length > 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XpRevealSequence;
