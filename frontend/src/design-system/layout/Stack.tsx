// ============================================================================
// Stack.tsx — Vertical/Horizontal Stack Layout
// ============================================================================
// Flexbox-based stack with responsive spacing.
// ============================================================================

import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { spacing, type Breakpoint } from './breakpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Stack direction
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';
  
  /**
   * Spacing between items
   * @default 'md'
   */
  spacing?: keyof typeof spacing.mobile;
  
  /**
   * Responsive spacing override
   */
  responsiveSpacing?: Partial<Record<Breakpoint, keyof typeof spacing.mobile>>;
  
  /**
   * Align items
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /**
   * Justify content
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  
  /**
   * Wrap items
   * @default false
   */
  wrap?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Stack: React.FC<StackProps> = ({
  direction = 'vertical',
  spacing: spacingProp = 'md',
  responsiveSpacing,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  children,
  ...props
}) => {
  const breakpoint = useBreakpoint();
  
  // Get responsive spacing
  const spacingKey = responsiveSpacing?.[breakpoint] ?? spacingProp;
  const spacingValue = spacing[breakpoint][spacingKey];
  
  // Map align/justify to flex values
  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  }[align];
  
  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
  }[justify];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap: spacingValue,
        alignItems,
        justifyContent,
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Stack;
