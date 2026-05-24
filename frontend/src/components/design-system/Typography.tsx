// ============================================================================
// Typography.tsx — Unified Typography System
// ============================================================================
// Standardized text components for consistent sizing, spacing, and styling
// Supports responsive typography with Tailwind breakpoints
// ============================================================================

import React from 'react';

// cn utility - combine classnames
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'overline';

export type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
export type TextColor =
  | 'default'
  | 'muted'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'inverse';

interface TypographyProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  truncateLines?: number;
  transform?: 'uppercase' | 'lowercase' | 'capitalize';
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  gradient?: boolean;
}

// Variant to styles mapping
const VARIANT_STYLES: Record<TextVariant, string> = {
  h1: 'text-5xl lg:text-6xl font-black leading-tight',
  h2: 'text-4xl lg:text-5xl font-bold leading-tight',
  h3: 'text-3xl lg:text-4xl font-bold leading-snug',
  h4: 'text-2xl lg:text-3xl font-bold leading-snug',
  h5: 'text-xl lg:text-2xl font-semibold leading-snug',
  h6: 'text-lg lg:text-xl font-semibold leading-snug',
  subtitle1: 'text-lg font-semibold leading-normal',
  subtitle2: 'text-base font-semibold leading-normal',
  body: 'text-base font-normal leading-relaxed',
  'body-sm': 'text-sm font-normal leading-relaxed',
  caption: 'text-xs font-medium leading-normal tracking-wide',
  overline: 'text-xs font-black uppercase leading-none tracking-widest',
};

// Weight to Tailwind class mapping
const WEIGHT_MAP: Record<TextWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  black: 'font-black',
};

// Color to Tailwind class mapping
const COLOR_MAP: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  secondary: 'text-slate-600 dark:text-slate-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-cyan-600 dark:text-cyan-400',
  primary: 'text-blue-600 dark:text-blue-400',
  inverse: 'text-white dark:text-black',
};

// Text alignment
const ALIGN_MAP: Record<'left' | 'center' | 'right' | 'justify', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

/**
 * Base Typography Component
 * Dynamically renders different HTML elements based on variant
 */
export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body',
      weight,
      color = 'default',
      align = 'left',
      truncate = false,
      truncateLines,
      transform,
      italic = false,
      strikethrough = false,
      underline = false,
      gradient = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Determine which HTML element to render
    const tagName = variant.startsWith('h') 
      ? (variant as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
      : 'p';

    // Handle line clamping with Tailwind classes
    const lineClampClass = 
      truncateLines === 2 ? 'line-clamp-2' :
      truncateLines === 3 ? 'line-clamp-3' :
      truncateLines === 4 ? 'line-clamp-4' :
      truncateLines === 5 ? 'line-clamp-5' :
      truncateLines === 6 ? 'line-clamp-6' :
      '';

    // Handle text transform
    const transformClass = 
      transform === 'uppercase' ? 'uppercase' :
      transform === 'lowercase' ? 'lowercase' :
      transform === 'capitalize' ? 'capitalize' :
      '';

    const classes = cn(
      VARIANT_STYLES[variant],
      weight ? WEIGHT_MAP[weight] : '',
      COLOR_MAP[color],
      ALIGN_MAP[align],
      truncate && 'truncate',
      lineClampClass,
      transformClass,
      italic && 'italic',
      strikethrough && 'line-through',
      underline && 'underline',
      gradient && 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
      className
    );

    return React.createElement(tagName, { ref, className: classes, ...props }, children);
  }
);

Typography.displayName = 'Typography';

/**
 * Heading Component
 */
export const Heading = React.forwardRef<
  HTMLHeadingElement,
  TypographyProps & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }
>(({ level = 1, ...props }, ref) => (
  <Typography
    ref={ref}
    variant={`h${level}` as TextVariant}
    {...props}
  />
));
Heading.displayName = 'Heading';

/**
 * Paragraph Component
 */
export const Paragraph = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  (props, ref) => (
    <Typography
      ref={ref as any}
      variant="body"
      {...props}
    />
  )
);
Paragraph.displayName = 'Paragraph';

/**
 * Label Component
 */
export const Label = React.forwardRef<HTMLLabelElement, TypographyProps>(
  ({ variant = 'caption', weight = 'semibold', ...props }, ref) => (
    <Typography
      ref={ref as any}
      variant={variant}
      weight={weight}
      {...props}
    />
  )
);
Label.displayName = 'Label';

/**
 * Subtitle Component
 */
export const Subtitle = React.forwardRef<
  HTMLParagraphElement,
  TypographyProps & {
    level?: 1 | 2;
  }
>(({ level = 1, ...props }, ref) => (
  <Typography
    ref={ref as any}
    variant={level === 1 ? 'subtitle1' : 'subtitle2'}
    {...props}
  />
));
Subtitle.displayName = 'Subtitle';

/**
 * Caption Component
 */
export const Caption = React.forwardRef<HTMLSpanElement, TypographyProps>(
  (props, ref) => (
    <Typography
      ref={ref as any}
      variant="caption"
      color="muted"
      {...props}
    />
  )
);
Caption.displayName = 'Caption';

/**
 * Code Component
 */
export const Code = React.forwardRef<HTMLElement, TypographyProps>(
  (props, ref) => (
    <Typography
      ref={ref as any}
      variant="body-sm"
      className={cn('bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-mono', props.className)}
      {...props}
    />
  )
);
Code.displayName = 'Code';

export default Typography;
