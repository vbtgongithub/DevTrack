// ============================================================================
// Glow.tsx — Unified Glow Wrapper Component
// ============================================================================
// Wraps children with consistent glow effects based on intensity and color.
// Supports XP, streak, level, and custom colors.
// ============================================================================

import React from 'react';

type GlowIntensity = 'subtle' | 'medium' | 'intense' | 'legendary';
type GlowColor = 'xp' | 'streak' | 'level' | 'success' | 'danger' | string;

interface GlowProps {
  intensity?: GlowIntensity;
  color?: GlowColor;
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const INTENSITY_MAP: Record<GlowIntensity, string> = {
  subtle: '0 0 20px',
  medium: '0 0 40px',
  intense: '0 0 60px',
  legendary: '0 0 80px',
};

const OPACITY_MAP: Record<GlowIntensity, number> = {
  subtle: 0.2,
  medium: 0.3,
  intense: 0.4,
  legendary: 0.5,
};

const COLOR_MAP: Record<string, string> = {
  xp: '245, 158, 11',      // #F59E0B
  streak: '249, 115, 22',  // #F97316
  level: '124, 92, 252',   // #7C5CFC
  success: '34, 197, 94',  // #22C55E
  danger: '239, 68, 68',   // #EF4444
};

export const Glow: React.FC<GlowProps> = ({
  intensity = 'medium',
  color = 'xp',
  children,
  className = '',
  animate = false,
}) => {
  // Get color RGB values
  const colorRgb = COLOR_MAP[color] || color;
  
  // Build box-shadow value
  const glowSize = INTENSITY_MAP[intensity];
  const glowOpacity = OPACITY_MAP[intensity];
  const boxShadow = `${glowSize} rgba(${colorRgb}, ${glowOpacity})`;

  return (
    <div
      className={[
        'relative',
        animate && 'animate-pulse',
        className,
      ].join(' ')}
      style={{
        boxShadow,
        transition: 'box-shadow 300ms ease-out',
      }}
    >
      {children}
    </div>
  );
};

export default Glow;
