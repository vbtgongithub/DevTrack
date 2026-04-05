import { PageShell } from '../components/layout/PageShell';
import { useDsaData } from '../hooks/useDsaData';
import React from 'react';
import { StatCard } from '../components/dsa/StatCard';
import { HeatmapCard } from '../components/dsa/HeatmapCard';
import { SubmissionsTable } from '../components/dsa/SubmissionsTable';
import { ContestList } from '../components/dsa/ContestList';
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#fff7f0] p-4 sm:p-6">
        <div className="bg-white border border-gray-300 shadow-md rounded-xl p-5 transition-all duration-200 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="mt-3 h-3 w-72 bg-gray-200 rounded" />
          <div className="mt-6 grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`stat-skel-${i}`} className="h-[76px] bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl bg-[#fff7f0] p-4 sm:p-6">
        <ErrorState subtitle="Network error" onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const safeData: DsaData = data ?? mockData;

  return (
    <div className="rounded-2xl bg-[#fff7f0] p-4 sm:p-6">
      <div className={['transition-opacity duration-300', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
        <PageShell
          title="DSA Progress"
          subtitle="Track, analyze, and improve your problem-solving skills"
          status="success"
          error={null}
          actions={(
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:bg-black hover:scale-[1.03] active:scale-[0.98]"
            >
              <Icon name="folder-plus" size={16} className="text-white" />
              Log Submission
            </button>
          )}
        >
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {safeData.stats.map((item) => (
              <StatCard key={item.label} data={item} />
            ))}
          </section>

          <section className="grid grid-cols-3 gap-6 mt-6">
            <div className="col-span-2 space-y-6">
              <HeatmapCard title="Consistency Activity" cells={safeData.heatmap.slice(0, 84)} />
              <SubmissionsTable title="Recent Submissions" submissions={safeData.submissions} />
            </div>

            <div className="col-span-1 space-y-6">
              <ContestList title="Upcoming Contests" contests={safeData.contests} />
              <TopicProgress title="Topic Mastery" topics={safeData.topics} />
              <PlatformOverview title="Platform Overview" items={safeData.platformOverview} />
              <InsightsCard title="Insights" submissions={safeData.submissions} topics={safeData.topics} />
            </div>
          </section>
        </PageShell>
      </div>
    </div>
  );
};

export default DsaPage;
