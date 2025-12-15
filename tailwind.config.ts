import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        traffic: {
          red: '#ff5f57',
          yellow: '#ffbd2e',
          green: '#28ca42'
        }
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'blur-in': {
          from: { filter: 'blur(10px)', opacity: '0' },
          to: { filter: 'blur(0)', opacity: '1' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'blur-in': 'blur-in 0.4s forwards'
      },
      typography: (theme: (arg0: string) => any) => ({
        DEFAULT: {
          css: {
            '--prose-body': theme('colors.foreground'),
            '--prose-headings': theme('colors.foreground'),
            '--prose-lead': theme('colors.muted.foreground'),
            '--prose-links': theme('colors.primary.DEFAULT'),
            '--prose-bold': theme('colors.foreground'),
            '--prose-counters': theme('colors.muted.foreground'),
            '--prose-bullets': theme('colors.muted.foreground'),
            '--prose-hr': theme('colors.border'),
            '--prose-quotes': theme('colors.foreground'),
            '--prose-quote-borders': theme('colors.border'),
            '--prose-captions': theme('colors.muted.foreground'),
            '--prose-code': theme('colors.foreground'),
            '--prose-pre-code': theme('colors.foreground'),
            '--prose-pre-bg': theme('colors.muted.DEFAULT'),
            '--prose-th-borders': theme('colors.border'),
            '--prose-td-borders': theme('colors.border'),
            '--prose-invert-body': theme('colors.foreground'),
            '--prose-invert-headings': theme('colors.foreground'),
            '--prose-invert-lead': theme('colors.muted.foreground'),
            '--prose-invert-links': theme('colors.primary.DEFAULT'),
            '--prose-invert-bold': theme('colors.foreground'),
            '--prose-invert-counters': theme('colors.muted.foreground'),
            '--prose-invert-bullets': theme('colors.muted.foreground'),
            '--prose-invert-hr': theme('colors.border'),
            '--prose-invert-quotes': theme('colors.foreground'),
            '--prose-invert-quote-borders': theme('colors.border'),
            '--prose-invert-captions': theme('colors.muted.foreground'),
            '--prose-invert-code': theme('colors.foreground'),
            '--prose-invert-pre-code': theme('colors.foreground'),
            '--prose-invert-pre-bg': theme('colors.muted.DEFAULT'),
            '--prose-invert-th-borders': theme('colors.border'),
            '--prose-invert-td-borders': theme('colors.border'),
            maxWidth: '100ch'
          }
        }
      })
    }
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')]
};

export default config;
