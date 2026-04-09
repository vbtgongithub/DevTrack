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
        'rounded-2xl',
        'bg-white',
        'shadow-sm',
        'hover:shadow-lg',
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
      <div className="shrink-0 w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
        {leadingEl}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xl font-bold text-gray-900 leading-none tabular-nums whitespace-nowrap truncate">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="mt-1.5 text-xs text-gray-500 font-medium whitespace-nowrap truncate">{label}</div>
      </div>
    </div>
  );
};
