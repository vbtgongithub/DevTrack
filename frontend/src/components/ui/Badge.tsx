// frontend/src/components/ui/Badge.tsx — Premium Badge Component
// Phase-G: Calm, rarity-aware badge system

import { cn } from '../../lib/design-system/tokens.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'streak' | 'xp' | 'rarity';
type BadgeSize = 'sm' | 'md' | 'lg';

type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const variants = {
  default: 'bg-zinc-100 text-[#667085] border-zinc-200',
  success: 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/20',
  warning: 'bg-[#F5B546]/10 text-[#F5B546] border-[#F5B546]/20',
  error: 'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/20',
  info: 'bg-[#7C5CFF]/10 text-[#7C5CFF] border-[#7C5CFF]/20',
  streak: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  xp: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  rarity: '',
};

const rarityColors: Record<RarityType, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-zinc-100', text: 'text-[#667085]', border: 'border-zinc-200' },
  rare: { bg: 'bg-[#7C5CFF]/10', text: 'text-[#7C5CFF]', border: 'border-[#7C5CFF]/20' },
  epic: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20' },
  legendary: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export const Badge = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  dot = false,
  pulse = false,
}: BadgeProps) => {
  const isRarity = variant === 'rarity';
  const rarityStyle = isRarity ? rarityColors[(children as string)?.toLowerCase() as RarityType] || rarityColors.common : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full border tracking-wide uppercase',
        isRarity ? `${rarityStyle?.bg} ${rarityStyle?.text} ${rarityStyle?.border}` : variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          pulse && 'animate-pulse shadow-sm',
          variant === 'streak' ? 'bg-orange-500' :
          variant === 'xp' ? 'bg-amber-500' :
          variant === 'success' ? 'bg-[#12B76A]' :
          variant === 'warning' ? 'bg-[#F5B546]' :
          variant === 'error' ? 'bg-[#F04438]' :
          'bg-zinc-400'
        )} />
      )}
      {children}
    </span>
  );
};

// Streak Badge specific component
interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export const StreakBadge = ({ streak, className }: StreakBadgeProps) => {
  const isHot = streak >= 7;
  const isOnFire = streak >= 14;
  const isInferno = streak >= 30;

  return (
    <Badge
      variant="streak"
      size="md"
      dot={streak > 0}
      pulse={isHot}
      className={cn(
        isOnFire && 'shadow-sm',
        isInferno && 'shadow-md ring-1 ring-orange-500/20',
        className
      )}
    >
      {streak} day{streak !== 1 ? 's' : ''}
    </Badge>
  );
};

// XP Badge specific component
interface XpBadgeProps {
  xp: number;
  className?: string;
}

export const XpBadge = ({ xp, className }: XpBadgeProps) => {
  const formattedXp = xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp.toString();

  return (
    <Badge variant="xp" size="md" dot className={className}>
      {formattedXp} XP
    </Badge>
  );
};

// Level Badge
interface LevelBadgeProps {
  level: number;
  className?: string;
}

export const LevelBadge = ({ level, className }: LevelBadgeProps) => {
  return (
    <Badge variant="info" size="sm" className={cn('font-mono', className)}>
      Lv.{level}
    </Badge>
  );
};

export default Badge;