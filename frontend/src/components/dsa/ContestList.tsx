import React from 'react';
import type { Contest } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';

export type ContestListProps = {
  title: string;
  contests: Contest[];
  className?: string;
};

const badgeClass = (time: string) => {
  const lower = time.toLowerCase();
  if (lower.includes('2 hrs') || lower.includes('urgent')) return 'bg-red-100 text-red-600';
  if (lower.includes('tomorrow') || lower.includes('soon')) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-600';
};

const platformFromLabel = (platform: string) => {
  const lower = platform.toLowerCase();
  if (lower.includes('leet')) return 'leetcode';
  if (lower.includes('force')) return 'codeforces';
  if (lower.includes('rank')) return 'hackerrank';
  return 'codechef';
};

export const ContestList: React.FC<ContestListProps> = React.memo(({ title, contests, className }) => {
  return (
    <section
      className={[
        'bg-white border border-gray-300 shadow-md rounded-xl p-5 transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.01]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <ul className="mt-4 space-y-3">
        {contests.map((contest) => (
          <li key={contest.name} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                <PlatformLogo platform={platformFromLabel(contest.platform)} iconSize={14} className="" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{contest.name}</p>
                <p className="text-xs text-gray-500">{contest.platform}</p>
              </div>
            </div>
            <span className={['rounded-full px-2.5 py-1 text-xs font-medium', badgeClass(contest.time)].join(' ')}>
              {contest.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});

ContestList.displayName = 'ContestList';
