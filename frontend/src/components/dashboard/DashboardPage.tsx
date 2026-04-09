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
import type { DashboardVM } from '../../types/vm.types';

const DashboardPage: React.FC = () => {
  const { data } = useDashboardData();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const safeData: DashboardVM = data
    ? {
        header: data.header ?? { greeting: 'Hello, User', displayName: 'User', avatarUrl: null, todayDate: '', quickStats: [] },
        streak: data.streak ?? { currentStreak: 0, longestStreak: 0, streakLabel: '0 Day Streak', isActiveToday: false, motivationText: '', percentOfLongest: 0, streakStartFormatted: '', heatmapDays: [] },
        stats: data.stats ?? { cards: [] },
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        missions: data.missions ?? { title: 'Missions', activeMissions: [], completedToday: 0, totalToday: 0, completionPercent: 0 },
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      }
    : {
        header: { greeting: 'Hello, User', displayName: 'User', avatarUrl: null, todayDate: '', quickStats: [] },
        streak: { currentStreak: 0, longestStreak: 0, streakLabel: '0 Day Streak', isActiveToday: false, motivationText: '', percentOfLongest: 0, streakStartFormatted: '', heatmapDays: [] },
        stats: { cards: [] },
        platforms: [],
        missions: { title: 'Missions', activeMissions: [], completedToday: 0, totalToday: 0, completionPercent: 0 },
        recentActivity: [],
      };

  return (
    <div
      className={[
        'flex flex-col gap-6 transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {/* 1. Header */}
      <DashboardHeader data={safeData.header} />

      {/* 2. Merged Insight Strip */}
      <TodaySummaryBar />

      {/* 3. PRIMARY ZONE — Streak (large) + Daily Goal + Achievements */}
      <GamificationPanel />

      {/* 4. Stats Grid */}
      <StatsGrid />

      {/* 5. AI INSIGHTS — Visually Dominant */}
      <EnhancedInsightsCard />

      {/* 6. Progress Cards */}
      <ProgressCards />

      {/* 7. Mission + Contests + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="h-full">
          <MissionCard />
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
