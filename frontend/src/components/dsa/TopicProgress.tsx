import React from 'react';
import type { Topic } from '../../types/dsa';

export type TopicProgressProps = {
  title: string;
  topics: Topic[];
  className?: string;
};

export const TopicProgress: React.FC<TopicProgressProps> = React.memo(({ title, topics, className }) => {
  const strongest = React.useMemo(() => {
    return topics.reduce<Topic | null>((best, t) => (!best || t.progress > best.progress ? t : best), null);
  }, [topics]);

  const weakest = React.useMemo(() => {
    return topics.reduce<Topic | null>((best, t) => (!best || t.progress < best.progress ? t : best), null);
  }, [topics]);

  return (
    <section
      className={[
        'dt-card p-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight text-dt-text">{title}</h3>
        <div className="text-right">
          <div className="text-xs text-dt-muted">Insight</div>
          <div className="text-sm font-medium text-dt-text">
            {strongest ? `Strongest: ${strongest.name}` : '—'}
          </div>
          <div className="text-xs text-dt-muted">
            {weakest ? `${weakest.name} needs improvement` : ''}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-4">
        {topics.map((topic) => (
          <li key={topic.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-dt-text">{topic.name}</span>
              <span className="text-xs text-dt-muted">{topic.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-sm bg-[#E5E7EB] overflow-hidden">
              <div
                className={[
                  'h-full rounded-sm transition-all duration-700',
                  'bg-[#6B7280]',
                ].join(' ')}
                style={{ width: `${topic.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
});

TopicProgress.displayName = 'TopicProgress';
