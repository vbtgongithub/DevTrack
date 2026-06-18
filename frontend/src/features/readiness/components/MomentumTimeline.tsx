import React from 'react';
import { motion } from 'framer-motion';
import type { ApiStreakHistoryEntry } from '../../../services/streakService';
import { cn } from '../../../lib/design-system/tokens.css';

interface Props {
  history: ApiStreakHistoryEntry[];
}

export const MomentumTimeline: React.FC<Props> = ({ history }) => {
  // Let's take the last 30 days for a longitudinal view
  const recentHistory = history.slice(-30);

  // Group into weeks for a mini-contribution grid look
  const weeks = [];
  for (let i = 0; i < recentHistory.length; i += 7) {
    weeks.push(recentHistory.slice(i, i + 7));
  }

  return (
    <div className="dt-card-base bg-white/60 backdrop-blur-3xl p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Momentum Timeline</h3>
        <p className="text-xs text-slate-500 font-medium">Longitudinal execution consistency (30d)</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-end gap-1.5 md:gap-2 justify-between w-full h-[120px] mb-4">
          {recentHistory.map((day, i) => {
            const height = day.count > 0 ? Math.max(20, Math.min(100, day.count * 10)) : 8;
            return (
              <motion.div
                key={day.date}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 1 }}
                transition={{ delay: i * 0.02, type: 'spring', stiffness: 200, damping: 20 }}
                className="relative group w-full flex-1 flex flex-col justify-end"
              >
                <div
                  className={cn(
                    'w-full rounded-t-[4px] transition-all duration-300',
                    day.active
                      ? 'bg-violet-400 hover:bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                      : 'bg-slate-200/50 hover:bg-slate-300/50'
                  )}
                  style={{ height: `${height}%` }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-xl">
                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    <br />
                    <span className="text-violet-300">{day.count} activities</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 border-t border-slate-100 pt-4">
          <span>30 Days Ago</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-200" /> Rest</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-violet-400" /> Active</span>
          </div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};
