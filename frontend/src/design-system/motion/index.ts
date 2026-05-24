// ============================================================================
// motion/index.ts — Motion System Exports
// ============================================================================
// Centralized motion system for DevTrack.
// Provides consistent, accessible animations across the app.
// ============================================================================

// Variants
export {
  fadeIn,
  fadeUp,
  fadeDown,
  scaleIn,
  slideLeft,
  slideRight,
  staggerContainer,
  staggerItem,
  overlayEnter,
  overlayContent,
  toastEnter,
  drawerSlideRight,
  drawerSlideLeft,
  cardHover,
  buttonTap,
  shimmerPulse,
  progressPulse,
  glowPulse,
} from './variants';

// Springs
export {
  snappy,
  smooth,
  bouncy,
  gentle,
  overlaySpring,
  createSpring,
  withDelay,
} from './springs';

// Transitions
export {
  durations,
  easePremium,
  easeSmooth,
  easeGentle,
  easeSharp,
  fadeTransition,
  scaleTransition,
  slideTransition,
  overlayTransition,
  drawerTransition,
  toastTransition,
  staggerTiming,
  staggerDelay,
  motionConstraints,
} from './transitions';

// Reduced Motion
export {
  ReducedMotionProvider,
  ReducedMotion,
  useReducedMotion,
  useMotionProps,
} from './ReducedMotion';

// Utils
export {
  prefersReducedMotion,
  getMotionValue,
  motionProp,
} from './utils';
