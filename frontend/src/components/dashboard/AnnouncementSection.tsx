import React from 'react';
import { Icon } from '../shared/Icon';

interface Contest {
  name: string;
  platform: string;
  time: string;
}

interface AnnouncementSectionProps {
  contests?: Contest[];
}

const ContestRow: React.FC<{ contest: Contest; index: number }> = ({ contest, index }) => {
  return (
    <div
      className="flex items-center justify-between gap-3 min-w-0 py-3.5 px-4 rounded-[16px] bg-white/60 hover:bg-white border border-dt-primary/10 hover:border-dt-primary/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5"
      style={{ animation: `dtFadeIn 600ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 80}ms both` }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded-[12px] bg-white border border-dt-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_4px_15px_rgba(124,92,252,0.05)]">
          <Icon name="trophy" size={18} className="text-amber-500 drop-shadow-sm" />
        </div>
        <div className="text-[14px] font-bold text-dt-text whitespace-nowrap truncate min-w-0 tracking-tight group-hover:text-dt-primary transition-colors">
          {contest.name}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-[11px] text-dt-textSecondary whitespace-nowrap font-black tabular-nums bg-white border border-dt-primary/10 px-3 py-1.5 rounded-[10px] shadow-sm uppercase tracking-widest">{contest.time}</div>
        <Icon name="chevron-right" size={14} className="text-dt-textMuted group-hover:text-dt-primary group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </div>
  );
};

export const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({ contests = [] }) => {
  if (contests.length === 0) {
    return (
      <section className="bg-white/40 backdrop-blur-2xl border border-gray-300 rounded-[24px] p-7 shadow-[0_8px_30px_rgba(124,92,252,0.05)] relative overflow-hidden h-full flex flex-col group transition-all duration-500 hover:shadow-[0_12px_40px_rgba(124,92,252,0.08)] hover:-translate-y-1 hover:border-dt-primary/35 cubic-bezier(0.22, 1, 0.36, 1)">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-700">
          <Icon name="calendar" size={100} className="text-dt-text" />
        </div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-white/60 flex items-center justify-center border border-dt-primary/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Icon name="calendar" size={22} className="text-dt-primary" />
            </div>
            <h3 className="text-[16px] font-black text-dt-text tracking-tight">Upcoming Contests</h3>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center relative z-10">
          <div className="w-16 h-16 rounded-[20px] bg-white flex items-center justify-center mb-4 border border-dt-primary/10 shadow-[0_8px_30px_rgba(124,92,252,0.05)]">
            <Icon name="trophy" size={28} className="text-dt-textMuted/50" />
          </div>
          <p className="text-[15px] font-bold text-dt-textSecondary tracking-tight">No upcoming contests</p>
          <p className="text-[13px] text-dt-textSecondary/70 mt-1.5 font-bold tracking-tight">Check the DSA page for history</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/40 backdrop-blur-2xl border border-gray-300 rounded-[24px] p-7 shadow-[0_8px_30px_rgba(124,92,252,0.05)] relative overflow-hidden h-full flex flex-col group transition-all duration-500 hover:shadow-[0_12px_40px_rgba(124,92,252,0.08)] hover:-translate-y-1 hover:border-dt-primary/35 cubic-bezier(0.22, 1, 0.36, 1)">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none transform translate-x-4 -translate-y-4 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-700">
        <Icon name="calendar" size={100} className="text-dt-text" />
      </div>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-white/60 flex items-center justify-center border border-dt-primary/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
            <Icon name="calendar" size={22} className="text-dt-primary" />
          </div>
          <h3 className="text-[16px] font-black text-dt-text tracking-tight">Upcoming Contests</h3>
        </div>
        <span className="text-[10px] font-black text-dt-textSecondary uppercase tracking-widest bg-white/80 px-3 py-1.5 rounded-xl border border-dt-primary/10 shadow-sm backdrop-blur-md">This Week</span>
      </div>

      <div className="mt-2 flex flex-col gap-3 flex-1 relative z-10">
        {contests.map((contest, index) => (
          <ContestRow key={index} contest={contest} index={index} />
        ))}
      </div>
    </section>
  );
};
