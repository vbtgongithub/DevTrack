// ============================================================================
// SmartInsights.tsx — Connected AI insights with colored accents & depth
// ============================================================================

import React from 'react';
import type { SmartInsight } from '../../mocks/historyMockData';

type Props = {
  insights: SmartInsight[];
};

export const SmartInsights: React.FC<Props> = ({ insights }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return (
    <div className="bg-white shadow-sm rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
          <span className="text-white text-base">🧠</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Insights</h3>
          <p className="text-[11px] text-gray-400 font-medium">Smart behavioral analysis</p>
        </div>
      </div>

      {/* Insight cards */}
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={insight.id}
            className={[
              'relative flex items-start gap-3 px-4 py-3.5 rounded-lg',
              'border-l-4 bg-gray-50/60 border border-gray-100/80',
              'hover:bg-gray-50 hover:shadow-sm',
              'transition-all duration-300 cursor-default group overflow-hidden',
              mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
            ].join(' ')}
            style={{
              borderLeftColor: insight.color,
              transitionDelay: `${idx * 100}ms`,
            }}
          >
            <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
              {insight.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5"
                style={{ color: insight.color }}
              >
                {insight.label}
              </div>
              <div className="text-[13px] text-gray-700 leading-snug font-medium">
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Updated based on your recent activity</span>
        </div>
      </div>
    </div>
  );
};
