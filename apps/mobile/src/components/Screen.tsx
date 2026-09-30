import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface Props extends ViewProps {
  gradient?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: ViewProps['style'];
}

export function Screen({
  gradient = false,
  edges = ['top', 'bottom'],
  contentStyle,
  children,
  ...rest
}: Props) {
  const { colors, scheme } = useTheme();

  const inner = (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1 }, rest.style]}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.bg, colors.bgAlt, colors.surface2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {inner}
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>{inner}</View>
  );
}
