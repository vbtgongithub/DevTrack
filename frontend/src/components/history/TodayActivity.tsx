// ============================================================================
// TodayActivity.tsx — Hero card with visual focus & depth
// ============================================================================

import React from 'react';
import type { HistorySubmission } from '../../mocks/historyMockData';
import { PlatformLogo } from '../dsa/PlatformLogo';

type Props = {
  submissions: HistorySubmission[];
};

export const TodayActivity: React.FC<Props> = ({ submissions }) => {
  const todayItems = submissions.filter((s) => s.dateLabel === 'Today');
  const platformsUsed = [...new Set(todayItems.map((s) => s.platform))];
  const topicsCovered = [...new Set(todayItems.map((s) => s.topic))];
  const accepted = todayItems.filter((s) => s.status === 'accepted').length;
  const productivityScore = todayItems.length > 0
    ? Math.round((accepted / todayItems.length) * 100)
    : 0;

  return (
    <div
      className="relative bg-gradient-to-br from-white via-white to-gray-50/80 border-2 border-gray-300 shadow-sm rounded-xl p-6 hover:shadow-xl hover:-translate-y-[2px] transition-all duration-300 group"
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-zinc-300 to-transparent rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            <span className="text-white text-base">📅</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Today</h3>
            <p className="text-[11px] text-zinc-400 font-medium">April 8, 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xs font-bold text-emerald-700">Score: {productivityScore}%</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-600">{accepted}/{todayItems.length} solved</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 hover:border-gray-200 transition-all duration-200">
          <div className="text-2xl font-bold text-zinc-900">{todayItems.length}</div>
          <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Problems</div>
        </div>
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 hover:border-gray-200 transition-all duration-200">
          <div className="flex items-center justify-center gap-2 h-[32px]">
            {platformsUsed.map((p) => (
              <PlatformLogo key={p} platform={p} iconSize={18} />
            ))}
          </div>
          <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Platforms</div>
        </div>
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 hover:border-gray-200 transition-all duration-200">
          <div className="text-2xl font-bold text-zinc-900">{topicsCovered.length}</div>
          <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Topics</div>
        </div>
      </div>

      {/* Topics pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {topicsCovered.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-zinc-600 hover:bg-gray-200 hover:text-zinc-800 transition-all duration-200 cursor-default"
          >
            {topic}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200/80 mb-4" />

      {/* Submission list */}
      <div className="space-y-1">
        {todayItems.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-transparent hover:border-gray-200/80 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-50">
              <PlatformLogo platform={s.platform} iconSize={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-zinc-900 truncate">{s.problem}</div>
              <div className="text-[11px] text-zinc-400 font-medium">{s.topic} · {s.time}</div>
            </div>
            <span
              className={[
                'text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider',
                s.status === 'accepted'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-100'
                  : 'bg-red-50 text-red-500 border border-red-100 shadow-sm shadow-red-100',
              ].join(' ')}
            >
              {s.status === 'accepted' ? 'AC' : 'WA'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
