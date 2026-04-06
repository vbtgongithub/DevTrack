import React from 'react';
import type { Platform, PlatformOverviewItem, Submission } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';

export type PlatformOverviewProps = {
  title: string;
  items: PlatformOverviewItem[];
  submissions?: Submission[];
  className?: string;
};

const label: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  hackerrank: 'HackerRank',
};

export const PlatformOverview: React.FC<PlatformOverviewProps> = React.memo(({ title, items, submissions, className }) => {
  const platformCounts = React.useMemo(() => {
    const base: Record<Platform, number> = { leetcode: 0, codeforces: 0, codechef: 0, hackerrank: 0 };
    if (!submissions) return base;
    return submissions.reduce<Record<Platform, number>>((acc, s) => {
      acc[s.platform] = (acc[s.platform] ?? 0) + 1;
      return acc;
    }, base);
  }, [submissions]);

  return (
    <section
      className={[
        'dt-card p-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div
            key={item.platform}
            className="px-3 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors duration-150"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2">
                <PlatformLogo platform={item.platform} iconSize={14} className="" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-dt-text truncate">{label[item.platform]}</div>
                  <div className="text-xs text-dt-muted">{platformCounts[item.platform] ?? 0} submissions</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-dt-text whitespace-nowrap">{item.stat}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

PlatformOverview.displayName = 'PlatformOverview';
