// ============================================================================
// breakpoints.ts — Responsive Breakpoint System
// ============================================================================
// Centralized breakpoint definitions and utilities.
// ============================================================================

// ---------------------------------------------------------------------------
// Breakpoint Definitions
// ---------------------------------------------------------------------------

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ---------------------------------------------------------------------------
// Media Queries
// ---------------------------------------------------------------------------

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.wide - 1}px)`,
  wide: `(min-width: ${breakpoints.wide}px)`,
  
  // Utility queries
  tabletUp: `(min-width: ${breakpoints.tablet}px)`,
  desktopUp: `(min-width: ${breakpoints.desktop}px)`,
  wideUp: `(min-width: ${breakpoints.wide}px)`,
  
  mobileOnly: `(max-width: ${breakpoints.tablet - 1}px)`,
  tabletOnly: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktopOnly: `(min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.wide - 1}px)`,
} as const;

// ---------------------------------------------------------------------------
// Responsive Values
// ---------------------------------------------------------------------------

/**
 * Get responsive value based on breakpoint
 * 
 * @example
 * const padding = getResponsiveValue({
 *   mobile: 16,
 *   tablet: 24,
 *   desktop: 32,
 *   wide: 40,
 * }, currentBreakpoint);
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  breakpoint: Breakpoint
): T {
  // Return exact match if available
  if (values[breakpoint] !== undefined) {
    return values[breakpoint]!;
  }
  
  // Fallback cascade: wide → desktop → tablet → mobile
  const fallbackOrder: Breakpoint[] = ['wide', 'desktop', 'tablet', 'mobile'];
  const startIndex = fallbackOrder.indexOf(breakpoint);
  
  for (let i = startIndex; i < fallbackOrder.length; i++) {
    const key = fallbackOrder[i];
    if (values[key] !== undefined) {
      return values[key]!;
    }
  }
  
  // Return first available value
  return Object.values(values)[0] as T;
}

// ---------------------------------------------------------------------------
// Spacing System
// ---------------------------------------------------------------------------

export const spacing = {
  mobile: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  tablet: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  desktop: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
    '5xl': 96,
  },
  wide: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 80,
    '5xl': 128,
  },
} as const;

// ---------------------------------------------------------------------------
// Typography Scale
// ---------------------------------------------------------------------------

export const typography = {
  mobile: {
    display: { size: 32, lineHeight: 1.2, weight: 900 },
    title: { size: 20, lineHeight: 1.3, weight: 900 },
    heading: { size: 16, lineHeight: 1.4, weight: 700 },
    body: { size: 14, lineHeight: 1.5, weight: 500 },
    bodySm: { size: 12, lineHeight: 1.5, weight: 500 },
    label: { size: 10, lineHeight: 1.4, weight: 900 },
    micro: { size: 9, lineHeight: 1.3, weight: 900 },
  },
  tablet: {
    display: { size: 40, lineHeight: 1.2, weight: 900 },
    title: { size: 22, lineHeight: 1.3, weight: 900 },
    heading: { size: 18, lineHeight: 1.4, weight: 700 },
    body: { size: 15, lineHeight: 1.5, weight: 500 },
    bodySm: { size: 13, lineHeight: 1.5, weight: 500 },
    label: { size: 11, lineHeight: 1.4, weight: 900 },
    micro: { size: 10, lineHeight: 1.3, weight: 900 },
  },
  desktop: {
    display: { size: 48, lineHeight: 1.2, weight: 900 },
    title: { size: 24, lineHeight: 1.3, weight: 900 },
    heading: { size: 20, lineHeight: 1.4, weight: 700 },
    body: { size: 16, lineHeight: 1.5, weight: 500 },
    bodySm: { size: 14, lineHeight: 1.5, weight: 500 },
    label: { size: 11, lineHeight: 1.4, weight: 900 },
    micro: { size: 10, lineHeight: 1.3, weight: 900 },
  },
  wide: {
    display: { size: 56, lineHeight: 1.2, weight: 900 },
    title: { size: 28, lineHeight: 1.3, weight: 900 },
    heading: { size: 22, lineHeight: 1.4, weight: 700 },
    body: { size: 16, lineHeight: 1.5, weight: 500 },
    bodySm: { size: 14, lineHeight: 1.5, weight: 500 },
    label: { size: 11, lineHeight: 1.4, weight: 900 },
    micro: { size: 10, lineHeight: 1.3, weight: 900 },
  },
} as const;

// ---------------------------------------------------------------------------
// Grid System
// ---------------------------------------------------------------------------

export const grid = {
  mobile: {
    columns: 4,
    gap: 16,
    margin: 16,
  },
  tablet: {
    columns: 8,
    gap: 20,
    margin: 24,
  },
  desktop: {
    columns: 12,
    gap: 24,
    margin: 32,
  },
  wide: {
    columns: 12,
    gap: 32,
    margin: 48,
  },
} as const;

// ---------------------------------------------------------------------------
// Container Widths
// ---------------------------------------------------------------------------

export const containerWidths = {
  mobile: '100%',
  tablet: '100%',
  desktop: '100%',
  wide: '1600px',
} as const;

// ---------------------------------------------------------------------------
// Touch Targets
// ---------------------------------------------------------------------------

export const touchTargets = {
  minimum: 44, // iOS minimum
  comfortable: 48,
  large: 56,
} as const;

// ---------------------------------------------------------------------------
// Safe Areas
// ---------------------------------------------------------------------------

export const safeAreas = {
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
} as const;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Check if current viewport matches breakpoint
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(mediaQueries[breakpoint]).matches;
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  
  if (window.matchMedia(mediaQueries.wide).matches) return 'wide';
  if (window.matchMedia(mediaQueries.desktop).matches) return 'desktop';
  if (window.matchMedia(mediaQueries.tablet).matches) return 'tablet';
  return 'mobile';
}

/**
 * Get responsive spacing value
 */
export function getSpacing(
  size: keyof typeof spacing.mobile,
  breakpoint: Breakpoint
): number {
  return spacing[breakpoint][size];
}

/**
 * Get responsive typography value
 */
export function getTypography(
  variant: keyof typeof typography.mobile,
  breakpoint: Breakpoint
) {
  return typography[breakpoint][variant];
}
