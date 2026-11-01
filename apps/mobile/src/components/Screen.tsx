import { StatusBar } from 'expo-status-bar';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props extends ViewProps {
  gradient?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: ViewProps['style'];
}

// Flat white backdrop — the client wanted every page to read as a
// bright white sheet (not the cream gradient the earlier design used).
// Decorative layers (silk ribbon, jasmine, wave) draw their own colour
// against this canvas; the gradient prop is now a no-op kept for
// backwards compatibility with existing call sites.
const PAGE_BG = '#ffffff';

export function Screen({
  gradient: _gradient = false,
  edges = ['top', 'bottom'],
  contentStyle,
  children,
  ...rest
}: Props) {
  const inner = (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1 }, rest.style]}
    >
      <StatusBar style="dark" />
      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>{inner}</View>
  );
}
