import { PageShell } from '../components/layout/PageShell';
import { useDsaData } from '../hooks/useDsaData';
import React from 'react';
import { HeatmapCard } from '../components/dsa/HeatmapCard';
import { DsaHero } from '../components/dsa/DsaHero';
import { SubmissionsTable } from '../components/dsa/SubmissionsTable';
import { TopicProgress } from '../components/dsa/TopicProgress';
import { PlatformOverview } from '../components/dsa/PlatformOverview';
import { ContestList } from '../components/dsa/ContestList';
import { InsightsCard } from '../components/dsa/InsightsCard';
import { Icon } from '../components/shared/Icon';
import type { DsaData } from '../types/dsa';

const DsaPage: React.FC = () => {
  const { data, loading, error } = useDsaData();
  const [mounted, setMounted] = React.useState(false);

  // No mock fallback — show empty defaults when backend returns no data
  const emptyData: DsaData = { stats: [], heatmap: [], submissions: [], contests: [], topics: [], platformOverview: [] };
  const safeData: DsaData = data ?? emptyData;

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
        <div className="dt-card p-10 text-center max-w-md mx-auto">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Icon name="exclamation-triangle" size={24} className="text-red-500" />
          </div>
          <p className="text-base font-semibold text-gray-900">Failed to load DSA data</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-black cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={['transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)', mounted ? 'opacity-100' : 'opacity-0'].join(' ')}>
      <PageShell
        title="DSA Tracker"
        subtitle="Intelligent monitoring of your problem-solving architecture"
        status="success"
        error={null}
        actions={(
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[14px] px-6 py-2.5 text-[13px] font-black uppercase tracking-widest text-white bg-dt-text shadow-dt-floating hover:shadow-dt-card-hover hover:scale-[1.05] active:scale-[0.95] transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1)"
          >
            <Icon name="plus" size={14} className="text-white" />
            Log Packet
          </button>
        )}
      >
        <div className="mx-auto w-full max-w-[1200px] flex flex-col gap-6 pb-16 relative">

          {/* Elite Atmospheric System - Tighter & More Focused */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[8%] left-[5%] w-[600px] h-[600px] bg-dt-primary/3 rounded-full blur-[100px] opacity-50" />
            <div className="absolute top-[50%] right-[0%] w-[400px] h-[500px] bg-dt-secondary/2 rounded-full blur-[80px] opacity-40" />
            <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[400px] bg-indigo-500/2 rounded-full blur-[90px] opacity-20" />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            {/* Command Surface: Hero + Heatmap - Compressed */}
            <div className="flex flex-col gap-4">
              <DsaHero heatmap={heatmap365} stats={safeData.stats} />
              <HeatmapCard title="Velocity Matrix" cells={heatmap365} />
            </div>

            {/* Core Operation Layer - Tighter Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dt-primary/5 flex items-center justify-center text-dt-primary border border-dt-primary/10">
                     <Icon name="bolt" size={16} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-dt-text tracking-tighter uppercase">Recent Telemetry</h2>
                    <p className="text-[9px] text-dt-textSecondary/50 font-black tracking-widest uppercase mt-0.5">Live submission stream</p>
                  </div>
                </div>
                <SubmissionsTable title="Recent Submissions" submissions={safeData.submissions} />
              </div>

              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dt-secondary/5 flex items-center justify-center text-dt-secondary border border-dt-secondary/10">
                     <Icon name="trophy" size={16} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-dt-text tracking-tighter uppercase">Competition Matrix</h2>
                    <p className="text-[9px] text-dt-textSecondary/50 font-black tracking-widest uppercase mt-0.5">Performance packets</p>
                  </div>
                </div>
                <ContestList title="Contests" contests={safeData.contests} />
              </div>
            </div>

            {/* Neural Analytics Layer - Tighter */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                     <Icon name="chart-bar" size={16} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-dt-text tracking-tighter uppercase">Algorithm Intelligence Matrix</h2>
                    <p className="text-[9px] text-dt-textSecondary/50 font-black tracking-widest uppercase mt-0.5">Algorithmic vectors</p>
                  </div>
                </div>
                <TopicProgress title="Mastery Progress" topics={safeData.topics} />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-dt-primary/5 flex items-center justify-center text-dt-primary border border-dt-primary/10">
                     <Icon name="cpu-chip" size={16} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-dt-text tracking-tighter uppercase">AI Engineering Brain</h2>
                    <p className="text-[9px] text-dt-textSecondary/50 font-black tracking-widest uppercase mt-0.5">Live neural analysis</p>
                  </div>
                </div>
                <InsightsCard title="Growth Insights" submissions={safeData.submissions} topics={safeData.topics} />
              </div>
            </div>

            {/* Infrastructure Layer - Compressed */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-dt-text/5 flex items-center justify-center text-dt-text border border-dt-text/10">
                   <Icon name="globe-alt" size={16} />
                </div>
                <div>
                  <h2 className="text-[15px] font-black text-dt-text tracking-tighter uppercase">Platform Intelligence Network</h2>
                  <p className="text-[9px] text-dt-textSecondary/50 font-black tracking-widest uppercase mt-0.5">Ecosystem contribution density</p>
                </div>
              </div>
              <PlatformOverview title="Ecosystem Metrics" items={safeData.platformOverview} submissions={safeData.submissions} />
            </div>
          </div>
        </div>
      </PageShell>
    </div>
  );
};

export default DsaPage;
