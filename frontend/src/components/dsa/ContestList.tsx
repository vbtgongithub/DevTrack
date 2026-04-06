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
  if (lower.includes('2 hrs') || lower.includes('urgent')) return 'bg-[#FEF2F2] text-[#991B1B]';
  if (lower.includes('tomorrow') || lower.includes('soon')) return 'bg-[#FFFBEB] text-[#92400E]';
  return 'bg-[#F3F4F6] text-dt-muted';
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
        'dt-card p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>

      <ul className="mt-4 space-y-3">
        {contests.map((contest) => (
          <li key={contest.name} className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-white px-3 py-2.5 dt-pop hover:bg-[#F3F4F6]">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-9 h-9 bg-white border border-black/5 rounded-md flex items-center justify-center shrink-0">
                <PlatformLogo platform={platformFromLabel(contest.platform)} iconSize={14} className="" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-dt-text truncate">{contest.name}</p>
                <p className="text-xs text-dt-muted">{contest.platform}</p>
              </div>
            </div>
            <span className={['rounded-md px-2 py-1 text-xs font-medium', badgeClass(contest.time)].join(' ')}>
              {contest.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});

ContestList.displayName = 'ContestList';
