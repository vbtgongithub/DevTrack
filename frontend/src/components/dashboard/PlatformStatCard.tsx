import React from 'react';

export type PlatformStatCardColor = 'yellow' | 'blue' | 'orange' | 'green';

const COLOR_STYLE: Record<PlatformStatCardColor, { bg: string }> = {
  yellow: { bg: 'bg-yellow-50' },
  blue: { bg: 'bg-blue-50' },
  orange: { bg: 'bg-white' },
  green: { bg: 'bg-green-50' },
};

export type PlatformStatCardProps = {
  name: string;
  problems: number;
  rating: string | number;
  logo: string;
  color: PlatformStatCardColor;
};

export const PlatformStatCard: React.FC<PlatformStatCardProps> = ({
  name,
  problems,
  rating,
  logo,
  color,
}) => {
  const style = COLOR_STYLE[color];

  return (
    <div
      className={[
        'h-full',
        'rounded-xl',
        'shadow-md',
        'hover:shadow-lg',
        'hover:scale-[1.01]',
        'transition-all',
        'duration-200',
        'ease-in-out',
        'border',
        'border-gray-400',
        'p-5',
        'flex',
        'flex-col',
        'justify-between',
        'gap-4',
        'min-w-0',
        style.bg,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center gap-2 min-w-0">
        <img src={logo} alt={name} className="h-5 object-contain shrink-0" />
        <div className="text-sm font-medium text-zinc-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-3xl font-bold text-gray-900 leading-none tabular-nums whitespace-nowrap">
          {problems}
        </div>
        <div className="mt-1 text-sm text-gray-600 whitespace-nowrap">Problems</div>
      </div>

      <div className="min-w-0 mt-4 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-500">Rating</span>
        <span className="text-base font-semibold text-gray-900 tracking-tight whitespace-nowrap">
          {rating}
        </span>
      </div>
    </div>
  );
};
