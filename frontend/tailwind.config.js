/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dt: {
          bg: '#F8F6F3',
          surface: '#FFFFFF',
          elevated: '#FCFBFF',
          mutedPurple: '#F4F1FF',
          
          text: '#0F172A',
          textSecondary: '#64748B',
          textMuted: '#94A3B8',
          textDisabled: '#CBD5E1',
          
          primary: '#7C5CFC',
          secondary: '#A78BFA',
          lavender: '#C4B5FD',
          primaryHover: '#6D4FF2',
          
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      boxShadow: {
        'dt-card': '0 10px 40px rgba(124, 92, 252, 0.06)',
        'dt-card-hover': '0 18px 50px rgba(124, 92, 252, 0.12)',
        'dt-glow': '0 0 40px rgba(124, 92, 252, 0.08)',
      },
      backgroundImage: {
        'dt-primary-gradient': 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 100%)',
        'dt-hero-glow': 'radial-gradient(circle at top, rgba(124,92,252,0.18), transparent 60%)',
        'dt-section-glow': 'linear-gradient(180deg, rgba(124,92,252,0.06), transparent)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
