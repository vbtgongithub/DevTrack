// ============================================================================
// Container.tsx — Responsive Container Component
// ============================================================================
// Adaptive container with responsive padding and max-width.
// ============================================================================

import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { containerWidths, spacing } from './breakpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width constraint
   * @default true
   */
  maxWidth?: boolean;
  
  /**
   * Horizontal padding
   * @default true
   */
  padding?: boolean;
  
  /**
   * Center content
   * @default true
   */
  center?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Container: React.FC<ContainerProps> = ({
  maxWidth = true,
  padding = true,
  center = true,
  className = '',
  children,
  ...props
}) => {
  const breakpoint = useBreakpoint();
  
  const paddingValue = padding ? spacing[breakpoint].lg : 0;
  const maxWidthValue = maxWidth ? containerWidths[breakpoint] : 'none';

  return (
    <div
      className={className}
      style={{
        width: '100%',
        maxWidth: maxWidthValue,
        paddingLeft: paddingValue,
        paddingRight: paddingValue,
        marginLeft: center ? 'auto' : undefined,
        marginRight: center ? 'auto' : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
