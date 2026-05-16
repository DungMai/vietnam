import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#B14A2C',
          secondary: '#234B6E',
        },
        surface: {
          base: '#FBF8F2',
          raised: '#FFFFFF',
        },
        ink: {
          primary: '#1A1A1A',
          secondary: '#4A4A4A',
          inverse: '#F0EAE0',
        },
        trust: {
          verified: '#1E5A3B',
          unverified: '#8A8A8A',
        },
        warn: {
          advisory: '#3D5A80',
          alert: '#D9A24A',
          red: '#8B1A1A',
        },
        feedback: {
          success: '#7FB89B',
          error: '#D94A2C',
          info: '#5A8FB3',
        },
        province: {
          hcm: '#C44536',
          hanoi: '#3D5A80',
          danang: '#2E7D5B',
          hue: '#5B3A6E',
          khanhhoa: '#E89150',
          lamdong: '#6B8E4E',
          quangninh: '#4A6B8A',
          angiang: '#8FA862',
          haiphong: '#B44A2C',
          cantho: '#C49A3A',
        },
      },
      spacing: {
        '4xl': '6rem',
      },
      fontFamily: {
        sans: ['Inter', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
        serif: ['Source Serif Pro', 'Crimson Pro', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h1: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h2: ['1.75rem', { lineHeight: '1.2' }],
        h3: ['1.375rem', { lineHeight: '1.3' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.55' }],
        caption: ['0.8125rem', { lineHeight: '1.45' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        pill: '999px',
      },
      boxShadow: {
        raised: '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        floating: '0 6px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        overlay: '0 24px 48px rgba(0,0,0,0.18)',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '200ms',
        slow: '320ms',
        xslow: '500ms',
      },
    },
  },
  plugins: [],
};

export default config;
