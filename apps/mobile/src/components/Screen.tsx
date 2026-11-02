import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
// Soft cream fill painted behind the top-decoration layer so any
// transparent pixels in the silk-ribbon artwork read as warm fabric,
// never as the darkness of an unpainted window. Blends in without a
// visible seam against the ribbon's cream palette.
const TOP_FALLBACK = '#f6ede0';

export function Screen({
  gradient: _gradient = false,
  edges = ['top', 'bottom'],
  contentStyle,
  topDecoration,
  bottomDecoration,
  children,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      {/* Cream fallback that extends from the very top of the device
          down past the status-bar band so any transparent pixels in the
          silk-ribbon artwork read as fabric, never as window darkness.
          Height matches the silk ribbon so there is no color seam
          where the ribbon ends. */}
      {topDecoration ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: insets.top + 120,
            backgroundColor: TOP_FALLBACK,
            zIndex: 0,
          }}
        />
      ) : null}
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
