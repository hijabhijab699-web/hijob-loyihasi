import type { Config } from 'tailwindcss';

// Palette mirrors @n2431/design-tokens (apps/mobile/packages/design-tokens).
// Olive primary + gold accent; cream surfaces. Keep this in sync with
// packages/design-tokens/src/colors.ts when the mobile palette shifts.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8A8D5B',
          dark: '#363924',
          light: '#B5B891',
        },
        accent: {
          DEFAULT: '#C9A96E',
          dark: '#A88848',
          light: '#E4CE9A',
        },
        bg: {
          DEFAULT: '#FFFFFF',
          warm: '#F7F2E6',
          cream: '#EFE6CF',
          dark: '#161513',
          footer: '#15150F',
        },
        ink: {
          DEFAULT: '#2A2820',
          dark: '#1C1A14',
          muted: '#857E6E',
          light: '#B0A898',
        },
        rule: {
          DEFAULT: '#D9D0BE',
          light: '#E7DEC8',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
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
