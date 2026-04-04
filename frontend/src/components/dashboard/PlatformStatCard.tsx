import React from 'react';

export type PlatformStatCardColor = 'yellow' | 'blue' | 'orange' | 'green';

const COLOR_STYLE: Record<PlatformStatCardColor, { bg: string; border: string }> = {
  yellow: { bg: 'bg-yellow-50/70', border: 'border-yellow-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100' },
  orange: { bg: 'bg-orange-50/60', border: 'border-orange-100' },
  green: { bg: 'bg-green-50', border: 'border-green-100' },
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
        'h-[150px]',
        'h-full',
        'rounded-xl',
        'shadow-sm',
        'hover:shadow-md',
        'hover:-translate-y-[1px]',
        'transition-all',
        'duration-200',
        'border',
        'p-6',
        'flex',
        'flex-col',
        'justify-between',
        'gap-4',
        'min-w-0',
        style.bg,
        style.border,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center gap-2 min-w-0">
        <img src={logo} alt={name} className="h-5 object-contain shrink-0" />
        <div className="text-sm font-medium text-zinc-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-2xl font-semibold text-zinc-900 leading-none tabular-nums whitespace-nowrap">
          {problems}
        </div>
        <div className="mt-1 text-xs text-gray-500 whitespace-nowrap">Problems</div>
      </div>

      <div className="min-w-0 mt-2">
        <div className="flex items-center gap-1 whitespace-nowrap truncate">
          <span className="text-base font-semibold text-zinc-900 leading-none">{rating}</span>
          <span className="text-xs text-gray-500">Rating</span>
        </div>
      </div>
    </div>
  );
};
