import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchDsaContests } from '../services/dsaService';
import { type ApiDsaContestEntry } from '../types/api.types';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { TodaySummaryBar } from '../components/dashboard/TodaySummaryBar';
import { EnhancedInsightsCard } from '../components/dashboard/EnhancedInsightsCard';
import { ProgressCards } from '../components/dashboard/ProgressCards';
import { GamificationPanel } from '../components/dashboard/GamificationPanel';
import { AnnouncementSection } from '../components/dashboard/AnnouncementSection';
import { ActionsPanel } from '../components/dashboard/ActionsPanel';
import { MissionCard } from '../components/dashboard/MissionCard';
import { GithubOverviewCard } from '../components/dashboard/GithubOverviewCard';

const DashboardPage: React.FC = () => {
  const { data, loading, error } = useDashboardData();
  const [contests, setContests] = React.useState<{ name: string; platform: string; time: string }[]>([]);

  React.useEffect(() => {
    const loadContests = async () => {
      try {
        const response = await fetchDsaContests({ pageSize: 10 });
        if (response.success) {
          const allContests = response.data.contests;
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const recent = allContests
            .filter((c: ApiDsaContestEntry) => new Date(c.participatedAt) >= sevenDaysAgo)
            .map((c: ApiDsaContestEntry) => ({
              name: c.contestName,
              platform: c.platform,
              time: new Date(c.participatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
          setContests(recent);
        }
      } catch (err) {
        console.error('Failed to fetch contests:', err);
      }
    };
    loadContests();
  }, []);

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

        {/* Top-Level KPIs (Full Width) */}
        <div className="w-full">
          <StatsGrid stats={data?.stats ?? null} platformStats={data?.platformStats ?? null} />
        </div>

        {/* Productivity & Gamification Core */}
        <div className="grid grid-cols-1 gap-6 items-stretch mt-2">
          <div className="flex flex-col gap-6">
            <div className="bg-white/40 backdrop-blur-3xl p-8 lg:p-10 flex flex-col gap-8 shadow-[0_8px_40px_rgba(124,92,252,0.06)] border border-dt-primary/10 rounded-[36px]">
              <TodaySummaryBar streakData={data?.streakData} missions={data?.missions ?? []} />
              <div className="h-px bg-gradient-to-r from-transparent via-dt-primary/15 to-transparent w-full opacity-60" />
              <GamificationPanel streakData={data?.streakData} missions={data?.missions ?? []} />
            </div>
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
            <h2 className="text-2xl font-black text-dt-text tracking-tighter">Developer Identity System</h2>
            <p className="text-[13px] text-dt-textSecondary font-medium">Global open-source ecosystem</p>
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
          <AnnouncementSection contests={contests} />
          <ActionsPanel />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;