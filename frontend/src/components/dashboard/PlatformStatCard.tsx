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
        'h-full min-h-[120px]',
        'dt-card-base dt-card-interactive',
        'bg-white backdrop-blur-xl',
        'border border-gray-200/50',
        'px-4 py-4',
        'flex flex-col justify-between gap-3 min-w-0 cursor-pointer',
        'relative overflow-hidden group',
        'dt-transition-slow',
        'hover:-translate-y-1',
        accent.glow
      ].join(' ')}
      style={{
        animation: `dtFadeIn 600ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      {/* Top accent gradient line */}
      <div className={[
        'absolute top-0 left-0 right-0 h-1',
        'bg-gradient-to-r',
        accent.bar,
        'opacity-70 group-hover:opacity-100 dt-transition-slow',
      ].join(' ')} />

      <div className="flex items-center justify-between min-w-0 pt-1 gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className={[
            'shrink-0 w-8 h-8 dt-radius-md flex items-center justify-center border transition-all duration-300',
            accent.bg,
            accent.border,
            'group-hover:scale-105 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]',
          ].join(' ')}>
            <img src={logo} alt={name} className="w-4 h-4 object-contain drop-shadow-sm" />
          </div>
          <div className="text-[13px] font-bold text-dt-text whitespace-nowrap truncate min-w-0 group-hover:text-dt-primary transition-colors">
            {name}
          </div>
        </div>
        {!connected && (
          <div className="ml-auto shrink-0">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-dt-textDisabled/20 text-dt-textSecondary uppercase tracking-wider">
              Link
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col justify-end relative z-10 mt-1">
        <div className="text-3xl lg:text-[32px] font-black text-dt-text leading-none tabular-nums whitespace-nowrap tracking-tighter drop-shadow-sm group-hover:scale-[1.02] origin-left dt-transition-slow">
          {problems.toLocaleString()}
        </div>
        <div className="mt-1.5 text-[10px] text-dt-textSecondary/80 whitespace-nowrap font-black tracking-[0.1em] uppercase">{label}</div>
      </div>

      {hasData && (
        <div className="min-w-0 pt-3 border-t border-gray-100 flex items-center justify-between gap-4 relative z-10 mt-1">
          <span className="text-[9px] text-dt-textMuted font-black uppercase tracking-[0.15em]">{ratingLabel}</span>
          <span className={[
            'text-[10px] font-black px-2 py-0.5 rounded border tabular-nums tracking-wide shadow-sm',
            accent.badge,
          ].join(' ')}>
            {rating}
          </span>
        </div>
      )}

      {/* Subtle hover glow background */}
      <div className={[
        'absolute inset-0 opacity-0 group-hover:opacity-[0.03] dt-transition-slow pointer-events-none mix-blend-multiply',
        accent.bg,
      ].join(' ')} />
      <div className={[
        'absolute -inset-20 opacity-0 group-hover:opacity-[0.02] blur-2xl dt-transition-slower pointer-events-none',
        accent.bg.replace('/5', '') // strip opacity for raw color glow
      ].join(' ')} />
    </div>
  );
};