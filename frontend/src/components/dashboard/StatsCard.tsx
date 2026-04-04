import React from 'react';
import { Icon } from '../shared/Icon';

type Accent = 'blue' | 'purple' | 'green' | 'amber';

const ACCENT: Record<Accent, { iconWrap: string; icon: string }> = {
  blue: { iconWrap: 'bg-blue-100', icon: 'text-blue-600' },
  purple: { iconWrap: 'bg-purple-100', icon: 'text-purple-600' },
  green: { iconWrap: 'bg-green-100', icon: 'text-green-600' },
  amber: { iconWrap: 'bg-amber-100', icon: 'text-amber-600' },
};

export type StatsCardProps = {
  label: string;
  iconName: string;
  value: string;
  meta: string;
  metaTone?: 'positive' | 'neutral';
  accent: Accent;
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  iconName,
  value,
  meta,
  metaTone = 'positive',
  accent,
}) => {
  const a = ACCENT[accent];

  return (
    <div className="bg-white border border-gray-300 shadow-md rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700">{label}</div>
        <div className="text-zinc-400">→</div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl ${a.iconWrap} flex items-center justify-center`}>
          <Icon name={iconName} size={18} className={a.icon} />
        </div>

        <div className="min-w-0">
          <div className="text-2xl font-semibold text-zinc-900 leading-none">{value}</div>
          <div
            className={
              metaTone === 'positive'
                ? 'mt-1 text-sm font-medium text-green-600'
                : 'mt-1 text-sm text-zinc-500'
            }
          >
            {meta}
          </div>
        </div>
      </div>
    </div>
  );
};
