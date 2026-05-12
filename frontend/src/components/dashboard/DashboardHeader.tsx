// ============================================================================
// DashboardHeader.tsx — Premium Dashboard Header
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Icon } from '../shared/Icon';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import { useDashboardData } from '../../hooks/useDashboardData';

const MOTIVATIONAL_INSIGHTS = [
  "You're in the top 15% of active developers this week.",
  "Your algorithmic consistency is peaking. Keep pushing.",
  "Ecosystem sync complete. All systems nominal.",
  "Your problem-solving velocity is higher than your 30-day average."
];

export const DashboardHeader: React.FC = () => {
  const displayName = useUserStore((s) => s.user?.displayName) || 'there';
  const { fetchAllPlatforms, syncState } = useProfileStore();
  const { refetch } = useDashboardData();

  const handleSync = async () => {
    await fetchAllPlatforms();
    refetch();
  };

  const isSyncing = syncState === 'syncing';
  const now = new Date();
  const hour = now.getHours();

  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % MOTIVATIONAL_INSIGHTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="flex flex-col gap-5">
        <h1 className="text-display text-4xl md:text-5xl text-dt-text leading-[1.1] relative">
          {greeting}, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-dt-primary via-[#A78BFA] to-[#FF8B94] animate-gradient-x drop-shadow-sm">{displayName.split(' ')[0]}</span> <span className="text-3xl md:text-4xl align-middle ml-1 hover:animate-[wiggle_1s_ease-in-out_infinite] inline-block origin-bottom">{emoji}</span>
          <div className="absolute -z-10 -inset-4 bg-gradient-to-r from-dt-primary/10 to-[#FF8B94]/10 blur-2xl opacity-50 mix-blend-multiply rounded-full pointer-events-none" />
        </h1>
        
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-4 text-[14px]">
            <span className="flex items-center gap-2 px-1">
              <Icon name="calendar" size={16} className="text-dt-primary/60" />
              <span className="text-mono-metric font-semibold text-dt-textSecondary/80 tracking-tight">{dateStr}</span>
            </span>
            <div className="w-1 h-1 rounded-full bg-dt-textDisabled/40 hidden sm:inline" />
            <span className="text-label !text-[10px] flex items-center gap-2 px-3 py-1 rounded-full bg-dt-success/5 !text-dt-success border border-dt-success/10 shadow-[0_0_15px_rgba(34,197,94,0.05)] backdrop-blur-md transition-all hover:bg-dt-success/10 cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-dt-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              </span>
              Neural Link Active
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-dt-textSecondary/70 text-[13px] font-medium h-5 overflow-hidden tracking-tight">
            <Icon name="sparkles" size={14} className="text-dt-primary/50 shrink-0" />
            <div className="relative w-full h-full">
              {MOTIVATIONAL_INSIGHTS.map((insight, idx) => (
                <div 
                  key={idx}
                  className={['absolute inset-0 transition-all duration-700 ease-in-out flex items-center', 
                    idx === insightIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  ].join(' ')}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="group relative px-5 py-2.5 bg-white/60 backdrop-blur-md text-dt-text font-semibold rounded-xl border border-dt-primary/10 shadow-sm hover:shadow-md hover:border-dt-primary/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Icon name="arrow-path" size={16} className={['relative z-10', isSyncing ? 'animate-spin text-dt-primary' : 'text-dt-textSecondary group-hover:text-dt-primary transition-colors'].join(' ')} />
          <span className="relative z-10">{isSyncing ? 'Syncing...' : 'Sync All'}</span>
        </button>
        <button className="relative px-6 py-2.5 bg-gradient-to-br from-dt-primary via-[#7C5CFC] to-[#A78BFA] text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(109,79,242,0.3)] hover:shadow-[0_8px_30px_rgba(109,79,242,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
          <span className="relative z-10 flex items-center gap-2">
            <Icon name="lightning-bolt" size={16} className="animate-pulse" />
            Start Focus
          </span>
        </button>
      </div>
    </div>
  );
};