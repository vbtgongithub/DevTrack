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
        'dt-card-base dt-card-interactive px-4 py-4 flex flex-col justify-between relative overflow-hidden group',
        highlight ? 'bg-gradient-to-br from-dt-primary/5 to-dt-secondary/10 border-dt-primary/20 shadow-sm' : 'bg-gradient-to-br from-white to-dt-bg/50 shadow-sm hover:shadow-md border-gray-200/50',
      ].join(' ')}
      style={{
        animation: `dtFadeIn 400ms ease-out ${delay}ms both`,
      }}
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className={[
          'w-8 h-8 dt-radius-md flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)] transition-transform duration-300 group-hover:scale-105',
          highlight ? 'bg-white text-dt-primary' : 'bg-white border border-dt-primary/10 text-dt-textMuted',
        ].join(' ')}>
          {leadingEl}
        </div>
        <div className="text-[10px] font-black tracking-[0.1em] text-dt-textSecondary/70 uppercase">{label}</div>
      </div>
      <div className="relative z-10">
        <div className={[
          'text-mono-metric text-2xl lg:text-[28px] font-black tracking-tighter leading-none transition-transform duration-500 origin-left group-hover:scale-[1.02]',
          highlight ? 'text-dt-primary drop-shadow-sm' : 'text-dt-text',
        ].join(' ')}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
      {highlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-dt-primary/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none group-hover:bg-dt-primary/20 transition-colors duration-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};