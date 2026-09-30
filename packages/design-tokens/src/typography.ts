/**
 * Type scale. Variable font families — weight is set via fontWeight.
 * Display: Playfair Display (serif)
 * Body: Inter (sans)
 */

export const fontFamilies = {
  display: 'PlayfairDisplay',
  body: 'Inter',
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
  '6xl': 52,
  '7xl': 64,
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.75,
} as const;

export const letterSpacings = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

/**
 * Semantic text styles — komponentda shu nomlar bilan chaqiriladi.
 * Har birida fontFamily + fontWeight juftligi.
 */
export const textStyles = {
  displayHero: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes['5xl'],
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  },
  displayMedium: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.snug,
  },
  titleLarge: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
  },
  titleMedium: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.snug,
  },
  titleSmall: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
  },
  labelUppercase: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  button: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.md,
    letterSpacing: letterSpacings.wide,
  },
} as const;

export type TextStyleKey = keyof typeof textStyles;
