// ============================================================================
// layout/index.ts — Layout System Exports
// ============================================================================

export {
  breakpoints,
  mediaQueries,
  spacing,
  typography,
  grid,
  containerWidths,
  touchTargets,
  safeAreas,
  getResponsiveValue,
  matchesBreakpoint,
  getCurrentBreakpoint,
  getSpacing,
  getTypography,
} from './breakpoints';

export type { Breakpoint } from './breakpoints';

export { Container } from './Container';
export type { ContainerProps } from './Container';

export { ResponsiveGrid } from './ResponsiveGrid';
export type { ResponsiveGridProps } from './ResponsiveGrid';

export { Stack } from './Stack';
export type { StackProps } from './Stack';
