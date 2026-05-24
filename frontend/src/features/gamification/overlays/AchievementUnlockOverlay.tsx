// ============================================================================
// AchievementUnlockOverlay.tsx — Achievement Unlock Celebration
// ============================================================================
// Rarity-colored glow + slide-up card for achievement unlocks.
// ============================================================================

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../../store/gamificationStore';
import { overlayEnter, bouncy, smooth, durations, prefersReducedMotion } from '../../../design-system/motion';
import { Trophy, ChevronRight } from 'lucide-react';

const RARITY_STYLES = {
  common:    { color: '#64748B', glow: 'rgba(100,116,139,0.2)',  bg: '#F1F5F9', label: 'Common' },
  rare:      { color: '#3B82F6', glow: 'rgba(59,130,246,0.25)',  bg: '#EFF6FF', label: 'Rare' },
  epic:      { color: '#8B5CF6', glow: 'rgba(139,92,246,0.3)',   bg: '#F5F3FF', label: 'Epic' },
  legendary: { color: '#F59E0B', glow: 'rgba(245,158,11,0.35)', bg: '#FFFBEB', label: 'Legendary' },
};

export const AchievementUnlockOverlay: React.FC = () => {
  const activeOverlay = useGamificationStore((s) => s.activeOverlay);
  const dismissCurrentOverlay = useGamificationStore((s) => s.dismissCurrentOverlay);
  const show = activeOverlay?.type === 'achievement_unlocked';
  const data = show ? (activeOverlay.data as { id: string; name: string; description: string; icon: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' }) : null;
  const dismiss = dismissCurrentOverlay;
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [show]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') dismiss();
  }, [dismiss]);

  if (!data) return null;

  const rarity = RARITY_STYLES[data.rarity] ?? RARITY_STYLES.common;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={overlayRef}
          variants={overlayEnter}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: durations.overlay }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md"
          onClick={dismiss}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Achievement Unlocked"
          tabIndex={-1}
        >
          <div role="alert" aria-live="assertive" className="sr-only">
            Achievement unlocked: {data.name}
          </div>

          <motion.div
            initial={prefersReducedMotion
              ? { opacity: 0 }
              : { y: 60, opacity: 0, scale: 0.9 }
            }
            animate={prefersReducedMotion
              ? { opacity: 1 }
              : { y: 0, opacity: 1, scale: 1 }
            }
            exit={prefersReducedMotion
              ? { opacity: 0 }
              : { y: 20, opacity: 0, scale: 0.95 }
            }
            transition={smooth}
            className="relative w-[360px] max-w-[90vw] rounded-[32px] overflow-hidden bg-white"
            style={{
              boxShadow: `0 40px 120px ${rarity.glow}, 0 0 0 1px rgba(0,0,0,0.05)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rarity glow */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-[80px] opacity-25 pointer-events-none"
              style={{ backgroundColor: rarity.color }}
            />

            <div className="relative p-8 flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0, rotate: -30 }}
                animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0 }}
                transition={{ ...bouncy, delay: 0.2 }}
                className="mb-4"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative"
                  style={{
                    background: `linear-gradient(135deg, ${rarity.color}, ${rarity.color}CC)`,
                    boxShadow: `0 16px 48px ${rarity.glow}`,
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)]" />
                  <span className="text-3xl relative z-10">{data.icon}</span>
                </div>
              </motion.div>

              {/* Rarity badge */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: durations.base }}
              >
                <span
                  className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border"
                  style={{
                    color: rarity.color,
                    backgroundColor: rarity.bg,
                    borderColor: `${rarity.color}30`,
                  }}
                >
                  {rarity.label}
                </span>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: durations.calm }}
                className="mt-4"
              >
                <div className="flex items-center gap-1.5 mb-1 justify-center">
                  <Trophy size={14} style={{ color: rarity.color }} />
                  <span className="text-xs font-black uppercase tracking-[0.15em]"
                    style={{ color: rarity.color }}
                  >
                    Achievement Unlocked
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">
                  {data.name}
                </h2>
                <p className="text-sm text-[#64748B] font-medium mt-1 max-w-[280px]">
                  {data.description}
                </p>
              </motion.div>

              {/* Dismiss */}
              <motion.button
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: durations.base }}
                onClick={dismiss}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${rarity.color}, ${rarity.color}CC)`,
                  boxShadow: `0 4px 20px ${rarity.glow}`,
                }}
              >
                Awesome
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockOverlay;
