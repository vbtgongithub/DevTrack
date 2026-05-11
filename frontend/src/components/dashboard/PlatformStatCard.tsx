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
  connected?: boolean;
  delay?: number;
};

const COLOR_ACCENTS: Record<PlatformStatCardColor, { bar: string; badge: string; bg: string; border: string }> = {
  yellow: { bar: 'from-amber-400 to-orange-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-700', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
  blue: { bar: 'from-blue-400 to-indigo-500', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-700', bg: 'bg-blue-500/5', border: 'border-blue-500/10' },
  orange: { bar: 'from-orange-400 to-red-400', badge: 'bg-orange-500/10 border-orange-500/20 text-orange-700', bg: 'bg-orange-500/5', border: 'border-orange-500/10' },
  green: { bar: 'from-emerald-400 to-teal-500', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
};

export const PlatformStatCard: React.FC<PlatformStatCardProps> = ({
  name,
  problems,
  label = 'Problems',
  rating,
  ratingLabel = 'Rating',
  logo,
  color,
  connected = true,
  delay = 0,
}) => {
  const accent = COLOR_ACCENTS[color] || COLOR_ACCENTS.blue;
  const hasData = problems > 0;

  return (
    <div
      className={[
        'h-full min-h-[140px]',
        'dt-card',
        'bg-gradient-to-br from-white to-dt-bg/50 hover:to-white',
        'border-dt-primary/10',
        'p-5 lg:p-6',
        'flex',
        'flex-col',
        'justify-between',
        'gap-4',
        'min-w-0',
        'cursor-pointer',
        'relative overflow-hidden group',
      ].join(' ')}
      style={{
        animation: `dtFadeIn 400ms ease-out ${delay}ms both`,
      }}
    >
      {/* Top accent gradient line */}
      <div className={[
        'absolute top-0 left-0 right-0 h-1.5',
        'bg-gradient-to-r',
        accent.bar,
        'opacity-80 group-hover:opacity-100 transition-opacity',
      ].join(' ')} />

      <div className="flex items-center justify-between min-w-0 pt-1 gap-3">
        <div className="flex items-center gap-3">
          <div className={[
            'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300',
            accent.bg,
            accent.border,
            'group-hover:scale-110',
          ].join(' ')}>
            <img src={logo} alt={name} className="w-5 h-5 object-contain drop-shadow-sm" />
          </div>
          <div className="text-[15px] font-bold text-dt-text whitespace-nowrap truncate min-w-0">
            {name}
          </div>
        </div>
        {!connected && (
          <div className="ml-auto shrink-0">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-dt-textDisabled/20 text-dt-textSecondary">
              Link Account
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-end">
        <div className="text-4xl lg:text-5xl font-extrabold text-dt-text leading-none tabular-nums whitespace-nowrap tracking-tight">
          {problems.toLocaleString()}
        </div>
        <div className="mt-2 text-xs text-dt-textSecondary whitespace-nowrap font-medium tracking-wide uppercase">{label}</div>
      </div>

      {hasData && (
        <div className="min-w-0 pt-4 border-t border-dt-primary/5 flex items-center justify-between gap-4">
          <span className="text-[11px] text-dt-textMuted font-bold uppercase tracking-widest">{ratingLabel}</span>
          <span className={[
            'text-xs font-bold px-2.5 py-1 rounded-md border tabular-nums',
            accent.badge,
          ].join(' ')}>
            {rating}
          </span>
        </div>
      )}

      {/* Subtle hover glow */}
      <div className={[
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
        accent.bg,
      ].join(' ')} />
    </div>
  );
};