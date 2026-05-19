// ============================================================================
// DashboardPriorityLayout.tsx — Priority-Based Dashboard Layout
// ============================================================================
// Dashboard with clear visual hierarchy and priority ordering.
// ============================================================================

import React from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';
import { Stack } from '../../design-system/layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardPriorityLayoutProps {
  // Priority 1: Streak state
  streakSection: React.ReactNode;
  
  // Priority 2: XP progression
  xpSection: React.ReactNode;
  
  // Priority 3: Daily mission progress
  missionSection: React.ReactNode;
  
  // Priority 4: Weekly momentum
  momentumSection: React.ReactNode;
  
  // Priority 5: Realtime activity
  activitySection?: React.ReactNode;
  
  // Priority 6: Projects momentum
  projectsSection?: React.ReactNode;
  
  // Priority 7: Secondary analytics
  analyticsSection?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DashboardPriorityLayout: React.FC<DashboardPriorityLayoutProps> = ({
  streakSection,
  xpSection,
  missionSection,
  momentumSection,
  activitySection,
  projectsSection,
  analyticsSection,
}) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  return (
    <Stack
      spacing="xl"
      responsiveSpacing={{
        mobile: 'lg',
        tablet: 'xl',
        desktop: '2xl',
        wide: '2xl',
      }}
    >
      {/* Priority 1 + 2: Habit Loop Core (Streak + XP) */}
      <section aria-label="Habit Loop Core">
        {isMobile ? (
          // Mobile: Stacked
          <Stack spacing="md">
            {streakSection}
            {xpSection}
          </Stack>
        ) : (
          // Desktop/Tablet: Side by side
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">{streakSection}</div>
            <div className="col-span-1">{xpSection}</div>
          </div>
        )}
      </section>

      {/* Priority 3: Daily Mission Progress */}
      <section aria-label="Daily Missions">
        {missionSection}
      </section>

      {/* Priority 4: Weekly Momentum */}
      <section aria-label="Weekly Momentum">
        {momentumSection}
      </section>

      {/* Priority 5: Realtime Activity (Desktop/Tablet only) */}
      {!isMobile && activitySection && (
        <section aria-label="Realtime Activity">
          {activitySection}
        </section>
      )}

      {/* Priority 6: Projects Momentum */}
      {projectsSection && (
        <section aria-label="Projects">
          {projectsSection}
        </section>
      )}

      {/* Priority 7: Secondary Analytics (Desktop only) */}
      {!isMobile && !isTablet && analyticsSection && (
        <section aria-label="Analytics">
          {analyticsSection}
        </section>
      )}
    </Stack>
  );
};

export default DashboardPriorityLayout;
