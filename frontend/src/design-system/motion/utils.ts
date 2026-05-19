// ============================================================================
// utils.ts — Motion Utilities
// ============================================================================
// Utility functions for motion system.
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion =
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Get a safe animation value based on reduced motion preference
 */
export const getMotionValue = <T>(
  normalValue: T,
  reducedValue: T
): T => {
  return prefersReducedMotion ? reducedValue : normalValue;
};

/**
 * Create a conditional motion prop
 */
export const motionProp = <T>(
  normalValue: T,
  reducedValue: T = {} as T
): T => {
  return prefersReducedMotion ? reducedValue : normalValue;
};
