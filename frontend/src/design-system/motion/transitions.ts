// ============================================================================
// transitions.ts — Standardized Duration & Easing
// ============================================================================
// Centralized timing and easing functions for consistent motion.
// All durations respect prefers-reduced-motion.
// ============================================================================

import type { Transition } from 'framer-motion';
import { prefersReducedMotion } from './utils';

// ---------------------------------------------------------------------------
// Duration Tokens
// ---------------------------------------------------------------------------

export const durations = {
  instant: prefersReducedMotion ? 0 : 0.1,
  fast: prefersReducedMotion ? 0 : 0.15,
  base: prefersReducedMotion ? 0 : 0.22,
  calm: prefersReducedMotion ? 0 : 0.3,
  slow: prefersReducedMotion ? 0 : 0.4,
  overlay: prefersReducedMotion ? 0 : 0.3,
  drawer: prefersReducedMotion ? 0 : 0.35,
  toast: prefersReducedMotion ? 0 : 0.25,
} as const;

// ---------------------------------------------------------------------------
// Easing Functions
// ---------------------------------------------------------------------------

/**
 * Premium easing — Smooth, polished motion
 * Use for: most UI animations
 */
export const easePremium = [0.16, 1, 0.3, 1] as const;

/**
 * Smooth easing — Balanced acceleration/deceleration
 * Use for: transitions, state changes
 */
export const easeSmooth = [0.4, 0, 0.2, 1] as const;

/**
 * Gentle easing — Soft, calm motion
 * Use for: large elements, overlays
 */
export const easeGentle = [0.25, 0.1, 0.25, 1] as const;

/**
 * Sharp easing — Quick, responsive
 * Use for: buttons, toggles, micro-interactions
 */
export const easeSharp = [0.4, 0, 0.6, 1] as const;

// ---------------------------------------------------------------------------
// Transition Presets
// ---------------------------------------------------------------------------

export const fadeTransition: Transition = {
  duration: durations.base,
  ease: easePremium,
};

export const scaleTransition: Transition = {
  duration: durations.calm,
  ease: easeSmooth,
};

export const slideTransition: Transition = {
  duration: durations.base,
  ease: easePremium,
};

export const overlayTransition: Transition = {
  duration: durations.overlay,
  ease: easeGentle,
};

export const drawerTransition: Transition = {
  duration: durations.drawer,
  ease: easeSmooth,
};

export const toastTransition: Transition = {
  duration: durations.toast,
  ease: easePremium,
};

// ---------------------------------------------------------------------------
// Stagger Timing
// ---------------------------------------------------------------------------

export const staggerTiming = {
  fast: prefersReducedMotion ? 0 : 0.04,
  base: prefersReducedMotion ? 0 : 0.06,
  slow: prefersReducedMotion ? 0 : 0.08,
} as const;

export const staggerDelay = {
  none: 0,
  short: prefersReducedMotion ? 0 : 0.03,
  base: prefersReducedMotion ? 0 : 0.05,
  long: prefersReducedMotion ? 0 : 0.08,
} as const;

// ---------------------------------------------------------------------------
// Motion Constraints
// ---------------------------------------------------------------------------

/**
 * Maximum values for motion to prevent excessive animation
 */
export const motionConstraints = {
  maxHoverScale: 1.02,
  maxTapScale: 0.98,
  maxOverlayDuration: 0.4,
  maxStaggerDelay: 0.1,
  maxStaggerChildren: 0.08,
} as const;
