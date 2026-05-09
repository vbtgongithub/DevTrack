import React from 'react';
import type { Contest } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';
import { Icon } from '../shared/Icon';

export type ContestListProps = {
  title: string;
  contests: Contest[];
  className?: string;
};

const platformFromLabel = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes('leet')) return 'leetcode';
  if (lower.includes('force')) return 'codeforces';
  if (lower.includes('rank')) return 'hackerrank';
  return 'codechef';
};

function formatContestDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export const ContestList: React.FC<ContestListProps> = React.memo(({ title, contests, className }) => {
  if (contests.length === 0) {
    return (
      <section className={['dt-card p-5', className].filter(Boolean).join(' ')}>
        <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>
        <div className="mt-6 flex flex-col items-center gap-2 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Icon name="trophy" size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-dt-muted">No contest history yet</p>
          <p className="text-xs text-gray-400">Participate in contests to track your progress</p>
        </div>
      </section>
    );
  }

  return (
    <section className={['dt-card p-5', className].filter(Boolean).join(' ')}>
      <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>

      <ul className="mt-4 space-y-3">
        {contests.map((contest) => {
          const ratingChange = contest.ratingChange;
          const isPositive = ratingChange !== null && ratingChange > 0;
          const isNegative = ratingChange !== null && ratingChange < 0;

          return (
            <li
              key={contest.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-white px-3 py-2.5 dt-pop hover:bg-[#F3F4F6]"
            >
              <div className="min-w-0 flex items-center gap-2">
                <div className="w-9 h-9 bg-white border border-black/5 rounded-md flex items-center justify-center shrink-0">
                  <PlatformLogo platform={platformFromLabel(contest.platform)} iconSize={14} className="" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dt-text truncate">{contest.contestName}</p>
                  <p className="text-xs text-dt-muted">
                    {contest.platform} · {formatContestDate(contest.participatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {contest.rank !== null && (
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-md px-2 py-1">
                    #{contest.rank}
                    {contest.totalParticipants ? ` / ${contest.totalParticipants}` : ''}
                  </span>
                )}
                {ratingChange !== null && (
                  <span
                    className={[
                      'rounded-md px-2 py-1 text-xs font-semibold tabular-nums',
                      isPositive ? 'bg-emerald-50 text-emerald-700' : '',
                      isNegative ? 'bg-red-50 text-red-700' : '',
                      !isPositive && !isNegative ? 'bg-gray-100 text-gray-500' : '',
                    ].join(' ')}
                  >
                    {isPositive ? '+' : ''}{ratingChange}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

ContestList.displayName = 'ContestList';
