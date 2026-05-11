import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardHeader } from './DashboardHeader';
import { StatsGrid } from './StatsGrid';
import { TodaySummaryBar } from './TodaySummaryBar';
import { EnhancedInsightsCard } from './EnhancedInsightsCard';
import { ProgressCards } from './ProgressCards';
import { GamificationPanel } from './GamificationPanel';
import { AnnouncementSection } from './AnnouncementSection';
import { ActionsPanel } from './ActionsPanel';
import { MissionCard } from './MissionCard';
import { GithubOverviewCard } from './GithubOverviewCard';

const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dt-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dt-primary to-dt-secondary animate-pulse flex items-center justify-center shadow-dt-glow" />
          <p className="text-dt-textSecondary font-medium tracking-wide">Syncing your data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dt-fade-in">
        <div className="text-center dt-card p-8 border border-dt-error/20 bg-white">
          <div className="w-16 h-16 bg-dt-error/10 text-dt-error rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-dt-error/20">
            !
          </div>
          <h2 className="text-xl font-bold text-dt-text mb-2">Sync Failed</h2>
          <p className="text-dt-textSecondary text-sm mb-6 max-w-sm mx-auto">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-dt-text text-white font-semibold rounded-xl hover:bg-dt-text/90 transition-all shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full dt-stagger pb-16 relative">
      {/* Premium Atmospheric Glow Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-dt-primary/5 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-dt-secondary/5 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 1: HERO COMMAND CENTER
      ───────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 relative z-10">
        <DashboardHeader />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="bg-white/40 backdrop-blur-2xl p-8 flex flex-col gap-8 shadow-[0_8px_40px_rgba(124,92,252,0.05)] border border-dt-primary/10 rounded-[32px]">
              <TodaySummaryBar streakData={data?.streakData} missions={data?.missions ?? []} />
              <div className="h-px bg-gradient-to-r from-transparent via-dt-primary/10 to-transparent w-full opacity-50" />
              <GamificationPanel streakData={data?.streakData} missions={data?.missions ?? []} />
            </div>
          </div>
          <div className="xl:col-span-1 h-full">
            <StatsGrid stats={data?.stats ?? null} platformStats={data?.platformStats ?? null} />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 2: AI INSIGHTS & PLATFORM INTEL
      ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-dt-primary/10 flex items-center justify-center text-dt-primary shadow-sm border border-dt-primary/5">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-dt-text tracking-tighter">AI Intelligence</h2>
              <p className="text-[13px] text-dt-textSecondary font-medium">Neural insights derived from your activity</p>
            </div>
          </div>
          <EnhancedInsightsCard />
        </section>

        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-dt-secondary/10 flex items-center justify-center text-dt-secondary shadow-sm border border-dt-secondary/5">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-dt-text tracking-tighter">Platform Intel</h2>
              <p className="text-[13px] text-dt-textSecondary font-medium">Performance across environments</p>
            </div>
          </div>
          <div className="dt-surface p-6 flex flex-col gap-6">
            <ProgressCards platformStats={data?.platformStats ?? null} />
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 3: REPOSITORY ARCHITECTURE
      ───────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gray-900/5 flex items-center justify-center text-gray-900 shadow-sm border border-gray-900/5">
            <span className="text-xl">🐙</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-dt-text tracking-tighter">Code Architecture</h2>
            <p className="text-[13px] text-dt-textSecondary font-medium">GitHub contribution ecosystem</p>
          </div>
        </div>
        <GithubOverviewCard data={data} />
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SECTION 4: PRODUCTIVITY & FOCUS
      ───────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-dt-success/10 flex items-center justify-center text-dt-success shadow-sm border border-dt-success/5">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-dt-text tracking-tighter">Focus & Productivity</h2>
            <p className="text-[13px] text-dt-textSecondary font-medium">Active missions and workflow shortcuts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          <MissionCard missions={data?.missions ?? []} />
          <AnnouncementSection />
          <ActionsPanel />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;