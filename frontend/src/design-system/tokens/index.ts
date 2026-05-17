// frontend/src/design-system/tokens/index.ts
// Ultra-premium engineering OS design token system.

export const motion = {
  // Spring physics based transitions (Linear/Apple style)
  spring: {
    snappy: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    fluid: 'cubic-bezier(0.4, 0, 0.2, 1)',
    cinematic: 'cubic-bezier(0.25, 1, 0.5, 1)',
    bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '250ms',
    smooth: '400ms',
    ambient: '800ms',
    cinematic: '1200ms',
  },
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  }
};

export const depth = {
  // Ultra-fine shadow stacking simulating ambient global illumination
  shadows: {
    level0: 'none',
    level1: '0 1px 2px rgba(0, 0, 0, 0.4), 0 0px 1px rgba(0, 0, 0, 0.3)',
    level2: '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
    level3: '0 12px 32px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(0, 230, 118, 0.15), 0 0 40px rgba(0, 230, 118, 0.05)',
    glowError: '0 0 20px rgba(255, 23, 68, 0.15)',
  },
  // Sub-pixel border radii for organic geometry
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '20px',
    pill: '9999px',
  },
  // High-performance blur layers
  glass: {
    subtle: 'backdrop-filter: blur(8px) saturate(150%)',
    heavy: 'backdrop-filter: blur(24px) saturate(180%)',
    overlay: 'backdrop-filter: blur(48px) saturate(200%)',
  }
};

export const typography = {
  family: {
    sans: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
    display: '"Plus Jakarta Sans", "Inter", sans-serif',
  },
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.04em',
    widest: '0.1em',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
};

export const colors = {
  surface: {
    base: '#0A0A0B',
    elevated: '#121315',
    floating: 'rgba(23, 24, 28, 0.75)',
    border: '#232429',
    borderGlow: 'rgba(255,255,255, 0.08)',
  },
  accent: {
    primary: '#00E676',       // Vivid matrix green
    primaryDim: 'rgba(0, 230, 118, 0.15)',
    secondary: '#00B0FF',     // Vivid cyan
    warning: '#FF9100',
    error: '#FF1744',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#88888B',
    tertiary: '#555558',
    inverse: '#000000',
  }
};

export const telemetry = {
  pulseParams: {
    frequency: '2s',
    scaleMax: 1.05,
    opacityMin: 0.4,
  },
  grid: {
    size: '24px',
    color: 'rgba(255, 255, 255, 0.02)',
  }
};
