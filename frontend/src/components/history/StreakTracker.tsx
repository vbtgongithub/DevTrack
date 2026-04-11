// ============================================================================
// StreakTracker.tsx — Premium streak with depth, glow & smooth animations
// ============================================================================

import React from 'react';
import type { StreakData } from '../../mocks/historyMockData';

type Props = {
  streak: StreakData;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const StreakTracker: React.FC<Props> = ({ streak }) => {
  const [animateBar, setAnimateBar] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setAnimateBar(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-orange-50/40 to-orange-100/30 shadow-sm rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-200"
        >
          <span className="text-white text-base">🔥</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Streak</h3>
      </div>

      {/* Current + Best */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/80 border border-orange-200/50 rounded-xl p-4 text-center hover:scale-[1.03] hover:shadow-sm transition-all duration-200">
          <div className="text-2xl font-extrabold text-orange-600 tracking-tight">{streak.current}</div>
          <div className="text-[10px] text-orange-500 font-semibold uppercase tracking-wider mt-0.5">🔥 Current</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/50 rounded-xl p-4 text-center hover:scale-[1.03] hover:shadow-sm transition-all duration-200">
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">{streak.best}</div>
          <div className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider mt-0.5">🏆 Best</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-500 font-medium">Progress to best</span>
          <span className="text-[11px] font-bold text-gray-700">{streak.percentOfBest}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: animateBar ? `${streak.percentOfBest}%` : '0%',
              background: 'linear-gradient(to right, #fb923c, #ef4444)',
              boxShadow: animateBar ? '0 0 8px rgba(251, 146, 60, 0.4)' : 'none',
              transition: 'width 1000ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 700ms ease',
            }}
          />
        </div>
      </div>

      {/* Mini heat strip */}
      <div>
        <span className="text-[11px] text-gray-500 font-medium mb-2.5 block">Last 7 days</span>
        <div className="flex items-center gap-2">
          {streak.activeDays.map((active, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-full h-7 rounded transition-all duration-200 cursor-default',
                  active
                    ? 'bg-emerald-500 hover:bg-emerald-400 hover:scale-110 shadow-sm shadow-emerald-200 hover:shadow-md hover:shadow-emerald-300'
                    : 'bg-gray-100 hover:bg-gray-200 hover:scale-105',
                ].join(' ')}
                title={active ? 'Active' : 'Inactive'}
              />
              <span className={[
                'text-[9px] font-bold tracking-wider',
                active ? 'text-emerald-600' : 'text-gray-300',
              ].join(' ')}>
                {DAY_LABELS[idx]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
