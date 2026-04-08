// ============================================================================
// ActivityTimeline.tsx — Alive timeline with glow dots & gradient line
// ============================================================================

import React from 'react';
import type { DayActivity } from '../../mocks/historyMockData';
import { PlatformLogo } from '../dsa/PlatformLogo';
import { Icon } from '../shared/Icon';

type Props = {
  days: DayActivity[];
};

export const ActivityTimeline: React.FC<Props> = ({ days }) => {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 border border-gray-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
          <span className="text-white text-base">📜</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-900 tracking-tight">History</h3>
          <p className="text-[11px] text-zinc-400 font-medium">Your complete coding journal</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {days.map((day) => (
          <div key={day.date}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                📅 {day.label}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
              <span className="text-[10px] font-semibold text-zinc-300 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
                {day.submissions.length} solved
              </span>
            </div>

            {/* Items with vertical gradient line */}
            <div className="relative ml-3 pl-8">
              {/* Gradient vertical line */}
              <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200" />

              <div className="space-y-4">
                {day.submissions.map((s) => {
                  const isAC = s.status === 'accepted';
                  return (
                    <div
                      key={s.id}
                      className="relative flex gap-3 items-start py-3 px-3 rounded-lg border border-transparent hover:border-gray-200/80 hover:bg-gray-50/60 hover:shadow-sm transition-all duration-200 cursor-default group"
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

                      {/* Status icon in rounded bg */}
                      <div
                        className={[
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                          isAC
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-red-50 text-red-500 border border-red-100',
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
                            <div className="text-[13px] text-zinc-800">
                              <span className="font-medium text-zinc-400">
                                {isAC ? 'Solved' : 'Attempted'}
                              </span>{' '}
                              <span className="font-bold text-zinc-900">{s.problem}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <PlatformLogo platform={s.platform} iconSize={13} />
                              <span className="text-[11px] text-zinc-500 font-medium">
                                {s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
                              </span>
                              <span className="text-zinc-200">·</span>
                              <span className="text-[11px] text-zinc-400">{s.topic}</span>
                              <span className="text-zinc-200">·</span>
                              <span className="text-[11px] text-zinc-300 font-medium">{s.time}</span>
                            </div>
                          </div>
                          <span
                            className={[
                              'text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 tracking-wider',
                              isAC
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-100'
                                : 'bg-red-50 text-red-500 border border-red-100 shadow-sm shadow-red-100',
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
        ))}
      </div>
    </div>
  );
};
