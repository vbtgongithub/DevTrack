/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dt: {
          bg: 'rgb(var(--dt-bg) / <alpha-value>)',
          surface: 'rgb(var(--dt-surface) / <alpha-value>)',
          text: 'rgb(var(--dt-text) / <alpha-value>)',
          muted: 'rgb(var(--dt-muted) / <alpha-value>)',
          rowHover: 'rgb(var(--dt-row-hover) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
