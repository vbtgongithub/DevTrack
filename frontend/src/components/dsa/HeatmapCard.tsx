import React from 'react';

export type HeatmapCardProps = {
  title: string;
  cells: number[];
  className?: string;
};

const heatClass = (level: number) => {
  if (level >= 3) return 'bg-green-600';
  if (level === 2) return 'bg-green-500';
  if (level === 1) return 'bg-green-400';
  return 'bg-gray-700';
};

export const HeatmapCard: React.FC<HeatmapCardProps> = React.memo(({ title, cells, className }) => {
  const weeks = React.useMemo(
    () => Array.from({ length: Math.ceil(cells.length / 7) }, (_, i) => cells.slice(i * 7, i * 7 + 7)),
    [cells]
  );

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

      <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <div className="inline-flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-[3px]">
              {week.map((level, dayIndex) => (
                <div
                  key={`cell-${weekIndex}-${dayIndex}`}
                  title={`${level} submissions`}
                  className={[
                    'relative w-3 h-3 rounded-sm border border-gray-600',
                    heatClass(level),
                    'transition-all duration-200',
                    'hover:scale-125 hover:z-10',
                  ].join(' ')}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center gap-2 mt-3 text-xs text-gray-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm border border-gray-600 bg-gray-700" />
          <div className="w-3 h-3 rounded-sm border border-gray-600 bg-green-400" />
          <div className="w-3 h-3 rounded-sm border border-gray-600 bg-green-500" />
          <div className="w-3 h-3 rounded-sm border border-gray-600 bg-green-600" />
          <span>More</span>
        </div>
      </div>
    </section>
  );
});

HeatmapCard.displayName = 'HeatmapCard';
