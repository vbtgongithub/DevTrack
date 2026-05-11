// ============================================================================
// DashboardHeader.tsx — Premium Dashboard Header
// ============================================================================
import React from 'react';
import { Icon } from '../shared/Icon';
import { useUserStore } from '../../store/userStore';

export const DashboardHeader: React.FC = () => {
  const displayName = useUserStore((s) => s.user?.displayName) || 'there';
  const now = new Date();
  const hour = now.getHours();

  let greeting: string;
  let emoji: string;
  if (hour < 12) {
    greeting = 'Good morning';
    emoji = '☀️';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
    emoji = '🌤️';
  } else {
    greeting = 'Good evening';
    emoji = '🌙';
  }

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-dt-primary/5">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-dt-text leading-[1.1]">
          {greeting}, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-dt-primary via-dt-secondary to-dt-lavender animate-gradient-x">{displayName.split(' ')[0]}</span> <span className="text-3xl md:text-4xl align-middle ml-1">{emoji}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-5 text-[15px]">
          <span className="flex items-center gap-2.5 px-1">
            <Icon name="calendar" size={18} className="text-dt-primary/60" />
            <span className="font-bold text-dt-textSecondary/80 tracking-tight">{dateStr}</span>
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-dt-textDisabled/30 hidden sm:inline" />
          <span className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-dt-success/5 text-dt-success text-[13px] font-bold border border-dt-success/10 shadow-[inset_0_1px_2px_rgba(34,197,94,0.05)] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-dt-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
            </span>
            Neural Link: Stable
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-5 py-2.5 bg-white text-dt-text font-semibold rounded-xl border border-dt-primary/10 shadow-sm hover:shadow-md hover:border-dt-primary/30 transition-all duration-300">
          View Report
        </button>
        <button className="px-5 py-2.5 bg-gradient-to-br from-dt-primary to-dt-secondary text-white font-semibold rounded-xl shadow-dt-glow hover:shadow-dt-card-hover transition-all duration-300 transform hover:-translate-y-0.5">
          Start Focus
        </button>
      </div>
    </div>
  );
};