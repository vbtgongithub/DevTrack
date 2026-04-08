// ============================================================================
// HistoryFilters.tsx — Modern filter buttons with depth
// ============================================================================

import React from 'react';
import type { FilterOption } from '../../mocks/historyMockData';

type Props = {
  active: FilterOption;
  onChange: (filter: FilterOption) => void;
};

const FILTERS: { key: FilterOption; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: '📌' },
  { key: 'week', label: 'This Week', icon: '📅' },
  { key: 'month', label: 'This Month', icon: '🗓️' },
];

export const HistoryFilters: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 border border-gray-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
          <span className="text-white text-base">🎛</span>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Filters</h3>
      </div>

      {/* Filter buttons */}
      <div className="space-y-2">
        {FILTERS.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onChange(f.key)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold',
                'transition-all duration-200 active:scale-[0.98]',
                isActive
                  ? 'bg-zinc-900 text-white shadow-md hover:bg-zinc-800 hover:shadow-lg'
                  : 'bg-gray-100 text-zinc-500 hover:bg-gray-200 hover:text-zinc-700 hover:scale-[1.02]',
              ].join(' ')}
            >
              <span className="text-base">{f.icon}</span>
              <span>{f.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
