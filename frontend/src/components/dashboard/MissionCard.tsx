import React from 'react';
import { Icon } from '../shared/Icon';
import type { ApiMission } from '../../types/api.types';

interface MissionCardProps {
  missions?: ApiMission[];
}

export const MissionCard: React.FC<MissionCardProps> = ({ missions = [] }) => {
  const dailyMissions = missions.filter(m => m.type === 'daily' && m.status !== 'expired');

  const completedCount = dailyMissions.filter((m) => m.status === 'completed').length;
  const total = dailyMissions.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (dailyMissions.length === 0) {
    return (
      <div className="h-full dt-card bg-gradient-to-br from-white to-dt-bg/50 border-dt-primary/10 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-dt-primary to-dt-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dt-primary/10 flex items-center justify-center border border-dt-primary/20">
              <Icon name="target" size={16} className="text-dt-primary" />
            </div>
            <h3 className="text-[15px] font-bold text-dt-text tracking-tight">Today's Mission</h3>
          </div>
          <div className="text-xl font-extrabold text-dt-textDisabled tabular-nums">—</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-dt-primary/5 flex items-center justify-center mb-4 border border-dt-primary/10">
            <Icon name="target" size={24} className="text-dt-textMuted" />
          </div>
          <p className="text-[14px] text-dt-textSecondary font-semibold">No active missions</p>
          <p className="text-xs text-dt-textMuted mt-1.5 font-medium">Connect platforms to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/40 backdrop-blur-2xl border border-dt-primary/10 rounded-[24px] p-7 shadow-[0_8px_30px_rgba(124,92,252,0.05)] hover:shadow-[0_12px_40px_rgba(124,92,252,0.08)] hover:-translate-y-1 transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-700">
        <Icon name="target" size={100} className="text-dt-text" />
      </div>
      <div className="flex justify-between items-center mb-3 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-white/60 border border-dt-primary/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
            <Icon name="target" size={22} className="text-dt-primary" />
          </div>
          <h3 className="text-[16px] font-black text-dt-text tracking-tight">Today's Mission</h3>
        </div>
        <div className="text-2xl font-extrabold text-dt-text tabular-nums tracking-tighter">{pct}%</div>
      </div>

      <div className="text-[12px] font-black text-dt-textSecondary/60 mb-4 ml-16 uppercase tracking-widest relative z-10">{completedCount}/{total} completed</div>

      <div className="w-full h-2 bg-dt-primary/5 rounded-full overflow-hidden mb-6 shadow-inner relative z-10">
        <div
          className="h-full bg-gradient-to-r from-dt-primary to-dt-secondary rounded-full transition-all duration-1000 cubic-bezier(0.22, 1, 0.36, 1) shadow-sm"
          style={{ width: mounted ? `${pct}%` : '0%' }}
        />
      </div>

      <div className="flex flex-col gap-3 flex-1 relative z-10">
        {dailyMissions.map((m, index) => {
          const isCompleted = m.status === 'completed';
          return (
            <div
              key={m.id}
              className={[
                'flex items-center gap-4 py-3.5 px-4 rounded-[16px] border',
                'transition-all duration-300 hover:border-dt-primary/30 cursor-pointer',
                isCompleted ? 'bg-dt-primary/5 border-transparent opacity-80' : 'bg-white/80 border-dt-primary/10 shadow-sm hover:shadow-md hover:-translate-y-0.5',
              ].join(' ')}
              style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 80}ms both` }}
            >
              <div
                className={[
                  'w-5 h-5 rounded-[8px] border-2 flex items-center justify-center shrink-0',
                  'transition-all duration-300',
                  isCompleted
                    ? 'bg-dt-primary border-dt-primary text-white shadow-sm'
                    : 'border-dt-primary/20 bg-white',
                ].join(' ')}
              >
                {isCompleted && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span
                className={[
                  'text-[14px] transition-all duration-300 tracking-tight',
                  isCompleted ? 'line-through text-dt-textMuted font-semibold' : 'text-dt-text font-bold',
                ].join(' ')}
              >
                {m.title}
              </span>
              {isCompleted && (
                <Icon name="check-circle" size={18} className="text-dt-success ml-auto shrink-0 drop-shadow-sm" />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[13px] font-bold text-dt-textSecondary mt-6 pt-5 border-t border-dt-primary/10 text-center bg-white/40 -mx-7 -mb-7 pb-6 relative z-10 tracking-tight">
        {pct === 100
          ? '🎉 All missions completed! Great work.'
          : `You're ${total - completedCount} task${total - completedCount > 1 ? 's' : ''} away from today's goals.`}
      </div>
    </div>
  );
};
