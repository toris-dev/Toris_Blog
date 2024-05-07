import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    screens: {
      lg: '780px'
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
      },
      container: {
        center: true,
        padding: '16px'
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
      }
    }
  },
  plugins: []
};
export default config;
