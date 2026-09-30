import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import type { TextStyleKey } from '@n2431/design-tokens';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends RNTextProps {
  variant?: TextStyleKey;
  color?: 'ink' | 'ink2' | 'muted' | 'gold' | 'olive' | 'oliveDeep' | 'danger' | 'surface';
}

export function Text({ variant = 'body', color = 'ink', style, ...rest }: Props) {
  const { theme, colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        theme.textStyles[variant],
        { color: colors[color] },
        style,
      ]}
    />
  );
}
