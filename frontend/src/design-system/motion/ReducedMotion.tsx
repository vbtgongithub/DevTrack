// ============================================================================
// ReducedMotion.tsx — Reduced Motion Wrapper
// ============================================================================
// Centralized wrapper that respects prefers-reduced-motion.
// Disables non-essential motion while preserving interaction clarity.
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ReducedMotionContextValue {
  prefersReducedMotion: boolean;
  shouldAnimate: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
  prefersReducedMotion: false,
  shouldAnimate: true,
});

export const useReducedMotion = () => useContext(ReducedMotionContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ReducedMotionProviderProps {
  children: React.ReactNode;
  /**
   * Force reduced motion regardless of system preference
   * Useful for testing or user settings
   */
  forceReducedMotion?: boolean;
}

export const ReducedMotionProvider: React.FC<ReducedMotionProviderProps> = ({
  children,
  forceReducedMotion = false,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (forceReducedMotion) return true;
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (forceReducedMotion) {
      setPrefersReducedMotion(true);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [forceReducedMotion]);

  const value: ReducedMotionContextValue = {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion,
  };

  return (
    <ReducedMotionContext.Provider value={value}>
      {children}
    </ReducedMotionContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to conditionally apply motion props
 * 
 * @example
 * const motionProps = useMotionProps({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 * });
 * 
 * return <motion.div {...motionProps}>Content</motion.div>
 */
export const useMotionProps = <T extends Record<string, any>>(
  motionProps: T,
  reducedProps: Partial<T> = {}
): T => {
  const { prefersReducedMotion } = useReducedMotion();
  
  if (prefersReducedMotion) {
    return { ...motionProps, ...reducedProps } as T;
  }
  
  return motionProps;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ReducedMotionProps {
  children: React.ReactNode;
  /**
   * Content to render when reduced motion is preferred
   * If not provided, children will be rendered without motion
   */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render content based on motion preference
 * 
 * @example
 * <ReducedMotion fallback={<StaticContent />}>
 *   <AnimatedContent />
 * </ReducedMotion>
 */
export const ReducedMotion: React.FC<ReducedMotionProps> = ({
  children,
  fallback,
}) => {
  const { prefersReducedMotion } = useReducedMotion();
  
  if (prefersReducedMotion && fallback) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
