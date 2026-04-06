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
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white',
              'bg-[#4F46E5] hover:bg-[#4338CA] transition-colors duration-200',
            ].join(' ')}
          >
            <Icon name="folder-plus" size={16} className="text-white" />
            Log Submission
          </button>
        )}
      >
        {/* ─── Single-column vertical flow ─── */}
        <div className="mx-auto w-full max-w-[1000px] flex flex-col gap-8">

          {/* 1. Heatmap — primary visual */}
          <HeatmapCard title="Consistency" cells={heatmap365} />

          {/* 2. Recent Submissions */}
          <SubmissionsTable title="Recent Submissions" submissions={safeData.submissions} />

          {/* 3. Topic Mastery */}
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
