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
      className="flex items-center justify-between gap-4 min-w-0 py-3 px-3 -mx-1 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
      style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:shadow-sm transition-all duration-200">
          <Icon name="trophy" size={18} className="text-gray-400" />
        </div>
        <div className="text-sm font-medium text-gray-900 whitespace-nowrap truncate min-w-0">
          {contest.name}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-xs text-gray-500 whitespace-nowrap font-medium tabular-nums">{contest.time}</div>
        <Icon name="chevron-right" size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors duration-200" />
      </div>
    </div>
  );
};

export const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({ contests = [] }) => {
  // Show empty state when no contests
  if (contests.length === 0) {
    return (
      <section className="rounded-2xl bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon name="calendar" size={15} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Upcoming Contests</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-8 text-sm text-gray-400 text-center">
          No upcoming contests.<br />Check the DSA page for contest history.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon name="calendar" size={15} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Upcoming Contests</h3>
        </div>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">This Week</span>
      </div>

      <div className="mt-1 divide-y divide-gray-50">
        {contests.map((contest, index) => (
          <ContestRow key={index} contest={contest} index={index} />
        ))}
      </div>
    </section>
  );
};
