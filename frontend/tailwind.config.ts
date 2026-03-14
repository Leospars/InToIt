import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void: '#050508',
        deep: '#0a0c14',
        surface: {
          DEFAULT: '#0f1220',
          2: '#161a2c',
          3: '#1e2340',
          4: '#252a4a',
        },
        // cyan overrides (keep Tailwind's default cyan scale too)
        cyan: {
          DEFAULT: '#00e5ff',
          dim: 'rgba(0,229,255,0.15)',
          mid: 'rgba(0,229,255,0.4)',
          50:  '#e0fffe',
          100: '#b3fdfd',
          200: '#7dfbfc',
          300: '#3df5f8',
          400: '#11ecf4',
          500: '#00e5ff',
          600: '#00b8d9',
          700: '#0086a8',
          800: '#005c78',
          900: '#003449',
        },
        violet: {
          DEFAULT: '#7c6df0',
          dim: 'rgba(124,109,240,0.15)',
          50:  '#f3f1fe',
          100: '#e4e0fc',
          200: '#cdc8f9',
          300: '#b0a9f5',
          400: '#9689f2',
          500: '#7c6df0',
          600: '#5f4feb',
          700: '#4435cc',
          800: '#3628a5',
          900: '#2c2183',
        },
        pink: {
          DEFAULT: '#ff6b9d',
        },
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, rgba(100,130,255,0.06) 1px, transparent 1px)',
        'glow-cyan':  'radial-gradient(ellipse at top,    rgba(0,229,255,0.08)  0%, transparent 60%)',
        'glow-amber': 'radial-gradient(ellipse at bottom, rgba(255,179,64,0.06) 0%, transparent 60%)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease forwards',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-right':'slideRight 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-cyan': 'pulseCyan 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'burst':      'burst 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseCyan: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(0,229,255,0.2)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(0,229,255,0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        burst: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0,229,255,0.2)',
        'glow-amber':  '0 0 20px rgba(255,179,64,0.2)',
        'glow-violet': '0 0 20px rgba(124,109,240,0.25)',
        'card':        '0 1px 0 rgba(100,130,255,0.1), 0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config
