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
  const activeOverlay = useGamificationStore((s) => s.activeOverlay);
  const dismissCurrentOverlay = useGamificationStore((s) => s.dismissCurrentOverlay);
  const show = activeOverlay?.type === 'streak_milestone';
  const data = show ? (activeOverlay.data as { days: number }) : null;
  const dismiss = dismissCurrentOverlay;
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (show && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [show]);

  // Robust 5s auto-dismiss useEffect with proper cleanup
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [show, dismiss]);

  // Keyboard dismiss
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') dismiss();
  }, [dismiss]);

  if (!data) return null;

  const milestoneLabel =
    data.days >= 100 ? 'LEGENDARY' :
    data.days >= 30 ? 'DEDICATED' :
    data.days >= 14 ? 'COMMITTED' :
    data.days >= 7 ? 'CONSISTENT' : 'GROWING';

  const milestone =
    data.days >= 100 ? 'legendary' :
    data.days >= 30 ? 'gold' :
    data.days >= 14 ? 'epic' : 'rare';

  // Rich fire/glow intensity configurations
  const themes = {
    legendary: {
      cardBg: 'linear-gradient(160deg, #F3E8FF 0%, #FAF5FF 20%, #FFFFFF 50%, #FDF4FF 100%)',
      shadow: '0 40px 120px rgba(168,85,247,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
      glowColor: 'bg-purple-500',
      glowOpacity: 'opacity-40',
      badgeBg: 'from-purple-600 via-fuchsia-500 to-pink-600',
      badgeShadow: '0 16px 48px rgba(168,85,247,0.5)',
      btnBg: 'from-purple-600 to-fuchsia-500',
      btnShadow: '0 4px 20px rgba(168,85,247,0.4)',
      textAccent: 'text-purple-600',
      bgPillXp: 'bg-purple-50 border-purple-200/60',
      textPillXp: 'text-purple-700',
      bgPillMult: 'bg-fuchsia-50 border-fuchsia-200/60',
      textPillMult: 'text-fuchsia-700'
    },
    gold: {
      cardBg: 'linear-gradient(160deg, #FEF3C7 0%, #FFFBEB 20%, #FFFFFF 50%, #FFF7ED 100%)',
      shadow: '0 40px 120px rgba(234,179,8,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
      glowColor: 'bg-yellow-400',
      glowOpacity: 'opacity-35',
      badgeBg: 'from-yellow-500 via-amber-500 to-yellow-600',
      badgeShadow: '0 16px 48px rgba(234,179,8,0.45)',
      btnBg: 'from-yellow-500 to-amber-500',
      btnShadow: '0 4px 20px rgba(234,179,8,0.35)',
      textAccent: 'text-yellow-600',
      bgPillXp: 'bg-orange-50 border-orange-200/60',
      textPillXp: 'text-orange-700',
      bgPillMult: 'bg-amber-50 border-amber-200/60',
      textPillMult: 'text-amber-700'
    },
    epic: {
      cardBg: 'linear-gradient(160deg, #FFEDD5 0%, #FFF7ED 20%, #FFFFFF 50%, #FFF7ED 100%)',
      shadow: '0 40px 120px rgba(249,115,22,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
      glowColor: 'bg-orange-500',
      glowOpacity: 'opacity-30',
      badgeBg: 'from-orange-500 via-red-500 to-orange-600',
      badgeShadow: '0 16px 48px rgba(249,115,22,0.4)',
      btnBg: 'from-orange-500 to-red-500',
      btnShadow: '0 4px 20px rgba(249,115,22,0.3)',
      textAccent: 'text-orange-600',
      bgPillXp: 'bg-orange-50 border-orange-200/60',
      textPillXp: 'text-orange-700',
      bgPillMult: 'bg-amber-50 border-amber-200/60',
      textPillMult: 'text-amber-700'
    },
    rare: {
      cardBg: 'linear-gradient(160deg, #FFFBEB 0%, #FFFFFF 50%, #FFFBEB 100%)',
      shadow: '0 30px 90px rgba(249,115,22,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
      glowColor: 'bg-orange-400',
      glowOpacity: 'opacity-20',
      badgeBg: 'from-orange-400 via-amber-400 to-orange-500',
      badgeShadow: '0 16px 48px rgba(249,115,22,0.3)',
      btnBg: 'from-orange-400 to-amber-500',
      btnShadow: '0 4px 20px rgba(249,115,22,0.25)',
      textAccent: 'text-orange-500',
      bgPillXp: 'bg-orange-50 border-orange-200/60',
      textPillXp: 'text-orange-700',
      bgPillMult: 'bg-amber-50 border-amber-200/60',
      textPillMult: 'text-amber-700'
    }
  };

  const activeTheme = themes[milestone];

  // Dynamic XP Bonus and Multiplier Active values
  const xpBonus = data.days >= 100 ? 500 : data.days >= 30 ? 250 : data.days >= 14 ? 100 : data.days >= 7 ? 50 : 25;
  const multiplier = Math.min(1.0 + Math.floor(data.days / 7) * 0.1, 2.0);

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
          className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md"
          style={{
            background: milestone === 'legendary'
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%)'
              : 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)'
          }}
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
            className="relative w-[360px] max-w-[90vw] rounded-[32px] overflow-hidden border border-white/20"
            style={{
              background: activeTheme.cardBg,
              boxShadow: activeTheme.shadow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fire glow */}
            <div className={[
              'absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-[60px] pointer-events-none',
              activeTheme.glowColor,
              activeTheme.glowOpacity
            ].join(' ')} />

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
                <div className={[
                  'w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-xl relative',
                  activeTheme.badgeBg
                ].join(' ')}
                  style={{ boxShadow: activeTheme.badgeShadow }}
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
                <span className={[
                  'text-xs font-black uppercase tracking-[0.25em] mb-3 block',
                  activeTheme.textAccent
                ].join(' ')}>
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
                <p className="text-sm text-[#64748B] font-medium mt-1 leading-relaxed">
                  Your consistency is building compound growth
                </p>
              </motion.div>

              {/* XP bonus and multiplier status badge */}
              <div className="mt-5 flex flex-col items-center gap-2.5 w-full">
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                  transition={{ ...smooth, delay: 0.5 }}
                  className={[
                    'flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border w-fit shadow-sm',
                    activeTheme.bgPillXp
                  ].join(' ')}
                >
                  <Zap size={13} className="text-orange-500 shrink-0" />
                  <span className={[
                    'text-xs font-black tabular-nums',
                    activeTheme.textPillXp
                  ].join(' ')}>
                    +{xpBonus} XP Streak Bonus
                  </span>
                </motion.div>

                {multiplier > 1.0 && (
                  <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    transition={{ ...smooth, delay: 0.55 }}
                    className={[
                      'flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full border w-fit shadow-sm',
                      activeTheme.bgPillMult
                    ].join(' ')}
                  >
                    <span className={[
                      'text-xs font-black tabular-nums',
                      activeTheme.textPillMult
                    ].join(' ')}>
                      🔥 {multiplier.toFixed(1)}× XP Multiplier Active!
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Continue button */}
              <motion.button
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: durations.base }}
                onClick={dismiss}
                className={[
                  'mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                  activeTheme.btnBg
                ].join(' ')}
                style={{ boxShadow: activeTheme.btnShadow }}
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
