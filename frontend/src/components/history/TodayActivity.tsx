// ============================================================================
// TodayActivity.tsx — Hero card with green accent highlight
// ============================================================================

import React from 'react';
import type { HistorySubmission } from '../../types/activity';
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
      className="relative bg-gradient-to-br from-white via-white to-emerald-50/30 border border-gray-200 border-l-4 border-l-emerald-500 shadow-sm rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm">
            <span className="text-lg">📅</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Today</h3>
            <p className="text-[11px] text-gray-400 font-medium">April 8, 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
            <span className="text-xs font-bold text-emerald-700">Score: {productivityScore}%</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600">{accepted}/{todayItems.length} solved</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 transition-all duration-200">
          <div className="text-2xl font-bold text-gray-900">{todayItems.length}</div>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Problems</div>
        </div>
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 transition-all duration-200">
          <div className="flex items-center justify-center gap-2 h-[32px]">
            {platformsUsed.map((p) => (
              <PlatformLogo key={p} platform={p} iconSize={18} />
            ))}
          </div>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Platforms</div>
        </div>
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-4 py-3.5 text-center hover:bg-gray-100/60 transition-all duration-200">
          <div className="text-2xl font-bold text-gray-900">{topicsCovered.length}</div>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Topics</div>
        </div>
      </div>

      {/* Topics pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {topicsCovered.map((topic) => (
          <span
            key={topic}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 cursor-default"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="border-t border-gray-100 mb-4" />

      {/* Submission list */}
      <div className="space-y-1">
        {todayItems.map((s) => {
          const isGithubSync = s.activityType === 'settings_updated' && s.platform === 'github';
          const isWA = s.status !== 'accepted';

          if (isGithubSync) {
            const repos = typeof s.metadata?.public_repos === 'number' ? s.metadata.public_repos : 0;
            const followers = typeof s.metadata?.followers === 'number' ? s.metadata.followers : 0;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <PlatformLogo platform="github" iconSize={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-900 truncate">{s.problem}</div>
                  <div className="text-[11px] text-gray-400">{repos} repos · {followers} followers · {s.time}</div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                  SYNC
                </span>
              </div>
            );
          }

          return (
            <div
              key={s.id}
              className={[
                'flex items-center gap-3 py-2.5 px-3 rounded-xl border border-transparent',
                'hover:border-gray-200 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default',
                isWA ? 'bg-red-50/40' : '',
              ].join(' ')}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0">
                <PlatformLogo platform={s.platform} iconSize={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate">{s.problem}</div>
                <div className="text-[11px] text-gray-400">{s.topic} · {s.time}</div>
              </div>
              <span
                className={[
                  'text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider',
                  isWA
                    ? 'bg-red-100 text-red-600 border border-red-200 shadow-sm shadow-red-100'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
                ].join(' ')}
              >
                {isWA ? 'WA' : 'AC'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
