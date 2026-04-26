// ============================================================================
// TodaySummaryBar.tsx — Merged Insight Strip (Single Line)
// ============================================================================
import React from 'react';
import type { DashboardData } from '../../hooks/useDashboardData';

interface TodaySummaryBarProps {
  data: DashboardData | null;
}

export const TodaySummaryBar: React.FC<TodaySummaryBarProps> = ({ data }) => {
  const totalSolved = data?.totalSolved ?? 0;
  const streak = data?.streak ?? 0;
  const easy = data?.easy ?? 0;
  const medium = data?.medium ?? 0;
  const hard = data?.hard ?? 0;

  const items = [
    { emoji: '🔥', text: `${streak}-day streak` },
    { emoji: '✅', text: `${totalSolved} problems solved` },
    { emoji: '📊', text: `${easy}E · ${medium}M · ${hard}H` },
    { emoji: '🎯', text: 'Keep going!' },
  ];

  return (
    <div
      className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 border border-indigo-100/60 shadow-sm"
      style={{ animation: 'dtFadeIn 520ms ease-out both' }}
    >
      <div className="flex items-center gap-1 shrink-0">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Today</span>
      </div>
      <div className="h-4 w-px bg-indigo-200/60 shrink-0" />
      <div className="flex items-center gap-4 overflow-x-auto min-w-0">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-gray-300 shrink-0">•</span>}
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm text-gray-700 font-medium shrink-0">
              <span className="text-base">{item.emoji}</span>
              {item.text}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
