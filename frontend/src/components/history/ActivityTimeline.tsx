// ============================================================================
// ActivityTimeline.tsx — Timeline with gradient line + WA red indicator
// ============================================================================

import React from 'react';
import type { DayActivity } from '../../types/activity';
import { PlatformLogo } from '../dsa/PlatformLogo';
import { Icon } from '../shared/Icon';

type Props = {
  days: DayActivity[];
};

export const ActivityTimeline: React.FC<Props> = ({ days }) => {
  return (
    <div className="bg-white shadow-sm rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <span className="text-base">📜</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">History</h3>
          <p className="text-[11px] text-gray-400 font-medium">Your complete coding journal</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {days.map((day) => {
          const isToday = day.label === 'Today';
          return (
            <div key={day.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span className={[
                  'text-[10px] font-bold uppercase tracking-[0.15em]',
                  isToday ? 'text-emerald-600' : 'text-gray-400',
                ].join(' ')}>
                  📅 {day.label}
                </span>
                <div className={[
                  'flex-1 h-px',
                  isToday
                    ? 'bg-gradient-to-r from-emerald-200 to-transparent'
                    : 'bg-gradient-to-r from-gray-200 to-transparent',
                ].join(' ')} />
                <span className="text-[10px] font-medium text-gray-300 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
                  {day.submissions.length} solved
                </span>
              </div>

              {/* Items with vertical gradient line */}
              <div className="relative ml-3 pl-8">
                {/* Gradient vertical line */}
                <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-indigo-200 via-gray-200 to-transparent" />

                <div className="space-y-4">
                  {day.submissions.map((s) => {
                    const isGithubSync = s.activityType === 'settings_updated' && s.platform === 'github';
                    const isAC = s.status === 'accepted';

                    if (isGithubSync) {
                      const repos = typeof s.metadata?.public_repos === 'number' ? s.metadata.public_repos : 0;
                      const followers = typeof s.metadata?.followers === 'number' ? s.metadata.followers : 0;
                      return (
                        <div
                          key={s.id}
                          className={[
                            'relative flex gap-3 items-start py-3 px-3 rounded-xl border border-transparent',
                            'hover:border-gray-200 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default group',
                          ].join(' ')}
                        >
                          {/* Glowing dot — purple for sync */}
                          <div
                            className={[
                              'absolute -left-[42px] top-[18px] w-3 h-3 rounded-full ring-[3px] ring-white z-10',
                              'transition-all duration-200 group-hover:scale-150',
                              'bg-violet-500 shadow-md shadow-violet-200 group-hover:shadow-lg group-hover:shadow-violet-300',
                            ].join(' ')}
                          />

                          {/* GitHub icon */}
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 text-violet-600 border border-violet-100">
                            <PlatformLogo platform="github" iconSize={15} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-[13px] text-gray-800">
                                  <span className="font-semibold text-gray-900">{s.problem}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    {repos} repos
                                  </span>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    {followers} followers
                                  </span>
                                  <span className="text-gray-200">·</span>
                                  <span className="text-[11px] text-gray-300">{s.time}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                                SYNC
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={s.id}
                        className={[
                          'relative flex gap-3 items-start py-3 px-3 rounded-xl border border-transparent',
                          'hover:border-gray-200 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default group',
                          !isAC ? 'bg-red-50/30' : '',
                        ].join(' ')}
                      >
                        {/* Glowing dot */}
                        <div
                          className={[
                            'absolute -left-[42px] top-[18px] w-3 h-3 rounded-full ring-[3px] ring-white z-10',
                            'transition-all duration-200 group-hover:scale-150',
                            isAC
                              ? 'bg-emerald-500 shadow-md shadow-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-300'
                              : 'bg-red-500 shadow-md shadow-red-200 group-hover:shadow-lg group-hover:shadow-red-300',
                          ].join(' ')}
                        />

                        {/* Status icon */}
                        <div
                          className={[
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                            isAC
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-red-50 text-red-500 border border-red-200',
                          ].join(' ')}
                        >
                          <Icon
                            name={isAC ? 'check-circle' : 'exclamation-triangle'}
                            size={14}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[13px] text-gray-800">
                                <span className="font-medium text-gray-400">
                                  {isAC ? 'Solved' : 'Attempted'}
                                </span>{' '}
                                <span className="font-semibold text-gray-900">{s.problem}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <PlatformLogo platform={s.platform} iconSize={13} />
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
                                </span>
                                <span className="text-gray-200">·</span>
                                <span className="text-[11px] text-gray-400">{s.topic}</span>
                                <span className="text-gray-200">·</span>
                                <span className="text-[11px] text-gray-300">{s.time}</span>
                              </div>
                            </div>
                            <span
                              className={[
                                'text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 tracking-wider',
                                isAC
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-red-100 text-red-600 border border-red-200 shadow-sm shadow-red-100',
                              ].join(' ')}
                            >
                              {isAC ? 'AC' : 'WA'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
