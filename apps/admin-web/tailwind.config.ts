import type { Config } from 'tailwindcss';
import { colors } from '@n2431/design-tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: colors.light.bg,
        bgAlt: colors.light.bgAlt,
        surface: colors.light.surface,
        surface2: colors.light.surfaceAlt,
        ink: colors.light.ink,
        ink2: colors.light.ink2,
        muted: colors.light.muted,
        olive: colors.light.olive,
        oliveDark: colors.light.oliveDark,
        oliveDeep: colors.light.oliveDeep,
        oliveSoft: colors.light.oliveSoft,
        gold: colors.light.gold,
        goldSoft: colors.light.goldSoft,
        goldDark: colors.light.goldDark,
        danger: colors.light.danger,
        success: colors.light.success,
        warning: colors.light.warning,
        rule: colors.light.rule,
        ruleSoft: colors.light.ruleSoft,
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '20px',
        '2xl': '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(60, 50, 20, 0.06)',
        soft: '0 4px 24px rgba(60, 50, 20, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
