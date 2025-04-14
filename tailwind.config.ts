import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '375px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1500px'
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid':
          'linear-gradient(rgba(0, 0, 0, 0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.9) 1px, transparent 1px)',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, hsla(180, 100%, 74%, 1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340, 100%, 76%, 1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(270, 77%, 71%, 1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(240, 100%, 70%, 1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343, 100%, 76%, 1) 0px, transparent 50%)'
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem'
        }
      },
      lineClamp: {
        '10': '10',
        '12': '12'
      },
      width: {
        '70/100': '70%',
        '80/100': '80%',
        '90/100': '90%',
        '100/100': '100%'
      },
      animation: {
        'spin-slower': 'spin 35s ease infinite',
        'spin-slow': 'spin 25s ease-in-out infinite reverse',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'text-shimmer': 'text-shimmer 2.5s ease-out infinite alternate',
        'gradient-flow': 'gradient-flow 10s ease infinite',
        'blur-in': 'blur-in 0.4s forwards',
        'scale-in': 'scale-in 0.3s forwards'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0%' },
          '100%': { backgroundPosition: '100%' }
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        'blur-in': {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0)', opacity: '1' }
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      colors: {
        // Use CSS variables for theme colors
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          dark: 'rgb(var(--color-primary-dark))'
        },
        accent: {
          1: 'rgb(var(--color-accent-1))',
          2: 'rgb(var(--color-accent-2))'
        },
        // Background, text, and border colors
        bkg: {
          DEFAULT: 'rgb(var(--color-background))',
          light: 'rgb(var(--color-background) / 0.8)',
          dark: 'rgb(var(--color-background) / 1.2)'
        },
        card: 'rgb(var(--color-card))',
        content: {
          DEFAULT: 'rgb(var(--color-content))',
          dark: 'rgb(var(--color-content-dark))'
        },
        border: 'rgb(var(--color-border))',
        // Web3 ecosystem colors
        crypto: {
          ethereum: '#627eea',
          bitcoin: '#f7931a',
          polygon: '#8247e5',
          solana: '#00FFA3',
          cardano: '#0033AD'
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100ch',
            color: 'inherit',
            a: {
              color: 'inherit',
              opacity: 0.8,
              '&:hover': {
                opacity: 1,
                color: 'rgb(var(--color-primary))'
              },
              textDecoration: 'none'
            },
            b: { color: 'inherit' },
            strong: { color: 'inherit' },
            em: { color: 'inherit' },
            h1: { color: 'inherit' },
            h2: { color: 'inherit' },
            h3: { color: 'inherit' },
            h4: { color: 'inherit' },
            code: { color: 'inherit' }
          }
        }
      },
      boxShadow: {
        neon: '0 0 5px rgba(var(--color-primary), 0.3), 0 0 20px rgba(var(--color-primary), 0.2), 0 0 40px rgba(var(--color-primary), 0.1)',
        'neon-hover':
          '0 0 10px rgba(var(--color-primary), 0.5), 0 0 30px rgba(var(--color-primary), 0.3), 0 0 60px rgba(var(--color-primary), 0.2)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-card': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'crypto-card': '0 4px 20px rgba(var(--color-primary), 0.2)'
      },
      backdropBlur: {
        '2xs': '2px',
        xs: '4px'
      }
    }
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')]
};

export default config;
