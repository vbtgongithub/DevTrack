import React from 'react';
import leetcodeLogo from '../../assets/logos/LeetCode.png';

const ACTIVITY_DATA = [3, 5, 2, 7, 4, 6, 1];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_ACTIVITY = Math.max(...ACTIVITY_DATA);

export const InsightsCard: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-in-out flex flex-col">
      <div className="text-sm font-semibold text-gray-900 mb-4">Insights</div>

      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50/80">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-400 font-medium">Acceptance Rate</span>
            <span className="text-lg font-bold text-gray-900 tabular-nums leading-tight">67%</span>
          </div>
          <span className="text-xs text-gray-500 shrink-0">4/6 accepted</span>
        </div>

        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50/80">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-400 font-medium">Most Active</span>
            <span className="text-sm font-semibold text-gray-900 leading-tight">LeetCode</span>
          </div>
          <img src={leetcodeLogo} alt="LeetCode" className="w-5 h-5 object-contain shrink-0" />
        </div>

        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50/80">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-400 font-medium">Top Topic</span>
            <span className="text-sm font-semibold text-gray-900 leading-tight">Arrays</span>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full tabular-nums shrink-0">82%</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-[11px] text-gray-400 font-medium mb-2">Last 7 Days</div>
        <div className="flex items-end gap-[6px] h-14">
          {ACTIVITY_DATA.map((v, i) => {
            const pct = Math.max((v / MAX_ACTIVITY) * 100, 12);
            return (
              <div key={DAY_LABELS[i]} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-full rounded-sm transition-all duration-500 ease-out',
                    v > 0 ? 'bg-gray-900 hover:bg-black' : 'bg-gray-200',
                    'hover:scale-110',
                  ].join(' ')}
                  style={{
                    height: mounted ? `${pct}%` : '0%',
                    transitionDelay: `${i * 60}ms`,
                    minHeight: '3px',
                  }}
                  title={`${DAY_LABELS[i]}: ${v} problems`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-[6px] mt-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="flex-1 text-center text-[9px] text-gray-400">{d.charAt(0)}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
