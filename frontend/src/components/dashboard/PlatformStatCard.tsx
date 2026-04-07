import React from 'react';

export type PlatformStatCardColor = 'yellow' | 'blue' | 'orange' | 'green';

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
}) => {
  return (
    <div
      className={[
        'h-full',
        'rounded-xl',
        'bg-white',
        'shadow-md',
        'hover:shadow-xl',
        'hover:scale-[1.02]',
        'hover:-translate-y-0.5',
        'transition-all',
        'duration-200',
        'ease-in-out',
        'border',
        'border-gray-200',
        'p-5',
        'flex',
        'flex-col',
        'justify-between',
        'gap-3',
        'min-w-0',
        'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
          <img src={logo} alt={name} className="w-6 h-6 object-contain" />
        </div>
        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap truncate min-w-0">
          {name}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-3xl font-bold text-gray-900 leading-none tabular-nums whitespace-nowrap">
          {problems}
        </div>
        <div className="mt-1 text-xs text-gray-500 whitespace-nowrap">Problems Solved</div>
      </div>

      <div className="min-w-0 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
        <span className="text-xs text-gray-400 font-medium">Rating</span>
        <span className="text-sm font-bold text-gray-900 tracking-tight whitespace-nowrap tabular-nums">
          {rating}
        </span>
      </div>
    </div>
  );
};
