import React from 'react';
import { Icon } from '../shared/Icon';
import { PlatformLogo } from './PlatformLogo';
import type { Platform, Submission, Topic } from '../../types/dsa';

export type InsightsCardProps = {
  title: string;
  submissions: Submission[];
  topics: Topic[];
  className?: string;
};

const platformLabel: Record<Platform, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  hackerrank: 'HackerRank',
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const parseSubmissionDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const InsightsCard: React.FC<InsightsCardProps> = React.memo(
  ({ title, submissions, topics, className }) => {
    const total = submissions.length;
    const accepted = submissions.filter((s) => s.status === 'accepted').length;
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    const platformCounts = submissions.reduce<Record<Platform, number>>(
      (acc, s) => {
        acc[s.platform] = (acc[s.platform] ?? 0) + 1;
        return acc;
      },
      { leetcode: 0, codeforces: 0, codechef: 0, hackerrank: 0 }
    );

    const mostActivePlatform = (Object.keys(platformCounts) as Platform[]).reduce((best, p) =>
      platformCounts[p] > platformCounts[best] ? p : best
    , 'leetcode');

    const topTopic = topics.reduce<Topic | null>((best, t) => {
      if (!best) return t;
      return t.progress > best.progress ? t : best;
    }, null);

    const trendData = React.useMemo(() => {
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

      const parsed = submissions
        .map((s) => parseSubmissionDate(s.date))
        .filter((d): d is Date => Boolean(d));

      return days.map((day) => {
        const count = parsed.filter((d) => isSameDay(d, day)).length;
        return { day: fmt.format(day), count };
      });
    }, [submissions]);

    const max = Math.max(1, ...trendData.map((d) => d.count));

    return (
      <section
        className={[
          'border border-gray-300 shadow-md rounded-xl p-5 transition-all duration-200',
          'bg-white hover:shadow-lg hover:scale-[1.01]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon name="check-circle" size={14} className="text-gray-700" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Acceptance rate</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{acceptanceRate}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {accepted}/{total} accepted
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                  <PlatformLogo platform={mostActivePlatform} iconSize={14} className="" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Most active</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{platformLabel[mostActivePlatform]}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">{platformCounts[mostActivePlatform]} submissions</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon name="trophy" size={14} className="text-gray-700" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Top topic</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{topTopic?.name ?? '—'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">{topTopic?.progress ?? 0}%</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Last 7 days</p>
            <div className="mt-3 flex items-end gap-2 h-24">
              {trendData.map((d) => {
                const h = Math.round((d.count / max) * 80);
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div
                      className="w-6 bg-green-500 rounded transition-all duration-500 hover:scale-110 origin-bottom"
                      style={{ height: `${Math.max(4, h)}px` }}
                      title={`${d.count} submissions`}
                    />
                    <span className="text-xs text-gray-500">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }
);

InsightsCard.displayName = 'InsightsCard';
