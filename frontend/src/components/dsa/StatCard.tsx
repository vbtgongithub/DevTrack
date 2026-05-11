import React from 'react';
import { Icon } from '../shared/Icon';
import type { DsaStat } from '../../types/dsa';

export type StatCardProps = {
  data: DsaStat;
  className?: string;
};

const trendFor = (label: string): { direction: 'up' | 'down'; value: string; hint: string } => {
  const key = label.toLowerCase();
  if (key.includes('problems')) return { direction: 'up', value: '+5%', hint: 'weekly' };
  if (key.includes('rating')) return { direction: 'up', value: '+12', hint: 'last contest' };
  if (key.includes('current streak')) return { direction: 'up', value: '87%', hint: 'consistency' };
  if (key.includes('max streak')) return { direction: 'up', value: 'best', hint: 'personal' };
  return { direction: 'up', value: '—', hint: 'trend' };
};

export const StatCard: React.FC<StatCardProps> = React.memo(({ data, className }) => {
  const trend = trendFor(data.label);
  return (
    <article
      className={[
        'dt-card bg-gradient-to-br from-white to-dt-bg/50 border border-dt-primary/10 p-5',
        'flex items-center gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="h-10 w-10 rounded-md bg-white flex items-center justify-center">
        <Icon name={data.icon || 'chart-bar'} size={16} className="text-dt-text" />
      </div>

      <div className="min-w-0">
        <p className="text-[22px] font-bold tracking-tight text-dt-text leading-none truncate">{data.value}</p>
        <p className="mt-1 text-[13px] text-dt-muted truncate">{data.label}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-dt-muted whitespace-nowrap">
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value} {trend.hint}
        </span>
      </div>
    </article>
  );
});

StatCard.displayName = 'StatCard';
