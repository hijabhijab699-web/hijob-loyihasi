import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props extends ViewProps {
  gradient?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: ViewProps['style'];
  // Decoration layer that renders at the very top of the device,
  // OUTSIDE SafeAreaView, so artwork (silk ribbon, waves) can extend
  // behind the status bar. The decoration View should be absolutely
  // positioned by the caller.
  topDecoration?: ReactNode;
  bottomDecoration?: ReactNode;
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
  topDecoration,
  bottomDecoration,
  children,
  ...rest
}: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      {topDecoration}
      {bottomDecoration}
      <SafeAreaView
        edges={edges}
        style={[{ flex: 1, backgroundColor: 'transparent' }, rest.style]}
      >
        <StatusBar style="dark" />
        <View style={[{ flex: 1, backgroundColor: 'transparent' }, contentStyle]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
