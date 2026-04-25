import { PageShell } from '../components/layout/PageShell';
import { useDsaData } from '../hooks/useDsaData';
import React from 'react';
import { HeatmapCard } from '../components/dsa/HeatmapCard';
import { SubmissionsTable } from '../components/dsa/SubmissionsTable';
import { TopicProgress } from '../components/dsa/TopicProgress';
import { PlatformOverview } from '../components/dsa/PlatformOverview';
import { ErrorState } from '../components/dsa/ErrorState';
import { InsightsCard } from '../components/dsa/InsightsCard';
import { Icon } from '../components/shared/Icon';
import type { DsaData } from '../types/dsa';
import { mockData } from '../mocks/dsaMockData';

/* ─── Summary Bar ─── */
const DsaSummaryBar: React.FC<{ heatmap: number[]; stats: DsaData['stats'] }> = ({ heatmap, stats }) => {
  const activeDays = React.useMemo(() => heatmap.filter((v) => v > 0).length, [heatmap]);

  const totalSolvedStat = stats.find((s) => s.label === 'Problems Solved');
  const totalSolved = totalSolvedStat?.value ?? '0';

  const lcRatingStat = stats.find((s) => s.label === 'LeetCode Rating');
  const ratingDisplay = lcRatingStat?.value && lcRatingStat.value !== '—'
    ? `LeetCode rating: ${lcRatingStat.value}`
    : (() => {
        const cfStat = stats.find((s) => s.label === 'CF Rating');
        return cfStat?.value && cfStat.value !== '—'
          ? `Codeforces rating: ${cfStat.value}`
          : 'No rating data yet';
      })();

  const summaryItems = [
    { emoji: '📊', text: `Total solved: ${totalSolved}`, type: 'blue' },
    { emoji: '📅', text: `${activeDays} active days recorded`, type: 'green' },
    { emoji: '🎯', text: ratingDisplay, type: 'orange' },
    {
      emoji: '🏆',
      text: (() => {
        const cc = stats.find((s) => s.label === 'CodeChef Rating');
        return cc?.value && cc.value !== '—' ? `CodeChef rating: ${cc.value}` : 'Add profiles in Profile page';
      })(),
      type: 'purple',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    purple: 'bg-violet-50 border-violet-200 text-violet-800',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {summaryItems.map((item, idx) => (
        <div
          key={idx}
          className={[
            'flex items-center gap-3 px-4 py-3 rounded-xl border',
            'hover:shadow-md hover:-translate-y-0.5',
            'transition-all duration-200 ease-out cursor-default',
            colorMap[item.type],
          ].join(' ')}
          style={{ animation: `dtFadeIn 520ms ease-out ${idx * 80}ms both` }}
        >
          <span className="text-lg shrink-0">{item.emoji}</span>
          <span className="text-sm font-medium leading-snug">{item.text}</span>
        </div>
      ))}
    </div>
  );
};

const DsaPage: React.FC = () => {
  const { data, loading, error } = useDsaData();
  const [mounted, setMounted] = React.useState(false);

  const safeData: DsaData = data ?? mockData;

  const heatmap365 = React.useMemo(() => {
    const arr = safeData.heatmap ?? [];
    const last = arr.slice(-365);
    if (last.length >= 365) return last;
    return [...Array.from({ length: 365 - last.length }, () => 0), ...last];
  }, [safeData.heatmap]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="dt-fade-in">
        <div className="dt-card p-6 animate-pulse">
          <div className="h-5 w-40 bg-dt-bg rounded" />
          <div className="mt-3 h-3 w-72 bg-dt-bg rounded" />
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`stat-skel-${i}`} className="h-[76px] bg-dt-bg/70 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dt-fade-in">
        <ErrorState subtitle="Network error" onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="DSA Progress"
        subtitle="Track, analyze, and improve your problem-solving skills"
        status="success"
        error={null}
        actions={(
          <button
            type="button"
            className={[
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white',
              'bg-gray-900 hover:bg-black shadow-sm hover:shadow-md',
              'transition-all duration-200 cursor-pointer',
            ].join(' ')}
          >
            <Icon name="folder-plus" size={16} className="text-white" />
            Log Submission
          </button>
        )}
      >
        {/* ─── Single-column vertical flow ─── */}
        <div className="mx-auto w-full max-w-[1000px] flex flex-col gap-6">

          {/* 0. Summary Bar */}
          <DsaSummaryBar heatmap={heatmap365} stats={safeData.stats} />

          {/* 1. Heatmap — primary visual */}
          <HeatmapCard title="Consistency" cells={heatmap365} />

          {/* 2. Recent Submissions */}
          <SubmissionsTable title="Recent Submissions" submissions={safeData.submissions} />

          {/* 3. Topic Mastery — UPGRADED */}
          <TopicProgress title="Topic Mastery" topics={safeData.topics} />

          {/* 4. Platform Overview */}
          <PlatformOverview title="Platform Overview" items={safeData.platformOverview} submissions={safeData.submissions} />

          {/* 5. Insights */}
          <InsightsCard title="Insights" submissions={safeData.submissions} topics={safeData.topics} stats={safeData.stats} />
        </div>
      </PageShell>
    </div>
  );
};

export default DsaPage;
