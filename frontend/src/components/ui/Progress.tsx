// frontend/src/components/ui/Progress.tsx — Premium Progress Component
// Phase-G: Calm, smooth progress visualization

import { motion } from 'framer-motion';
import { cn } from '../../lib/design-system/tokens.css';

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'xp' | 'streak';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  animated?: boolean;
  className?: string;
  trackClassName?: string;
}

const variants = {
  default: 'bg-[#7C5CFF]/80',
  success: 'bg-[#12B76A]',
  warning: 'bg-[#F5B546]',
  danger: 'bg-[#F04438]',
  xp: 'bg-gradient-to-r from-amber-500 to-yellow-400',
  streak: 'bg-gradient-to-r from-[#F5B546] to-orange-500',
};

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const labelSizes = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export const Progress = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  sublabel,
  animated = true,
  className,
  trackClassName,
}: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('font-semibold text-[#0F172A]', labelSizes[size])}>
            {label || `${value} / ${max}`}
          </span>
          {sublabel && (
            <span className={cn('font-medium text-[#667085]', labelSizes[size])}>
              {sublabel}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner',
          sizes[size],
          trackClassName
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.5 : 0,
            ease: 'easeOut',
          }}
        >
          {animated && (
            <motion.div
              className="h-full w-full relative overflow-hidden"
              animate={{
                backgroundPosition: ['0% 0%', '100% 0%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showValue?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress = ({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  variant = 'default',
  showValue = true,
  label,
  className,
}: CircularProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'stroke-[#7C5CFF]/80',
    success: 'stroke-[#12B76A]',
    warning: 'stroke-[#F5B546]',
    danger: 'stroke-[#F04438]',
    xp: 'stroke-amber-500',
    streak: 'stroke-orange-500',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-100"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={variantColors[variant]}
          style={{ strokeDasharray: circumference }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-[#0F172A] tracking-tight">
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-[10px] font-medium text-[#667085] mt-0.5 tracking-wide">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

// XP Progress Bar with level visualization
interface XpProgressBarProps {
  currentXp: number;
  level: number;
  xpToNextLevel: number;
  className?: string;
}

export const XpProgressBar = ({
  currentXp,
  level,
  xpToNextLevel,
  className,
}: XpProgressBarProps) => {
  const xpInCurrentLevel = currentXp % xpToNextLevel;
  const _percentage = (xpInCurrentLevel / xpToNextLevel) * 100;
  void _percentage;

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-amber-500">Lv.{level}</span>
        </div>
        <span className="text-xs font-semibold text-[#667085]">
          {xpInCurrentLevel.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
        </span>
      </div>
      <Progress
        value={xpInCurrentLevel}
        max={xpToNextLevel}
        variant="xp"
        size="md"
        animated
      />
    </div>
  );
};

export default Progress;