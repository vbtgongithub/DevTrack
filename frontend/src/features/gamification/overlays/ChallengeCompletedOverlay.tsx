// ============================================================================
// ChallengeCompletedOverlay.tsx — Full-screen Challenge Completion Celebration
// ============================================================================
// Triggered by SSE challenge_completed event. Features gold confetti particles,
// bouncy animation card, xp reward text, and auto-dismiss after 5s.
// Respects prefers-reduced-motion.
// ============================================================================

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../../../store/gamificationStore';
import type { ChallengeCompletedPayload } from '../../../store/gamificationStore';
import { overlayEnter, bouncy, durations, prefersReducedMotion } from '../../../design-system/motion';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { Trophy, Sparkles, ChevronRight, Award } from 'lucide-react';

// ---------------------------------------------------------------------------
// Confetti Particle
// ---------------------------------------------------------------------------

interface GoldConfettiParticleProps {
  index: number;
}

const GoldConfettiParticle: React.FC<GoldConfettiParticleProps> = ({ index }) => {
  const angle = (index / 20) * 360;
  const distance = 120 + Math.random() * 180;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  const rotation = Math.random() * 720 - 360;
  const size = 6 + Math.random() * 6;
  const shape = index % 3; // 0 = circle, 1 = square, 2 = line

  // Sleek gold and sparkling highlights
  const color = [
    '#F59E0B', // Amber 500
    '#D97706', // Amber 600
    '#FBBF24', // Amber 400
    '#FFFFFF', // White shine
    '#FEF3C7', // Amber 100
  ][index % 5];

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={{
        x,
        y: y + 100,
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.5],
        rotate: rotation,
      }}
      transition={{
        duration: 1.5 + Math.random() * 0.5,
        ease: 'easeOut',
        delay: Math.random() * 0.3,
      }}
      className="absolute pointer-events-none"
      style={{ left: '50%', top: '50%' }}
    >
      <div
        style={{
          width: shape === 2 ? size * 2.5 : size,
          height: shape === 2 ? 3 : size,
          backgroundColor: color,
          borderRadius: shape === 0 ? '50%' : '2px',
        }}
      />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Challenge Completed Overlay Component
// ---------------------------------------------------------------------------

export const ChallengeCompletedOverlay: React.FC = () => {
  const activeOverlay = useGamificationStore((s) => s.activeOverlay);
  const dismissCurrentOverlay = useGamificationStore((s) => s.dismissCurrentOverlay);
  const show = activeOverlay?.type === 'challenge_completed';
  const data = show ? (activeOverlay.data as ChallengeCompletedPayload) : null;
  const dismiss = dismissCurrentOverlay;
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Focus trap
  useEffect(() => {
    if (show && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [show]);

  // 5s auto-dismiss useEffect with proper cleanup
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

  const goldColor = '#F59E0B';

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
            background: `radial-gradient(circle, ${goldColor}1E 0%, rgba(15, 23, 42, 0.8) 100%)`
          }}
          onClick={dismiss}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-completed-title"
          tabIndex={-1}
        >
          {/* Screen reader announcement */}
          <div role="alert" aria-live="assertive" className="sr-only">
            Daily Challenge Completed! You solved {data.title} and earned {data.xpReward} XP!
          </div>

          {/* Confetti - reduced count on mobile */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: isMobile ? 12 : 24 }, (_, i) => (
                <GoldConfettiParticle key={i} index={i} />
              ))}
            </div>
          )}

          {/* Card - premium aesthetics with white/gold gradients */}
          <motion.div
            initial={prefersReducedMotion
              ? { opacity: 0 }
              : { scale: 0.5, opacity: 0, rotateX: -20 }
            }
            animate={prefersReducedMotion
              ? { opacity: 1 }
              : { scale: 1, opacity: 1, rotateX: 0 }
            }
            exit={prefersReducedMotion
              ? { opacity: 0 }
              : { scale: 0.9, opacity: 0 }
            }
            transition={bouncy}
            className={[
              'relative rounded-[32px] overflow-hidden border border-amber-500/20',
              isMobile ? 'w-[calc(100vw-32px)] max-w-[360px]' : 'w-[380px] max-w-[90vw]',
            ].join(' ')}
            style={{
              background: `linear-gradient(160deg, rgba(245, 158, 11, 0.1) 0%, #ffffff 40%, rgba(245, 158, 11, 0.05) 100%)`,
              boxShadow: `0 40px 120px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.1)`,
              marginBottom: isMobile ? 'max(env(safe-area-inset-bottom), 16px)' : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gold glow */}
            <div
              className={[
                'absolute rounded-full blur-[80px] pointer-events-none opacity-40',
                isMobile ? '-top-16 -right-16 w-48 h-48' : '-top-20 -right-20 w-60 h-60',
              ].join(' ')}
              style={{ backgroundColor: goldColor }}
            />

            <div className={[
              'relative flex flex-col items-center text-center',
              isMobile ? 'p-6' : 'p-8',
            ].join(' ')}>
              
              {/* Trophy Badge */}
              <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0 }}
                animate={prefersReducedMotion ? {} : { scale: 1 }}
                transition={{ ...bouncy, delay: 0.2 }}
                className={isMobile ? 'mb-4' : 'mb-5'}
              >
                <div
                  className={[
                    'rounded-3xl flex items-center justify-center relative shadow-xl',
                    isMobile ? 'w-16 h-16' : 'w-20 h-20',
                  ].join(' ')}
                  style={{
                    background: `linear-gradient(135deg, ${goldColor}, #D97706)`,
                    boxShadow: `0 16px 48px rgba(245, 158, 11, 0.4)`,
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_50%)]" />
                  <Trophy className="text-white relative z-10" size={isMobile ? 32 : 38} />
                </div>
              </motion.div>

              {/* Title & Sparkles */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: durations.calm }}
              >
                <div className={['flex items-center gap-2 justify-center', isMobile ? 'mb-1.5' : 'mb-2'].join(' ')}>
                  <Sparkles size={isMobile ? 14 : 16} style={{ color: goldColor }} />
                  <span
                    id="challenge-completed-title"
                    className={[
                      'font-black uppercase tracking-[0.2em]',
                      isMobile ? 'text-xs' : 'text-sm',
                    ].join(' ')}
                    style={{ color: goldColor }}
                  >
                    DAILY CHALLENGE
                  </span>
                  <Sparkles size={isMobile ? 14 : 16} style={{ color: goldColor }} />
                </div>

                <h2 className={[
                  'font-black text-[#0F172A] tracking-tighter mb-2',
                  isMobile ? 'text-2xl' : 'text-3xl',
                ].join(' ')}>
                  Completed!
                </h2>
                
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl mb-4 inline-block max-w-full">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Problem Solved</p>
                  <p className="text-slate-800 font-extrabold text-sm truncate max-w-[240px]">
                    {data.title}
                  </p>
                </div>
              </motion.div>

              {/* XP Reward Card */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: durations.base }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm"
              >
                <Award size={18} className="text-amber-500 animate-pulse" />
                <span className="text-base font-black text-amber-700 tabular-nums">
                  +{data.xpReward} XP Reward
                </span>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: durations.base }}
                onClick={dismiss}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${goldColor}, #D97706)`,
                  boxShadow: `0 4px 20px rgba(245, 158, 11, 0.3)`,
                }}
              >
                Awesome!
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChallengeCompletedOverlay;
