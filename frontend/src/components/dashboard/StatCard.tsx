import React from 'react';

export type StatCardProps = {
  label: string;
  value: string | number;
  leading: React.ReactNode;
  highlight?: boolean;
  delay?: number;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, leading, highlight, delay = 0 }) => {
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
        'h-[110px] lg:h-[120px]',
        'dt-card flex flex-col justify-between p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-[2px]',
        highlight
          ? 'bg-gradient-to-br from-dt-primary/5 to-dt-secondary/10 border-2 border-dt-primary/20 hover:border-dt-primary/45 shadow-[0_4px_20px_rgba(124,92,252,0.06)]'
          : 'bg-gradient-to-br from-white to-dt-bg/50 border border-gray-300 hover:border-dt-primary/30',
      ].join(' ')}
      style={{
        animation: `dtFadeIn 400ms ease-out ${delay}ms both`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className={[
          'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
          highlight ? 'bg-white text-dt-primary' : 'bg-white border border-dt-primary/10 text-dt-textMuted',
        ].join(' ')}>
          {leadingEl}
        </div>
        <div className="text-label !text-[10px]">{label}</div>
      </div>
      <div className="mt-2">
        <div className={[
          'text-mono-metric text-3xl font-bold tracking-tightest leading-none',
          highlight ? 'text-dt-primary' : 'text-dt-text',
        ].join(' ')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
      {highlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-dt-primary/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
      )}
    </div>
  );
};