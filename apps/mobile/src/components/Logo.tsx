import { View } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  size?: number;
}

export function Logo({ size = 96 }: Props) {
  const scale = 1.15;
  const imgSize = size * scale;
  const offset = -(imgSize - size) / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.20, overflow: 'hidden' }}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: imgSize, height: imgSize, marginLeft: offset, marginTop: offset }}
        contentFit="cover"
      />
    </View>
  );
}
