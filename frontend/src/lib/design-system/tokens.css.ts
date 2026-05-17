// frontend/src/lib/design-system/tokens.css.ts — Premium SaaS Design System Tokens
// Phase-G: Calm, premium, emotionally intelligent design system

export const colors = {
  // Semantic color system
  background: {
    primary: '#0a0a0b',
    secondary: '#111113',
    tertiary: '#18181b',
    elevated: '#1c1c1f',
    card: '#1f1f23',
  },
  foreground: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
    subtle: '#52525b',
  },
  accent: {
    primary: '#10b981',
    secondary: '#059669',
    muted: '#065f46',
    orange: '#f97316',
    amber: '#f59e0b',
    rose: '#f43f5e',
    violet: '#8b5cf6',
    blue: '#3b82f6',
  },
  surface: {
    border: '#27272a',
    highlight: '#3f3f46',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  state: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
    info: '#3b82f6',
  },
  streak: {
    fire: '#f97316',
    glow: '#fb923c',
    warm: '#fdba74',
  },
  xp: {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#b9f2ff',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.625rem',  // 10px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  glow: {
    sm: '0 0 10px rgba(16, 185, 129, 0.3)',
    DEFAULT: '0 0 20px rgba(16, 185, 129, 0.4)',
    lg: '0 0 40px rgba(16, 185, 129, 0.5)',
  },
  streak: {
    fire: '0 0 20px rgba(249, 115, 22, 0.5)',
    glow: '0 0 30px rgba(249, 115, 22, 0.6)',
  },
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  pulse: {
    animate: { scale: [1, 1.02, 1] },
  },
  shimmer: {
    animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  },
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Utility functions
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getStreakColor = (streak: number): string => {
  if (streak >= 30) return colors.streak.fire;
  if (streak >= 14) return colors.streak.glow;
  if (streak >= 7) return colors.streak.warm;
  return colors.accent.primary;
};

export const getXpColor = (xp: number): string => {
  if (xp >= 10000) return colors.xp.diamond;
  if (xp >= 5000) return colors.xp.platinum;
  if (xp >= 2000) return colors.xp.gold;
  if (xp >= 500) return colors.xp.silver;
  return colors.xp.bronze;
};

export const getRarityColor = (rarity: 'common' | 'rare' | 'epic' | 'legendary'): string => {
  switch (rarity) {
    case 'common': return colors.foreground.muted;
    case 'rare': return colors.accent.blue;
    case 'epic': return colors.accent.violet;
    case 'legendary': return colors.accent.orange;
    default: return colors.foreground.muted;
  }
};