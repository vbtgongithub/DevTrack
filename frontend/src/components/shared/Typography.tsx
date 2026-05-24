// ============================================================================
// Typography.tsx — Unified Typography Component
// ============================================================================
// Consistent typography variants across the application.
// Variants: hero, display, title, body, label, caption
// ============================================================================

import React from 'react';

type TypographyVariant = 'hero' | 'display' | 'title' | 'body' | 'label' | 'caption';
type TypographyWeight = 'black' | 'bold' | 'semibold' | 'medium' | 'normal';
type TypographyColor = 'primary' | 'secondary' | 'muted' | 'success' | 'danger' | 'warning';

interface TypographyProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

const VARIANT_STYLES: Record<TypographyVariant, string> = {
  hero: 'text-6xl md:text-7xl leading-none tracking-tighter',
  display: 'text-4xl md:text-5xl leading-tight tracking-tight',
  title: 'text-xl md:text-2xl leading-tight tracking-tight',
  body: 'text-base leading-normal',
  label: 'text-xs leading-tight tracking-wide uppercase',
  caption: 'text-[10px] leading-tight tracking-wider uppercase',
};

const WEIGHT_STYLES: Record<TypographyWeight, string> = {
  black: 'font-black',
  bold: 'font-bold',
  semibold: 'font-semibold',
  medium: 'font-medium',
  normal: 'font-normal',
};

const COLOR_STYLES: Record<TypographyColor, string> = {
  primary: 'text-dt-text',
  secondary: 'text-dt-textSecondary',
  muted: 'text-dt-textMuted',
  success: 'text-dt-success',
  danger: 'text-dt-error',
  warning: 'text-amber-600',
};

const DEFAULT_ELEMENTS: Record<TypographyVariant, React.ElementType> = {
  hero: 'h1',
  display: 'h2',
  title: 'h3',
  body: 'p',
  label: 'span',
  caption: 'span',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  className = '',
  children,
  as,
}) => {
  const Component = as || DEFAULT_ELEMENTS[variant];

  const classes = [
    VARIANT_STYLES[variant],
    WEIGHT_STYLES[weight],
    COLOR_STYLES[color],
    className,
  ].join(' ');

  return <Component className={classes}>{children}</Component>;
};

export default Typography;
