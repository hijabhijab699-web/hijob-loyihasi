export * from './colors';
export * from './typography';
export * from './spacing';

import { colors, type ColorScheme } from './colors';
import { textStyles, fontFamilies, fontSizes } from './typography';
import { spacing, radii, shadows, durations, easings, hitSlop } from './spacing';

/**
 * Yagona theme obyekti — barcha ekranlarda shu ishlatiladi.
 */
export const theme = {
  colors,
  textStyles,
  fontFamilies,
  fontSizes,
  spacing,
  radii,
  shadows,
  durations,
  easings,
  hitSlop,
};

export type Theme = typeof theme;
export type { ColorScheme };
