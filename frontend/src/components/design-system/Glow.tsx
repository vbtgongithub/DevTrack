// ============================================================================
// Glow.tsx — Unified Glow Component
// ============================================================================
// Consistent glow effect for gamification feedback and visual hierarchy.
// Supports multiple variants: subtle, medium, intense, legendary
// Uses CSS custom properties for theming and performance optimization
// ============================================================================

import React from 'react';

// cn utility - combine classnames
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export type GlowIntensity = 'subtle' | 'medium' | 'intense' | 'legendary';
export type GlowColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface GlowProps {
  children: React.ReactNode;
  intensity?: GlowIntensity;
  color?: GlowColor;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Color to CSS variable mappings
const COLOR_MAP: Record<GlowColor, { box: string; text: string; gradient: string }> = {
  primary: {
    box: 'var(--glow-primary-box, rgba(59, 130, 246, 0.4))',
    text: 'var(--glow-primary-text, rgba(59, 130, 246, 0.8))',
    gradient: 'var(--glow-primary-gradient, linear-gradient(135deg, #3b82f6, #1e40af))',
  },
  success: {
    box: 'var(--glow-success-box, rgba(16, 185, 129, 0.4))',
    text: 'var(--glow-success-text, rgba(16, 185, 129, 0.8))',
    gradient: 'var(--glow-success-gradient, linear-gradient(135deg, #10b981, #065f46))',
  },
  warning: {
    box: 'var(--glow-warning-box, rgba(245, 158, 11, 0.4))',
    text: 'var(--glow-warning-text, rgba(245, 158, 11, 0.8))',
    gradient: 'var(--glow-warning-gradient, linear-gradient(135deg, #f59e0b, #b45309))',
  },
  danger: {
    box: 'var(--glow-danger-box, rgba(239, 68, 68, 0.4))',
    text: 'var(--glow-danger-text, rgba(239, 68, 68, 0.8))',
    gradient: 'var(--glow-danger-gradient, linear-gradient(135deg, #ef4444, #7f1d1d))',
  },
  info: {
    box: 'var(--glow-info-box, rgba(6, 182, 212, 0.4))',
    text: 'var(--glow-info-text, rgba(6, 182, 212, 0.8))',
    gradient: 'var(--glow-info-gradient, linear-gradient(135deg, #06b6d4, #0e7490))',
  },
  accent: {
    box: 'var(--glow-accent-box, rgba(168, 85, 247, 0.4))',
    text: 'var(--glow-accent-text, rgba(168, 85, 247, 0.8))',
    gradient: 'var(--glow-accent-gradient, linear-gradient(135deg, #a855f7, #6b21a8))',
  },
};

// Intensity to blur/spread mappings
const INTENSITY_MAP: Record<GlowIntensity, { blur: string; spread: string; opacity: number }> = {
  subtle: {
    blur: '8px',
    spread: '2px',
    opacity: 0.4,
  },
  medium: {
    blur: '16px',
    spread: '4px',
    opacity: 0.6,
  },
  intense: {
    blur: '24px',
    spread: '6px',
    opacity: 0.8,
  },
  legendary: {
    blur: '32px',
    spread: '8px',
    opacity: 1,
  },
};

/**
 * Glow Component - Unified visual feedback effect
 * 
 * Usage:
 * <Glow intensity="intense" color="success" animated pulse>
 *   <Button>Click me</Button>
 * </Glow>
 * 
 * Usage with custom styles:
 * <Glow intensity="medium" color="primary" animated>
 *   <div className="custom-element">Content</div>
 * </Glow>
 */
export const Glow: React.FC<GlowProps> = ({
  children,
  intensity = 'medium',
  color = 'primary',
  animated = false,
  pulse = false,
  className,
  style,
}) => {
  const colorConfig = COLOR_MAP[color];
  const intensityConfig = INTENSITY_MAP[intensity];

  const boxShadow = `0 0 ${intensityConfig.blur} ${intensityConfig.spread} ${colorConfig.box}`;

  return (
    <div
      className={cn(
        'relative transition-all duration-300 overflow-visible',
        animated && 'will-change-filter',
        pulse && 'animate-pulse-glow',
        className
      )}
      style={{
        boxShadow,
        ...style,
      }}
    >
      {children}

      {/* Animated gradient background (optional) */}
      {animated && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
          style={{
            background: colorConfig.gradient,
            borderRadius: 'inherit',
          }}
        />
      )}
    </div>
  );
};

/**
 * GlowRing - Circular glow indicator (e.g., for at-risk streaks)
 */
export const GlowRing: React.FC<
  Omit<GlowProps, 'children'> & {
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ intensity = 'medium', color = 'danger', size = 'md', className, style }) => {
  const colorConfig = COLOR_MAP[color];
  const intensityConfig = INTENSITY_MAP[intensity];

  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const boxShadow = `0 0 ${intensityConfig.blur} ${intensityConfig.spread} ${colorConfig.box}, inset 0 0 ${intensityConfig.blur} 0 ${colorConfig.box}`;

  return (
    <div
      className={cn('rounded-full border-2 border-current', sizeMap[size], className)}
      style={{
        borderColor: colorConfig.box,
        boxShadow,
        ...style,
      }}
    />
  );
};

/**
 * GlowText - Glowing text effect
 */
export const GlowText: React.FC<
  Omit<GlowProps, 'children'> & {
    children: string;
  }
> = ({ children, intensity = 'subtle', color = 'primary', className, style }) => {
  const colorConfig = COLOR_MAP[color];
  const intensityConfig = INTENSITY_MAP[intensity];

  const textShadow = `0 0 ${intensityConfig.blur} ${colorConfig.text}, 0 0 ${parseInt(intensityConfig.blur) * 2}px ${colorConfig.box}`;

  return (
    <span
      className={cn('inline-block transition-all duration-300', className)}
      style={{
        textShadow,
        color: colorConfig.text,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * GlowBadge - Small badge with glow
 */
export const GlowBadge: React.FC<
  Omit<GlowProps, 'children'> & {
    label: string;
    icon?: React.ReactNode;
  }
> = ({ label, icon, intensity = 'subtle', color = 'primary', className, style }) => {
  const colorConfig = COLOR_MAP[color];
  const intensityConfig = INTENSITY_MAP[intensity];

  const boxShadow = `0 0 ${intensityConfig.blur} ${intensityConfig.spread} ${colorConfig.box}`;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap',
        className
      )}
      style={{
        backgroundColor: `${colorConfig.box}`,
        color: colorConfig.text,
        boxShadow,
        ...style,
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </div>
  );
};

export default Glow;
