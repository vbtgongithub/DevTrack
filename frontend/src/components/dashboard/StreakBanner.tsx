// ============================================================================
// StreakBanner.tsx — Streak Display Banner
// ============================================================================

import React from 'react';
import type { StreakBannerProps } from '../../types/ui.types';
import './Dashboard.css';

export const StreakBanner: React.FC<StreakBannerProps> = ({ data }) => {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              data.isActiveToday ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {data.streakLabel}
              </span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">{data.currentStreak} days</span>
            </div>
            <p className="text-sm text-gray-500 truncate">{data.motivationText}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div className="text-xs text-gray-500">Longest</div>
            <div className="text-sm font-semibold text-gray-900">{data.longestStreak} days</div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs text-gray-500">Started</div>
            <div className="text-sm font-semibold text-gray-900">{data.streakStartFormatted}</div>
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
