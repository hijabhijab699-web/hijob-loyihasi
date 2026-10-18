import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C6354',
          dark: '#5D4A3E',
          light: '#8B6F5C',
        },
        accent: {
          DEFAULT: '#C4A265',
          dark: '#B8956A',
          light: '#D4B87A',
        },
        bg: {
          DEFAULT: '#ffffff',
          warm: '#F7F2ED',
          cream: '#FAF7F4',
          dark: '#1E1614',
          footer: '#161110',
        },
        ink: {
          DEFAULT: '#4A3F3A',
          dark: '#1E1614',
          muted: '#8B8178',
          light: '#B0A898',
        },
        rule: {
          DEFAULT: '#E8E0D8',
          light: '#F0EAE4',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
