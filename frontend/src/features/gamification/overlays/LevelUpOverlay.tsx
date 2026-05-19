// ============================================================================
// LevelUpOverlay.tsx — Full-screen Level-Up Celebration
// ============================================================================
// Triggered by SSE level_up event. Features confetti particles, spring
// animation card, counter animation, and auto-dismiss after 5s.
// Respects prefers-reduced-motion.
// ============================================================================

import React, { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore, getLevelInfo } from '../../../store/gamificationStore';
import { overlayEnter, bouncy, durations, prefersReducedMotion } from '../../../design-system/motion';
import { useIsMobile } from '../../../hooks/useMediaQuery';
import { Star, Sparkles, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Confetti Particle
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ['#7C5CFC', '#A78BFA', '#F59E0B', '#22C55E', '#EC4899', '#06B6D4', '#EF4444'];

const ConfettiParticle: React.FC<{ index: number }> = ({ index }) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const angle = (index / 20) * 360;
  const distance = 120 + Math.random() * 180;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  const rotation = Math.random() * 720 - 360;
  const size = 6 + Math.random() * 6;
  const shape = index % 3; // 0 = circle, 1 = square, 2 = line

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
          borderRadius: shape === 0 ? '50%' : shape === 2 ? '2px' : '2px',
        }}
      />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Level-Up Overlay
// ---------------------------------------------------------------------------

export const LevelUpOverlay: React.FC = () => {
  const show = useGamificationStore((s) => s.showLevelUpOverlay);
  const data = useGamificationStore((s) => s.levelUpData);
  const dismiss = useGamificationStore((s) => s.dismissLevelUp);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Focus trap
  useEffect(() => {
    if (show && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [show]);

  // Keyboard dismiss
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') dismiss();
  }, [dismiss]);

  if (!data) return null;

  const levelInfo = getLevelInfo(data.newLevel);

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
          aria-labelledby="levelup-title"
          tabIndex={-1}
        >
          {/* Screen reader announcement */}
          <div role="alert" aria-live="assertive" className="sr-only">
            You reached Level {data.newLevel}! {levelInfo.name}
          </div>

          {/* Confetti - reduced count on mobile */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: isMobile ? 12 : 20 }, (_, i) => (
                <ConfettiParticle key={i} index={i} />
              ))}
            </div>
          )}

          {/* Card - adaptive sizing and safe area */}
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
              'relative rounded-[32px] overflow-hidden',
              isMobile ? 'w-[calc(100vw-32px)] max-w-[360px]' : 'w-[380px] max-w-[90vw]',
            ].join(' ')}
            style={{
              background: `linear-gradient(160deg, ${levelInfo.color}18, white 40%, ${levelInfo.color}08)`,
              boxShadow: `0 40px 120px ${levelInfo.color}30, 0 0 0 1px rgba(0,0,0,0.05)`,
              marginBottom: isMobile ? 'max(env(safe-area-inset-bottom), 16px)' : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow - reduced on mobile */}
            <div
              className={[
                'absolute rounded-full blur-[80px] pointer-events-none',
                isMobile ? '-top-16 -right-16 w-48 h-48 opacity-30' : '-top-20 -right-20 w-60 h-60 opacity-40',
              ].join(' ')}
              style={{ backgroundColor: levelInfo.color }}
            />

            <div className={[
              'relative flex flex-col items-center text-center',
              isMobile ? 'p-6' : 'p-8',
            ].join(' ')}>
              {/* Level up badge - adaptive size */}
              <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0 }}
                animate={prefersReducedMotion ? {} : { scale: 1 }}
                transition={{ ...bouncy, delay: 0.2 }}
                className={isMobile ? 'mb-3' : 'mb-4'}
              >
                <div
                  className={[
                    'rounded-3xl flex items-center justify-center relative shadow-xl',
                    isMobile ? 'w-16 h-16' : 'w-20 h-20',
                  ].join(' ')}
                  style={{
                    background: `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}CC)`,
                    boxShadow: `0 16px 48px ${levelInfo.color}50`,
                  }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)]" />
                  <span className={[
                    'font-black text-white relative z-10 tabular-nums',
                    isMobile ? 'text-2xl' : 'text-3xl',
                  ].join(' ')}>
                    {data.newLevel}
                  </span>
                </div>
              </motion.div>

              {/* Title - adaptive typography */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: durations.calm }}
              >
                <div className={['flex items-center gap-2', isMobile ? 'mb-1.5' : 'mb-2'].join(' ')}>
                  <Sparkles size={isMobile ? 14 : 16} style={{ color: levelInfo.color }} />
                  <span
                    id="levelup-title"
                    className={[
                      'font-black uppercase',
                      isMobile ? 'text-xs tracking-[0.15em]' : 'text-sm tracking-[0.2em]',
                    ].join(' ')}
                    style={{ color: levelInfo.color }}
                  >
                    Level Up
                  </span>
                  <Sparkles size={isMobile ? 14 : 16} style={{ color: levelInfo.color }} />
                </div>

                <h2 className={[
                  'font-black text-[#0F172A] tracking-tighter mb-1',
                  isMobile ? 'text-2xl' : 'text-3xl',
                ].join(' ')}>
                  {levelInfo.name}
                </h2>
                <p className={[
                  'text-[#64748B] font-medium',
                  isMobile ? 'text-xs' : 'text-sm',
                ].join(' ')}>
                  {levelInfo.title}
                </p>
              </motion.div>

              {/* XP Total */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: durations.base }}
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200/50"
              >
                <Star size={14} className="text-amber-500" />
                <span className="text-sm font-black text-amber-700 tabular-nums">
                  {data.totalXp.toLocaleString()} XP Total
                </span>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: durations.base }}
                onClick={dismiss}
                className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}CC)`,
                  boxShadow: `0 4px 20px ${levelInfo.color}40`,
                }}
              >
                Continue
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpOverlay;
