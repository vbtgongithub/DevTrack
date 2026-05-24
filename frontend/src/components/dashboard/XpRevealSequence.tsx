// ============================================================================
// XpRevealSequence.tsx — Post-Sync XP Reveal Animation
// ============================================================================
// Displays XP gains from sync in a cascading sequence with waterfall effect
// Shows one XP gain per platform with staggered timing
// Features: Waterfall animation, platform icons, source attribution
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

import { prefersReducedMotion } from '../../design-system/motion';

export interface XpRevealItem {
  platform: 'leetcode' | 'codeforces' | 'codechef' | 'github' | 'codeblocks';
  xpGain: number;
  reason: string;
  timestamp?: number;
}

interface XpRevealSequenceProps {
  items: XpRevealItem[];
  autoClose?: boolean;
  autoCloseDuration?: number;
  onComplete?: () => void;
}

const PLATFORM_CONFIG = {
  leetcode: { name: 'LeetCode', color: '#FFA116', icon: '💻' },
  codeforces: { name: 'Codeforces', color: '#1F8ACB', icon: '🏆' },
  codechef: { name: 'CodeChef', color: '#5B4638', icon: '👨‍🍳' },
  github: { name: 'GitHub', color: '#24292E', icon: '🐙' },
  codeblocks: { name: 'CodeBlocks', color: '#007AFF', icon: '📝' },
};

const WATERFALL_DELAY = 300; // ms between each reveal

/**
 * XpRevealSequence — Cascading XP gain display
 *
 * Usage:
 * <XpRevealSequence
 *   items={[
 *     { platform: 'leetcode', xpGain: 50, reason: 'Problem Solved' },
 *     { platform: 'github', xpGain: 30, reason: 'Commit' },
 *   ]}
 *   autoClose
 *   autoCloseDuration={5000}
 *   onComplete={() => console.log('Done!')}
 * />
 */
export const XpRevealSequence: React.FC<XpRevealSequenceProps> = ({
  items,
  autoClose = true,
  autoCloseDuration = 5000,
  onComplete,
}) => {
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const reducedMotion = prefersReducedMotion;

  // Stagger reveal of items
  useEffect(() => {
    if (items.length === 0) return;

    items.forEach((_, index) => {
      const delay = index * WATERFALL_DELAY;
      const timeout = setTimeout(() => {
        setRevealedIndices((prev) => new Set([...prev, index]));

        // Mark as complete when all items are revealed
        if (index === items.length - 1) {
          setIsComplete(true);

          // Auto-close after duration
          if (autoClose) {
            const closeTimeout = setTimeout(() => {
              onComplete?.();
            }, autoCloseDuration);

            return () => clearTimeout(closeTimeout);
          }
        }
      }, delay);

      return () => clearTimeout(timeout);
    });
  }, [items, autoClose, autoCloseDuration, onComplete]);

  const totalXp = items.reduce((sum, item) => sum + item.xpGain, 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isComplete ? 0 : 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex-shrink-0"
                  >
                    <Zap className="w-6 h-6 text-white drop-shadow-lg" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-white">Sync Complete!</h3>
                    <p className="text-xs text-white/80">XP from platforms</p>
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="text-2xl font-black text-white drop-shadow-lg"
                >
                  +{totalXp}
                </motion.div>
              </div>
            </div>

            {/* Items Container */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                  const isRevealed = revealedIndices.has(index);
                  const config = PLATFORM_CONFIG[item.platform];

                  return (
                    <motion.div
                      key={`${item.platform}-${index}`}
                      initial={
                        reducedMotion
                          ? { opacity: isRevealed ? 1 : 0 }
                          : { opacity: 0, x: -20 }
                      }
                      animate={
                        isRevealed
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: -20 }
                      }
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: reducedMotion ? 0 : 0.4,
                        ease: 'easeOut',
                      }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {config.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.reason}
                          </p>
                        </div>
                      </div>

                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isRevealed ? { scale: 1 } : { scale: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="flex-shrink-0 text-lg font-black text-amber-600 dark:text-amber-400"
                      >
                        +{item.xpGain}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer Summary */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-100 dark:bg-slate-700/50 px-4 py-3 border-t border-slate-200 dark:border-slate-600"
              >
                <p className="text-xs text-slate-600 dark:text-slate-300 text-center">
                  Keep up the streak! 🔥 ({items.length} platform{items.length > 1 ? 's' : ''})
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XpRevealSequence;
