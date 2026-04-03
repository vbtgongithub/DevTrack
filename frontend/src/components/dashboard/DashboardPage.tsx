import React from 'react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardHeader } from './DashboardHeader';
import { StatsGrid } from './StatsGrid';
import { InsightsCard } from './InsightsCard';
import { ActionsPanel } from './ActionsPanel';
import { MissionCard } from './MissionCard';
import type { DashboardVM } from '../../types/vm.types';

const DashboardPage: React.FC = () => {
  const { data } = useDashboardData();

  const safeData: DashboardVM = data
    ? {
        header: data.header ?? {
          greeting: 'Hello, User',
          displayName: 'User',
          avatarUrl: null,
          todayDate: '',
          quickStats: [],
        },
        streak: data.streak ?? {
          currentStreak: 0,
          longestStreak: 0,
          streakLabel: '0 Day Streak',
          isActiveToday: false,
          motivationText: '',
          percentOfLongest: 0,
          streakStartFormatted: '',
          heatmapDays: [],
        },
        stats: data.stats ?? { cards: [] },
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        missions: data.missions ?? {
          title: 'Missions',
          activeMissions: [],
          completedToday: 0,
          totalToday: 0,
          completionPercent: 0,
        },
        recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
      }
    : {
        header: {
          greeting: 'Hello, User',
          displayName: 'User',
          avatarUrl: null,
          todayDate: '',
          quickStats: [],
        },
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          streakLabel: '0 Day Streak',
          isActiveToday: false,
          motivationText: '',
          percentOfLongest: 0,
          streakStartFormatted: '',
          heatmapDays: [],
        },
        stats: { cards: [] },
        platforms: [],
        missions: {
          title: 'Missions',
          activeMissions: [],
          completedToday: 0,
          totalToday: 0,
          completionPercent: 0,
        },
        recentActivity: [],
      };

  return (
    <div className="space-y-6">
      <DashboardHeader data={safeData.header} />

      <StatsGrid data={safeData.stats} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="h-full">
          <InsightsCard />
        </div>
        <div className="h-full bg-[#faf7f2] border border-[#e5dfd6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col gap-3">
          <ActionsPanel />
        </div>
        <div className="h-full">
          <MissionCard />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
