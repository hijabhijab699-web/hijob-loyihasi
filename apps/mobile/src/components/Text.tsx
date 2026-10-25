import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import type { TextStyleKey } from '@n2431/design-tokens';
import { useTheme } from '../theme/ThemeProvider';

type ColorKey =
  | 'ink'
  | 'ink2'
  | 'muted'
  | 'gold'
  | 'olive'
  | 'oliveDeep'
  | 'danger'
  | 'surface';

interface Props extends RNTextProps {
  variant?: TextStyleKey;
  color?: ColorKey;
}

/**
 * `oliveDeep`, `olive`, and `surface` are brand-background colors in the
 * dark palette (so cards/buttons stay dark on dark). When callers use
 * them as a TEXT color, we silently remap to a legible foreground on dark
 * backgrounds so headings and labels don't vanish in dark mode.
 */
const DARK_TEXT_REMAP: Partial<Record<ColorKey, string>> = {
  oliveDeep: 'ink',
  olive: 'oliveSoft',
  surface: 'ink',
};

export function Text({ variant = 'body', color = 'ink', style, ...rest }: Props) {
  const { theme, colors, scheme } = useTheme();
  const key =
    scheme === 'dark' && DARK_TEXT_REMAP[color] ? DARK_TEXT_REMAP[color]! : color;
  return (
    <RNText
      {...rest}
      style={[
        theme.textStyles[variant],
        { color: (colors as any)[key] ?? colors.ink },
        style,
      ]}
    />
  );
}
