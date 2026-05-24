// ============================================================================
// variants.ts — Reusable Framer Motion Variants
// ============================================================================
// Centralized animation variants for consistent motion across the app.
// All variants respect prefers-reduced-motion.
// ============================================================================

import type { Variants } from 'framer-motion';
import { prefersReducedMotion } from './utils';

// ---------------------------------------------------------------------------
// Fade Variants
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  initial: { opacity: prefersReducedMotion ? 1 : 0 },
  animate: { opacity: 1 },
  exit: { opacity: prefersReducedMotion ? 1 : 0 },
};

export const fadeUp: Variants = {
  initial: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    y: prefersReducedMotion ? 0 : 12 
  },
  animate: { opacity: 1, y: 0 },
  exit: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    y: prefersReducedMotion ? 0 : -8 
  },
};

export const fadeDown: Variants = {
  initial: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    y: prefersReducedMotion ? 0 : -12 
  },
  animate: { opacity: 1, y: 0 },
  exit: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    y: prefersReducedMotion ? 0 : 8 
  },
};

// ---------------------------------------------------------------------------
// Scale Variants
// ---------------------------------------------------------------------------

export const scaleIn: Variants = {
  initial: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    scale: prefersReducedMotion ? 1 : 0.96 
  },
  animate: { opacity: 1, scale: 1 },
  exit: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    scale: prefersReducedMotion ? 1 : 0.98 
  },
};

// ---------------------------------------------------------------------------
// Slide Variants
// ---------------------------------------------------------------------------

export const slideLeft: Variants = {
  initial: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    x: prefersReducedMotion ? 0 : 16 
  },
  animate: { opacity: 1, x: 0 },
  exit: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    x: prefersReducedMotion ? 0 : -16 
  },
};

export const slideRight: Variants = {
  initial: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    x: prefersReducedMotion ? 0 : -16 
  },
  animate: { opacity: 1, x: 0 },
  exit: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    x: prefersReducedMotion ? 0 : 16 
  },
};

// ---------------------------------------------------------------------------
// Stagger Variants
// ---------------------------------------------------------------------------

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { 
    opacity: prefersReducedMotion ? 1 : 0, 
    y: prefersReducedMotion ? 0 : 12 
  },
  visible: { 
    opacity: 1, 
    y: 0,
  },
};

// ---------------------------------------------------------------------------
// Overlay Variants
// ---------------------------------------------------------------------------

export const overlayEnter: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const overlayContent: Variants = {
  initial: prefersReducedMotion
    ? { opacity: 0 }
    : { scale: 0.9, opacity: 0, y: 20 },
  animate: prefersReducedMotion
    ? { opacity: 1 }
    : { scale: 1, opacity: 1, y: 0 },
  exit: prefersReducedMotion
    ? { opacity: 0 }
    : { scale: 0.95, opacity: 0, y: 10 },
};

// ---------------------------------------------------------------------------
// Toast/Notification Variants
// ---------------------------------------------------------------------------

export const toastEnter: Variants = {
  initial: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 16, scale: 0.95 },
  animate: prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, x: 0, scale: 1 },
  exit: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 16, scale: 0.95 },
};

// ---------------------------------------------------------------------------
// Drawer Variants
// ---------------------------------------------------------------------------

export const drawerSlideRight: Variants = {
  initial: { x: 420 },
  animate: { x: 0 },
  exit: { x: 420 },
};

export const drawerSlideLeft: Variants = {
  initial: { x: -420 },
  animate: { x: 0 },
  exit: { x: -420 },
};

// ---------------------------------------------------------------------------
// Interaction Variants
// ---------------------------------------------------------------------------

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: prefersReducedMotion 
    ? { scale: 1, y: 0 }
    : { scale: 1.01, y: -2 },
  tap: prefersReducedMotion
    ? { scale: 1 }
    : { scale: 0.99 },
};

export const buttonTap = {
  rest: { scale: 1 },
  hover: prefersReducedMotion
    ? { scale: 1 }
    : { scale: 1.02 },
  tap: prefersReducedMotion
    ? { scale: 1 }
    : { scale: 0.98 },
};

// ---------------------------------------------------------------------------
// Loading/Pulse Variants
// ---------------------------------------------------------------------------

export const shimmerPulse = {
  animate: prefersReducedMotion
    ? { opacity: 0.5 }
    : { opacity: [0.5, 0.7, 0.5] },
};

export const progressPulse = {
  animate: prefersReducedMotion
    ? { scale: 1 }
    : { scale: [1, 1.02, 1] },
};

export const glowPulse: Variants = {
  animate: prefersReducedMotion
    ? {}
    : {
        boxShadow: [
          '0 2px 10px rgba(var(--glow-color-rgb-fallback), 0.15)',
          '0 8px 30px rgba(var(--glow-color-rgb-fallback), 0.4)',
          '0 2px 10px rgba(var(--glow-color-rgb-fallback), 0.15)',
        ],
        transition: {
          duration: 3,
          ease: 'easeInOut',
          repeat: Infinity,
        },
      },
};

