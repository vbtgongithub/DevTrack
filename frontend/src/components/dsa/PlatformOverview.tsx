import React from 'react';
import type { Platform, PlatformOverviewItem } from '../../types/dsa';
import { PlatformLogo } from './PlatformLogo';

export type PlatformOverviewProps = {
  title: string;
  items: PlatformOverviewItem[];
  className?: string;
};

const label: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  hackerrank: 'HackerRank',
};

export const PlatformOverview: React.FC<PlatformOverviewProps> = React.memo(({ title, items, className }) => {
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

      <div className="mt-4 grid grid-cols-1 gap-3">
        {items.map((item) => (
          <article
            key={item.platform}
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-all duration-200 hover:bg-white hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                  <PlatformLogo platform={item.platform} iconSize={14} className="" />
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{label[item.platform]}</p>
              </div>
              <p className="text-xs text-gray-600 whitespace-nowrap">{item.stat}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

PlatformOverview.displayName = 'PlatformOverview';
