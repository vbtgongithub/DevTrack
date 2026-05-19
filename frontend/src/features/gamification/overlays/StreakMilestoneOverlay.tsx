// ============================================================================
// StreakMilestoneOverlay.tsx — Streak Milestone Celebration
// ============================================================================
// Fire-themed overlay triggered on SSE streak_milestone event (every 7 days).
// Features pulsing flame icon, counter animation, and auto-dismiss after 4s.
// ============================================================================

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../../store/gamificationStore';
import { overlayEnter, smooth, bouncy, durations, prefersReducedMotion } from '../../../design-system/motion';
import { Flame, Zap, ChevronRight } from 'lucide-react';

export const StreakMilestoneOverlay: React.FC = () => {
  const show = useGamificationStore((s) => s.showStreakMilestoneOverlay);
  const data = useGamificationStore((s) => s.streakMilestoneData);
  const dismiss = useGamificationStore((s) => s.dismissStreakMilestone);
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

  const milestoneLabel =
    data.days >= 100 ? 'LEGENDARY' :
    data.days >= 30 ? 'DEDICATED' :
    data.days >= 14 ? 'COMMITTED' :
    data.days >= 7 ? 'CONSISTENT' : 'GROWING';

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
          aria-label="Streak Milestone"
          tabIndex={-1}
        >
          {/* Screen reader announcement */}
          <div role="alert" aria-live="assertive" className="sr-only">
            {data.days} day streak milestone reached!
          </div>

          {/* Card */}
          <motion.div
            initial={prefersReducedMotion
              ? { opacity: 0 }
              : { scale: 0.6, opacity: 0, y: 40 }
            }
            animate={prefersReducedMotion
              ? { opacity: 1 }
              : { scale: 1, opacity: 1, y: 0 }
            }
            exit={prefersReducedMotion
              ? { opacity: 0 }
              : { scale: 0.9, opacity: 0, y: 20 }
            }
            transition={smooth}
            className="relative w-[360px] max-w-[90vw] rounded-[32px] overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #FEF3C7 0%, #FFFBEB 20%, #FFFFFF 50%, #FFF7ED 100%)',
              boxShadow: '0 40px 120px rgba(249,115,22,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fire glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[60px] opacity-30 bg-orange-400 pointer-events-none" />

            <div className="relative p-8 flex flex-col items-center text-center">
              {/* Pulsing flame */}
              <motion.div
                animate={prefersReducedMotion
                  ? {}
                  : { scale: [1, 1.2, 1] }
                }
                transition={prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: durations.slow, repeat: 2, ease: 'easeInOut' }
                }
                className="mb-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-xl relative"
                  style={{ boxShadow: '0 16px 48px rgba(249,115,22,0.4)' }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_50%)]" />
                  <Flame size={36} className="text-white relative z-10 drop-shadow-lg" />
                </div>
              </motion.div>

              {/* Milestone label */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: durations.calm }}
              >
                <span className="text-xs font-black uppercase tracking-[0.25em] text-orange-500 mb-3 block">
                  🔥 {milestoneLabel} 🔥
                </span>
              </motion.div>

              {/* Streak number */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ ...bouncy, delay: 0.3 }}
              >
                <span className="text-6xl font-black text-[#0F172A] tabular-nums tracking-tighter leading-none">
                  {data.days}
                </span>
              </motion.div>

              {/* Day streak text */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: durations.calm }}
                className="mt-2"
              >
                <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
                  Day Streak
                </h2>
                <p className="text-sm text-[#64748B] font-medium mt-1">
                  Your consistency is building compound growth
                </p>
              </motion.div>

              {/* XP bonus badge */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ ...smooth, delay: 0.5 }}
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200/60"
              >
                <Zap size={14} className="text-orange-500" />
                <span className="text-sm font-black text-orange-700 tabular-nums">
                  +{data.days >= 30 ? 100 : data.days >= 14 ? 50 : 25} XP Bonus
                </span>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: durations.base }}
                onClick={dismiss}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_4px_20px_rgba(249,115,22,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Keep Going
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakMilestoneOverlay;
