import React from 'react';
import type { Topic } from '../../types/dsa';

export type TopicProgressProps = {
  title: string;
  topics: Topic[];
  className?: string;
};

const progressClass = (progress: number) => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const TopicProgress: React.FC<TopicProgressProps> = React.memo(({ title, topics, className }) => {
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

      <ul className="mt-4 space-y-4">
        {topics.map((topic) => (
          <li key={topic.name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{topic.name}</span>
              <span className="text-xs text-gray-500">{topic.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className={['h-full rounded-full transition-all duration-500', progressClass(topic.progress)].join(' ')}
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
