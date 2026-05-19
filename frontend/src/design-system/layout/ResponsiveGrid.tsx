// ============================================================================
// ResponsiveGrid.tsx — Adaptive Grid Layout
// ============================================================================
// Responsive grid that adapts columns and gaps based on breakpoint.
// ============================================================================

import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { grid, type Breakpoint } from './breakpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns per breakpoint
   */
  columns?: Partial<Record<Breakpoint, number>>;
  
  /**
   * Gap size per breakpoint
   */
  gap?: Partial<Record<Breakpoint, number>>;
  
  /**
   * Minimum column width (auto-fit)
   */
  minColumnWidth?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  columns,
  gap,
  minColumnWidth,
  className = '',
  children,
  ...props
}) => {
  const breakpoint = useBreakpoint();
  
  // Get responsive values
  const columnCount = columns?.[breakpoint] ?? grid[breakpoint].columns;
  const gapValue = gap?.[breakpoint] ?? grid[breakpoint].gap;
  
  // Use auto-fit if minColumnWidth is provided
  const gridTemplateColumns = minColumnWidth
    ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
    : `repeat(${columnCount}, 1fr)`;

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gap: gapValue,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
