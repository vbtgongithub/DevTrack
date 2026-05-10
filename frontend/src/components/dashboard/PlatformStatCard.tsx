import React from 'react';

export type PlatformStatCardColor = 'yellow' | 'blue' | 'orange' | 'green';

export type PlatformStatCardProps = {
  name: string;
  problems: number;
  label?: string;
  rating: string | number;
  ratingLabel?: string;
  logo: string;
  color: PlatformStatCardColor;
};

const COLOR_ACCENTS: Record<PlatformStatCardColor, { bar: string; badge: string }> = {
  yellow: { bar: 'bg-yellow-400', badge: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  blue: { bar: 'bg-blue-500', badge: 'bg-blue-50 border-blue-200 text-blue-700' },
  orange: { bar: 'bg-orange-500', badge: 'bg-orange-50 border-orange-200 text-orange-700' },
  green: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
};

export const PlatformStatCard: React.FC<PlatformStatCardProps> = ({
  name,
  problems,
  label = 'Problems Solved',
  rating,
  ratingLabel = 'Rating',
  logo,
  color,
}) => {
  const accent = COLOR_ACCENTS[color] || COLOR_ACCENTS.blue;

  return (
    <div
      className={[
        'h-full',
        'rounded-2xl',
        'bg-white',
        'shadow-sm',
        'hover:shadow-lg',
        'hover:-translate-y-0.5',
        'transition-all',
        'duration-200',
        'ease-out',
        'border',
        'border-gray-200',
        'p-5',
        'flex',
        'flex-col',
        'justify-between',
        'gap-3',
        'min-w-0',
        'cursor-pointer',
        'relative overflow-hidden',
      ].join(' ')}
    >
      {/* Top accent line */}
      <div className={['absolute top-0 left-0 right-0 h-0.5', accent.bar].join(' ')} />

      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          <img src={logo} alt={name} className="w-6 h-6 object-contain" />
        </div>
        <div className="text-sm font-bold text-gray-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-3xl font-bold text-gray-900 leading-none tabular-nums whitespace-nowrap">
          {problems.toLocaleString()}
        </div>
        <div className="mt-1 text-xs text-gray-500 whitespace-nowrap">{label}</div>
      </div>

      <div className="min-w-0 pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400 font-medium">{ratingLabel}</span>
        <span className={[
          'text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums',
          accent.badge,
        ].join(' ')}>
          {rating}
        </span>
      </div>
    </div>
  );
};
