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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">!</div>
          <p className="text-gray-800 font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header */}
      <DashboardHeader />

      {/* 2. Merged Insight Strip */}
      <TodaySummaryBar data={data} />

      {/* 3. PRIMARY ZONE — Streak (large) + Daily Goal + Achievements */}
      <GamificationPanel data={data} />

      {/* GitHub Overview Profile */}
      <GithubOverviewCard data={data} />

      {/* 4. Stats Grid */}
      <StatsGrid data={data} />

      {/* 5. AI INSIGHTS — Visually Dominant */}
      <EnhancedInsightsCard data={data} />

      {/* 6. Progress Cards */}
      <ProgressCards data={data} />

      {/* 7. Mission + Contests + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="h-full">
          <MissionCard missions={data?.missions} />
        </div>
        <div className="h-full">
          <AnnouncementSection />
        </div>
        <div className="h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col gap-3">
          <ActionsPanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
