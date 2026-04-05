import React from 'react';
import { Icon } from '../shared/Icon';
import type { DsaStat } from '../../types/dsa';

export type StatCardProps = {
  data: DsaStat;
  className?: string;
};

export const StatCard: React.FC<StatCardProps> = React.memo(({ data, className }) => {
  return (
    <article
      className={[
        'bg-white border border-gray-300 shadow-md rounded-xl p-5 transition-all duration-200',
        'flex items-center gap-4',
        'hover:shadow-lg hover:scale-[1.01]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon name={data.icon} size={18} className="text-gray-700" />
      </div>

      <div className="min-w-0">
        <p className="text-xl font-semibold text-gray-900 leading-none truncate">{data.value}</p>
        <p className="mt-1 text-sm text-gray-500 truncate">{data.label}</p>
      </div>
    </article>
  );
});

StatCard.displayName = 'StatCard';
