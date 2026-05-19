// ============================================================================
// springs.ts — Reusable Spring Presets
// ============================================================================
// Centralized spring configurations for consistent physics-based motion.
// All springs respect prefers-reduced-motion.
// ============================================================================

import type { Transition } from 'framer-motion';
import { prefersReducedMotion } from './utils';

// ---------------------------------------------------------------------------
// Spring Presets
// ---------------------------------------------------------------------------

/**
 * Snappy spring — Quick, responsive interactions
 * Use for: buttons, toggles, quick state changes
 */
export const snappy: Transition = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 420, damping: 32 };

/**
 * Smooth spring — Balanced, polished motion
 * Use for: cards, modals, general UI elements
 */
export const smooth: Transition = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 280, damping: 28 };

/**
 * Bouncy spring — Playful, energetic motion
 * Use for: celebrations, gamification, success states
 */
export const bouncy: Transition = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 300, damping: 20 };

/**
 * Gentle spring — Soft, calm motion
 * Use for: large overlays, page transitions, subtle animations
 */
export const gentle: Transition = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 200, damping: 25 };

/**
 * Overlay spring — Optimized for full-screen overlays
 * Use for: modals, drawers, full-screen celebrations
 */
export const overlaySpring: Transition = prefersReducedMotion
  ? { type: 'tween', duration: 0 }
  : { type: 'spring', stiffness: 400, damping: 30 };

// ---------------------------------------------------------------------------
// Spring Utilities
// ---------------------------------------------------------------------------

/**
 * Create a custom spring with specific parameters
 */
export const createSpring = (
  stiffness: number,
  damping: number
): Transition => {
  return prefersReducedMotion
    ? { type: 'tween', duration: 0 }
    : { type: 'spring', stiffness, damping };
};

/**
 * Create a spring with delay
 */
export const withDelay = (
  spring: Transition,
  delay: number
): Transition => {
  return prefersReducedMotion
    ? { ...spring, delay: 0 }
    : { ...spring, delay };
};
