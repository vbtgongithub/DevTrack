// ============================================================================
// ActivityPage.tsx — Smart History Page (Backend-Driven)
// ============================================================================
// Fetches real activity data from GET /api/activity/feed and
// GET /api/activity/heatmap. No mock data.
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
import { useActivityData } from '../hooks/useActivityData';
import { Icon } from '../components/shared/Icon';
import type { FilterOption, HistorySubmission, DayActivity, WeeklyBar, SmartInsight, StreakData, ActivitySummary } from '../types/activity';

const ActivityPage: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterOption>('week');

  const { events, heatmapSummary, loading, error } = useActivityData();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Derive component data from backend events ───
  const submissions: HistorySubmission[] = React.useMemo(() => {
    return events.map((e, i) => {
      const d = new Date(e.occurredAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      if (d.toDateString() === today.toDateString()) dateLabel = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';
      else dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

      return {
        id: e.id || `evt-${i}`,
        problem: e.title,
        platform: (e.platform || 'devtrack') as HistorySubmission['platform'],
        topic: e.tags?.[0] || 'General',
        status: 'accepted' as const,
        time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: d.toISOString().slice(0, 10),
        dateLabel,
        activityType: e.type,
        metadata: e.metadata,
      };
    });
  }, [events]);

  // Filter by active filter
  const filteredSubmissions = React.useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return submissions.filter((s) => s.dateLabel === 'Today');
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return submissions.filter((s) => new Date(s.date) >= weekAgo);
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return submissions.filter((s) => new Date(s.date) >= monthAgo);
      }
      default:
        return submissions;
    }
  }, [filter, submissions]);

  // Group by date
  const groupedDays: DayActivity[] = React.useMemo(() => {
    const map = new Map<string, DayActivity>();
    for (const s of filteredSubmissions) {
      if (!map.has(s.date)) {
        map.set(s.date, { date: s.date, label: s.dateLabel, submissions: [] });
      }
      map.get(s.date)!.submissions.push(s);
    }
    return Array.from(map.values());
  }, [filteredSubmissions]);

  // Weekly bars from heatmap
  const weeklyBars: WeeklyBar[] = React.useMemo(() => {
    const today = new Date();
    const bars: WeeklyBar[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      bars.push({
        day: dayName,
        count: heatmapSummary[dateStr] || 0,
        isToday: i === 0,
      });
    }
    return bars;
  }, [heatmapSummary]);

  // Insights from data
  const insights: SmartInsight[] = React.useMemo(() => {
    if (events.length === 0) return [];
    const todayCount = submissions.filter((s) => s.dateLabel === 'Today').length;
    const totalCount = events.length;
    return [
      { id: 'i1', icon: '📊', label: 'Total Events', value: `${totalCount} activities recorded`, color: '#4F46E5' },
      { id: 'i2', icon: '🎯', label: 'Today', value: `${todayCount} activities today`, color: '#059669' },
    ];
  }, [events, submissions]);

  // Streak from heatmap summary
  const streak: StreakData = React.useMemo(() => {
    const today = new Date();
    let current = 0;
    const activeDays: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const active = (heatmapSummary[dateStr] || 0) > 0;
      activeDays.push(active);
      if (i === 0 || (active && current > 0)) current += active ? 1 : 0;
    }
    // Simple streak count from end
    let streakCount = 0;
    for (let i = activeDays.length - 1; i >= 0; i--) {
      if (activeDays[i]) streakCount++;
      else break;
    }
    return { current: streakCount, best: streakCount, percentOfBest: 100, activeDays };
  }, [heatmapSummary]);

  const [now] = React.useState(() => Date.now());

  // Summary
  const summary: ActivitySummary = React.useMemo(() => {
    const todayStr = new Date(now).toISOString().slice(0, 10);
    const yesterdayStr = new Date(now - 86400000).toISOString().slice(0, 10);
    const weekAgoDate = new Date(now - 7 * 86400000);
    
    return {
      today: submissions.filter((s) => s.date === todayStr).length,
      yesterday: submissions.filter((s) => s.date === yesterdayStr).length,
      thisWeek: submissions.filter((s) => new Date(s.date) >= weekAgoDate).length,
    };
  }, [submissions, now]);

  // ─── Empty state ───
  if (!loading && events.length === 0 && !error) {
    return (
      <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
        <PageShell title="Smart History" subtitle="Your daily coding journal with intelligent insights" status="success" error={null}>
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#6b7280' }}>
            <Icon name="clock" size={32} />
            <p style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: 500 }}>No activity yet.</p>
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>Start by syncing your platforms from the Profile page.</p>
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="Smart History"
        subtitle="Your daily coding journal with intelligent insights"
        status={loading ? 'loading' : error ? 'error' : 'success'}
        error={error}
      >
        {/* ─── 3-column grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* ─── LEFT COLUMN (2/3) ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TodayActivity submissions={filteredSubmissions} />
            <ActivityTimeline days={groupedDays} />
            <WeeklyTrendChart bars={weeklyBars} />
          </div>

          {/* ─── RIGHT COLUMN (1/3) ─── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
            <SmartInsights insights={insights} />
            <StreakTracker streak={streak} />
            <ActivitySummaryCard summary={summary} />
            <HistoryFilters active={filter} onChange={setFilter} />
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default ActivityPage;
