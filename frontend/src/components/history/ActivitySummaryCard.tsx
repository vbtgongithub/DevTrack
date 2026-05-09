// ============================================================================
// ActivitySummaryCard.tsx — Summary with depth & colored emphasis
// ============================================================================

import React from 'react';
import type { ActivitySummary } from '../../types/activity';

type Props = {
  summary: ActivitySummary;
};

export const ActivitySummaryCard: React.FC<Props> = ({ summary }) => {
  const rows = [
    { label: 'Today', value: summary.today, accent: 'bg-emerald-500', valueColor: 'text-emerald-600' },
    { label: 'Yesterday', value: summary.yesterday, accent: 'bg-gray-400', valueColor: 'text-gray-700' },
    { label: 'This Week', value: summary.thisWeek, accent: 'bg-indigo-500', valueColor: 'text-indigo-600' },
  ];

  return (
    <div className="bg-white shadow-sm rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-md">
          <span className="text-white text-base">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Summary</h3>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3 px-3 rounded-lg border border-transparent hover:border-gray-200/80 hover:bg-gray-50/60 transition-all duration-200 cursor-default group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-9 rounded-full ${row.accent} group-hover:h-10 transition-all duration-200`} />
              <span className="text-sm font-medium text-gray-500 group-hover:text-gray-800 transition-colors duration-200">
                {row.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-bold tabular-nums ${row.valueColor}`}>{row.value}</span>
              <span className="text-[11px] text-gray-400 font-medium">problems</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
