// ============================================================================
// ActivityPage.tsx — Smart History Page
// ============================================================================
// A premium daily coding journal with intelligent insights and behavioral
// analysis. Uses a 3-column grid layout with left (2-col) and right (1-col).
// ============================================================================

import React from 'react';
import { PageShell } from '../components/layout/PageShell';
import { TodayActivity } from '../components/history/TodayActivity';
import { ActivityTimeline } from '../components/history/ActivityTimeline';
import { WeeklyTrendChart } from '../components/history/WeeklyTrendChart';
import { SmartInsights } from '../components/history/SmartInsights';
import { StreakTracker } from '../components/history/StreakTracker';
import { ActivitySummaryCard } from '../components/history/ActivitySummaryCard';
import { HistoryFilters } from '../components/history/HistoryFilters';
import {
  mockSubmissions,
  groupByDate,
  mockWeeklyBars,
  mockInsights,
  mockStreak,
  mockSummary,
} from '../mocks/historyMockData';
import type { FilterOption, HistorySubmission } from '../mocks/historyMockData';

const ActivityPage: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterOption>('week');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter submissions based on active filter
  const filteredSubmissions: HistorySubmission[] = React.useMemo(() => {
    switch (filter) {
      case 'today':
        return mockSubmissions.filter((s) => s.dateLabel === 'Today');
      case 'week':
        return mockSubmissions;
      case 'month':
        return mockSubmissions;
      default:
        return mockSubmissions;
    }
  }, [filter]);

  const groupedDays = React.useMemo(
    () => groupByDate(filteredSubmissions),
    [filteredSubmissions]
  );

  return (
    <div
      className={[
        'transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <PageShell
        title="Smart History"
        subtitle="Your daily coding journal with intelligent insights"
        status="success"
        error={null}
      >
        {/* ─── 3-column grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* ─── LEFT COLUMN (2/3) ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 1. Today Activity */}
            <TodayActivity submissions={mockSubmissions} />

            {/* 2. Activity Timeline */}
            <ActivityTimeline days={groupedDays} />

            {/* 3. Weekly Trend Chart */}
            <WeeklyTrendChart bars={mockWeeklyBars} />
          </div>

          {/* ─── RIGHT COLUMN (1/3) ─── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            {/* 4. Smart Insights */}
            <SmartInsights insights={mockInsights} />

            {/* 5. Streak Tracker */}
            <StreakTracker streak={mockStreak} />

            {/* 6. Activity Summary */}
            <ActivitySummaryCard summary={mockSummary} />

            {/* 7. Filters */}
            <HistoryFilters active={filter} onChange={setFilter} />
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default ActivityPage;
