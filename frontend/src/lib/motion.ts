/** Premium motion presets — calm, smooth, respects prefers-reduced-motion */

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motionDurations = {
  instant: prefersReducedMotion ? 0 : 0.1,
  fast: prefersReducedMotion ? 0 : 0.15,
  base: prefersReducedMotion ? 0 : 0.22,
  calm: prefersReducedMotion ? 0 : 0.3,
  slow: prefersReducedMotion ? 0 : 0.4,
} as const;

// Premium spring configs for emotionally intelligent motion
export const springSnappy = prefersReducedMotion
  ? { type: 'tween' as const, duration: 0 }
  : { type: 'spring' as const, stiffness: 420, damping: 32 };

export const springCalm = prefersReducedMotion
  ? { type: 'tween' as const, duration: 0 }
  : { type: 'spring' as const, stiffness: 280, damping: 28 };

export const springGentle = prefersReducedMotion
  ? { type: 'tween' as const, duration: 0 }
  : { type: 'spring' as const, stiffness: 200, damping: 25 };

export const springBounce = prefersReducedMotion
  ? { type: 'tween' as const, duration: 0 }
  : { type: 'spring' as const, stiffness: 300, damping: 20 };

// Premium easing functions
export const easePremium = [0.16, 1, 0.3, 1] as const;
export const easeSmooth = [0.4, 0, 0.2, 1] as const;
export const easeGentle = [0.25, 0.1, 0.25, 1] as const;

// Animation variants
export const fadeUp = {
  initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -8 },
};

export const fadeIn = {
  initial: { opacity: prefersReducedMotion ? 1 : 0 },
  animate: { opacity: 1 },
  exit: { opacity: prefersReducedMotion ? 1 : 0 },
};

export const scaleIn = {
  initial: { opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: prefersReducedMotion ? 1 : 0, scale: prefersReducedMotion ? 1 : 0.98 },
};

export const slideIn = {
  initial: { opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : 16 },
};

// Stagger configurations
export const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 12 },
  visible: { opacity: 1, y: 0, transition: springCalm },
};

export const staggerGrid = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { staggerChildren: 0.04, delayChildren: 0.03 },
  },
};

// Subtle interaction animations
export const pulseOnce = {
  scale: prefersReducedMotion ? 1 : [1, 1.015, 1],
  transition: { duration: 0.5, ease: easeGentle },
};

export const hoverLift = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: springSnappy,
};

export const hoverGlow = {
  whileHover: {
    boxShadow: prefersReducedMotion ? 'none' : '0 0 20px rgba(16, 185, 129, 0.3)'
  },
  transition: { duration: 0.3, ease: easeSmooth },
};

// Loading states
export const shimmer = {
  background: [
    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
    'linear-gradient(90deg, transparent 100%, rgba(255,255,255,0.05) 50%, transparent 0%)',
  ],
  transition: {
    duration: prefersReducedMotion ? 0 : 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

export const skeletonPulse = {
  animate: prefersReducedMotion
    ? { opacity: 0.5 }
    : { opacity: [0.5, 0.7, 0.5] },
  transition: {
    duration: prefersReducedMotion ? 0 : 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Route transitions
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: springCalm,
};

export const modalTransition = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: springGentle,
};

// Realtime state transitions
export const realtimeUpdate = {
  initial: { opacity: 0, scale: 0.95, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
  transition: springSnappy,
};

export const progressPulse = {
  animate: prefersReducedMotion
    ? { scale: 1 }
    : { scale: [1, 1.02, 1] },
  transition: {
    duration: prefersReducedMotion ? 0 : 0.6,
    ease: easeGentle,
  },
};
