// ============================================================================
// TodaySummaryBar.tsx — Merged Insight Strip (Single Line)
// ============================================================================
import React from 'react';
import type { ApiStreakData, ApiMission } from '../../types/api.types';

interface TodaySummaryBarProps {
  streakData: ApiStreakData | null | undefined;
  missions: ApiMission[];
}

export const TodaySummaryBar: React.FC<TodaySummaryBarProps> = ({ streakData, missions }) => {
  const items = React.useMemo(() => {
    const result: { emoji: string; text: string }[] = [];

    const currentStreak = streakData?.currentStreak ?? 0;
    if (currentStreak > 0) {
      result.push({ emoji: '🔥', text: `${currentStreak}-day streak` });
    }

    const activeMissions = missions.filter(m => m.status === 'in_progress');
    if (activeMissions.length > 0) {
      const completed = activeMissions.filter(m => m.currentCount >= m.targetCount).length;
      result.push({ emoji: '🎯', text: `${completed}/${activeMissions.length} goals done` });
    }

    if (result.length === 0) {
      result.push({ emoji: '📊', text: 'Start your journey' });
    }

    return result;
  }, [streakData, missions]);

  return (
    <div
      className="flex items-center gap-5 px-7 py-5 rounded-[24px] bg-white/60 backdrop-blur-xl border border-dt-primary/10 shadow-[0_8px_30px_rgba(124,92,252,0.05)]"
      style={{ animation: 'dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
    >
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-dt-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-dt-primary"></span>
        </div>
        <span className="text-[11px] font-black text-dt-primary uppercase tracking-widest">Live Pulse</span>
      </div>
      <div className="h-6 w-px bg-dt-primary/10 shrink-0" />
      <div className="flex items-center gap-6 overflow-x-auto min-w-0">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-dt-textDisabled shrink-0">•</span>}
            <span className="flex items-center gap-2.5 whitespace-nowrap text-[15px] text-dt-text font-bold shrink-0">
              <span className="text-lg drop-shadow-sm">{item.emoji}</span>
              {item.text}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
