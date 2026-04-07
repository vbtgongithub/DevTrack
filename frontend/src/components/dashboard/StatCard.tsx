import React from 'react';

export type StatCardProps = {
  label: string;
  value: string | number;
  leading: React.ReactNode;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, leading }) => {
  const leadingEl = React.isValidElement(leading)
    ? React.cloneElement(
        leading as React.ReactElement<{ className?: string }>,
        {
          className: [
            (leading as React.ReactElement<{ className?: string }>).props.className,
            'w-5 h-5',
            'object-contain',
          ]
            .filter(Boolean)
            .join(' '),
        },
      )
    : leading;

  return (
    <div
      className={[
        'h-[120px]',
        'rounded-xl',
        'bg-white',
        'shadow-md',
        'hover:shadow-xl',
        'hover:scale-[1.01]',
        'hover:-translate-y-0.5',
        'transition-all',
        'duration-200',
        'ease-in-out',
        'border',
        'border-gray-200',
        'p-5',
        'flex',
        'items-center',
        'gap-4',
        'min-w-0',
        'cursor-default',
      ].join(' ')}
    >
      <div className="shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        {leadingEl}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xl font-semibold text-gray-900 leading-none tabular-nums whitespace-nowrap truncate">
          {value}
        </div>
        <div className="mt-1 text-sm text-gray-500 whitespace-nowrap truncate">{label}</div>
      </div>
    </div>
  );
};
