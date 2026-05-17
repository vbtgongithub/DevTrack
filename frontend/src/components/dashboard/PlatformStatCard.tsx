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

const COLOR_ACCENTS: Record<PlatformStatCardColor, { bar: string; badge: string; bg: string; border: string; glow: string }> = {
  yellow: { bar: 'from-[#FBBF24] via-[#F59E0B] to-[#D97706]', badge: 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#D97706]', bg: 'bg-[#F59E0B]/5', border: 'border-[#F59E0B]/10', glow: 'group-hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]' },
  blue: { bar: 'from-[#60A5FA] via-[#3B82F6] to-[#2563EB]', badge: 'bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#2563EB]', bg: 'bg-[#3B82F6]/5', border: 'border-[#3B82F6]/10', glow: 'group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]' },
  orange: { bar: 'from-[#F87171] via-[#EF4444] to-[#DC2626]', badge: 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#DC2626]', bg: 'bg-[#EF4444]/5', border: 'border-[#EF4444]/10', glow: 'group-hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)]' },
  green: { bar: 'from-[#34D399] via-[#10B981] to-[#059669]', badge: 'bg-[#10B981]/10 border-[#10B981]/20 text-[#059669]', bg: 'bg-[#10B981]/5', border: 'border-[#10B981]/10', glow: 'group-hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]' },
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
        'bg-white backdrop-blur-xl',
        'border border-gray-300 hover:border-dt-primary/35',
        'p-5 lg:p-6',
        'flex flex-col justify-between gap-4 min-w-0 cursor-pointer',
        'relative overflow-hidden group',
        'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:-translate-y-1 hover:shadow-lg',
        accent.glow
      ].join(' ')}
      style={{
        animation: `dtFadeIn 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      {/* Top accent gradient line */}
      <div className={[
        'absolute top-0 left-0 right-0 h-1.5',
        'bg-gradient-to-r',
        accent.bar,
        'opacity-70 group-hover:opacity-100 transition-opacity duration-500',
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

      <div className="min-w-0 flex-1 flex flex-col justify-end relative z-10">
        <div className="text-4xl lg:text-5xl font-black text-dt-text leading-none tabular-nums whitespace-nowrap tracking-tighter drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform duration-500">
          {problems.toLocaleString()}
        </div>
        <div className="mt-2 text-[11px] text-dt-textSecondary/70 whitespace-nowrap font-black tracking-[0.15em] uppercase">{label}</div>
      </div>

      {hasData && (
        <div className="min-w-0 pt-4 border-t border-gray-200 flex items-center justify-between gap-4 relative z-10">
          <span className="text-[10px] text-dt-textMuted font-black uppercase tracking-[0.2em]">{ratingLabel}</span>
          <span className={[
            'text-[11px] font-black px-2.5 py-1 rounded-md border tabular-nums tracking-wide',
            accent.badge,
          ].join(' ')}>
            {rating}
          </span>
        </div>
      )}

      {/* Subtle hover glow background */}
      <div className={[
        'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none mix-blend-multiply',
        accent.bg,
      ].join(' ')} />
      <div className={[
        'absolute -inset-20 opacity-0 group-hover:opacity-[0.03] blur-3xl transition-opacity duration-1000 pointer-events-none',
        accent.bg.replace('/5', '') // strip opacity for raw color glow
      ].join(' ')} />
    </div>
  );
};