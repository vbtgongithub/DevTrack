import React from 'react';
import type { Topic } from '../../types/dsa';

export type TopicProgressProps = {
  title: string;
  topics: Topic[];
  className?: string;
};

const RANK_LABELS: Record<string, string> = {
  'Arrays': 'Top 15%',
  'Dynamic Programming': 'Top 30%',
  'Trees': 'Top 25%',
  'Graphs': 'Top 60%',
  'Strings': 'Top 25%',
  'Binary Search': 'Top 10%',
  'Linked Lists': 'Top 20%',
  'Stacks': 'Top 20%',
  'Sorting': 'Top 15%',
};

export const TopicProgress: React.FC<TopicProgressProps> = React.memo(({ title, topics, className }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const weakest = React.useMemo(() => {
    return topics.reduce<Topic | null>((w, t) => (!w || t.progress < w.progress ? t : w), null);
  }, [topics]);

  const totalSolved = React.useMemo(() => topics.reduce((sum, t) => sum + Math.round(t.progress * 2.5), 0), [topics]);

  return (
    <section
      className={[
        'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{totalSolved} problems across {topics.length} topics</p>
        </div>
      </div>

      <ul className="space-y-5">
        {topics.map((topic, index) => {
          const barColor =
            topic.progress >= 80 ? 'from-emerald-500 to-emerald-400'
            : topic.progress >= 60 ? 'from-blue-500 to-indigo-500'
            : topic.progress >= 40 ? 'from-amber-500 to-orange-500'
            : 'from-red-500 to-red-400';
          const barBg =
            topic.progress >= 80 ? 'bg-emerald-100'
            : topic.progress >= 60 ? 'bg-blue-100'
            : topic.progress >= 40 ? 'bg-amber-100'
            : 'bg-red-100';
          const rank = RANK_LABELS[topic.name] || 'Top 40%';

          return (
            <li key={topic.name} style={{ animation: `dtFadeIn 520ms ease-out ${index * 60}ms both` }}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {topic.progress}% mastery • {rank}
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums">{topic.progress}%</span>
              </div>
              <div className={['h-2.5 w-full rounded-full overflow-hidden', barBg].join(' ')}>
                <div
                  className={['h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', barColor].join(' ')}
                  style={{ width: mounted ? `${topic.progress}%` : '0%', transitionDelay: `${index * 60}ms` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {/* Focus Area Block */}
      {weakest && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60">
          <div className="flex items-start gap-3">
            <span className="text-lg shrink-0">🎯</span>
            <div>
              <div className="text-sm font-semibold text-gray-900">Focus Area: {weakest.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">Solve 3 problems this week to improve your mastery from {weakest.progress}%</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

TopicProgress.displayName = 'TopicProgress';
