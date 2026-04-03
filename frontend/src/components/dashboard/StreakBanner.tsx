// ============================================================================
// StreakBanner.tsx — Streak Display Banner
// ============================================================================

import React from 'react';
import type { StreakBannerProps } from '../../types/ui.types';
import './Dashboard.css';

export const StreakBanner: React.FC<StreakBannerProps> = ({ data }) => {
  return (
    <div className="bg-white border border-zinc-200/60 shadow-sm rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              data.isActiveToday ? 'bg-emerald-500' : 'bg-zinc-300'
            }`}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 truncate">
                {data.streakLabel}
              </span>
              <span className="text-sm text-zinc-500">·</span>
              <span className="text-sm text-zinc-500">{data.currentStreak} days</span>
            </div>
            <p className="text-sm text-zinc-500 truncate">{data.motivationText}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div className="text-xs text-zinc-500">Longest</div>
            <div className="text-sm font-semibold text-zinc-900">{data.longestStreak} days</div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs text-zinc-500">Started</div>
            <div className="text-sm font-semibold text-zinc-900">{data.streakStartFormatted}</div>
          </div>
        </div>
      </div>

      {/* Keep structure but minimal */}
      <div className="hidden">
        <div>
          <div style={{ width: `${data.percentOfLongest}%` }} />
          <span>{data.percentOfLongest}% of longest streak</span>
        </div>
      </div>

      {data.heatmapDays.length > 0 && (
        <div className="hidden">
          {data.heatmapDays.slice(-30).map((day) => (
            <div key={day.date} title={day.tooltip} />
          ))}
        </div>
      )}
    </div>
  );
};
