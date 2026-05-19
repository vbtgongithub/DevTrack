// ============================================================================
// AdaptiveDashboard.tsx — Adaptive Dashboard Layout
// ============================================================================
// Responsive dashboard that adapts density and hierarchy based on viewport.
// ============================================================================

import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { Container, Stack } from '../../design-system/layout';
import { DashboardBoundary } from '../shared/ErrorBoundary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardSection {
  id: string;
  priority: number;
  component: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
}

export interface AdaptiveDashboardProps {
  sections: DashboardSection[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({
  sections,
}) => {
  const breakpoint = useBreakpoint();
  
  // Sort sections by priority
  const sortedSections = [...sections].sort((a, b) => a.priority - b.priority);
  
  // Get adaptive spacing
  const spacing = {
    mobile: 'md',
    tablet: 'lg',
    desktop: 'xl',
    wide: 'xl',
  }[breakpoint] as 'md' | 'lg' | 'xl';

  return (
    <DashboardBoundary>
      <Container>
        <Stack
          spacing={spacing}
          responsiveSpacing={{
            mobile: 'md',
            tablet: 'lg',
            desktop: 'xl',
            wide: 'xl',
          }}
        >
          {sortedSections.map((section) => (
            <div
              key={section.id}
              style={{
                gridColumn: section.span?.[breakpoint]
                  ? `span ${section.span[breakpoint]}`
                  : undefined,
              }}
            >
              {section.component}
            </div>
          ))}
        </Stack>
      </Container>
    </DashboardBoundary>
  );
};

export default AdaptiveDashboard;
