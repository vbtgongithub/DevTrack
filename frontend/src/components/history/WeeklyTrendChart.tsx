// ============================================================================
// WeeklyTrendChart.tsx — Premium bar chart with depth & smooth animations
// ============================================================================

import React from 'react';
import type { WeeklyBar } from '../../mocks/historyMockData';

type Props = {
  bars: WeeklyBar[];
};

export const WeeklyTrendChart: React.FC<Props> = ({ bars }) => {
  const displayBars = bars.slice(-7);
  const maxCount = Math.max(...displayBars.map((b) => b.count), 1);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const [animated, setAnimated] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
            <span className="text-white text-base">📈</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Weekly Activity</h3>
            <p className="text-[11px] text-zinc-400 font-medium">Problems solved per day</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-zinc-200" />
            <span className="font-medium">Past</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-zinc-900" />
            <span className="font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-32 px-1">
        {displayBars.map((bar, idx) => {
          const heightPercent = bar.count > 0 ? (bar.count / maxCount) * 100 : 5;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={`${bar.day}-${idx}`}
              className="flex-1 flex flex-col items-center gap-1.5"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Count label */}
              <div
                className={[
                  'text-xs font-bold transition-all duration-300',
                  isHovered ? '-translate-y-1 text-zinc-900' : 'text-zinc-400',
                ].join(' ')}
              >
                {bar.count}
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-md cursor-pointer"
                style={{
                  height: animated ? `${heightPercent}%` : '0%',
                  minHeight: bar.count === 0 ? '4px' : '10px',
                  background: bar.isToday
                    ? 'linear-gradient(to top, #18181b, #3f3f46)'
                    : bar.count > 0
                    ? '#d4d4d8'
                    : '#f4f4f5',
                  boxShadow: isHovered
                    ? bar.isToday
                      ? '0 4px 12px rgba(0,0,0,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.06)'
                    : 'none',
                  transform: isHovered ? 'scaleY(1.1) scaleX(1.05)' : 'scaleY(1) scaleX(1)',
                  transformOrigin: 'bottom',
                  transition: 'height 600ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 200ms ease, box-shadow 200ms ease',
                  transitionDelay: animated ? '0ms' : `${idx * 60}ms`,
                }}
              />

              {/* Day label */}
              <span
                className={[
                  'text-[10px] font-semibold tracking-wide transition-colors duration-200',
                  bar.isToday ? 'text-zinc-900' : isHovered ? 'text-zinc-600' : 'text-zinc-400',
                ].join(' ')}
              >
                {bar.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Total</span>
          <span className="text-sm font-bold text-zinc-900">
            {displayBars.reduce((a, b) => a + b.count, 0)}
          </span>
          <span className="text-[11px] text-zinc-400">problems</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 font-medium">Avg</span>
          <span className="text-sm font-bold text-zinc-900">
            {(displayBars.reduce((a, b) => a + b.count, 0) / 7).toFixed(1)}
          </span>
          <span className="text-[11px] text-zinc-400">/ day</span>
        </div>
      </div>
    </div>
  );
};
