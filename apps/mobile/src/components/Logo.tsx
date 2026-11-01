import { View } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  size?: number;
}

// Use the teal squircle logo (dark forest green background with gold
// hijabi silhouette + gold 24:31 lettering) that the final design uses.
// The old `assets/logo.png` was the gold-outer variant from an earlier
// pass and no longer matches the brand surface anywhere else in the app.
export function Logo({ size = 96 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        overflow: 'hidden',
        shadowColor: '#1f2a16',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      }}
    >
      <Image
        source={require('../../assets/decor/logo.webp')}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
    </View>
  );
}
