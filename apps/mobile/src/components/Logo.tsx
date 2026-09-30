import Svg, { Circle, Path, G, Text as SvgText, Line } from 'react-native-svg';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  size?: number;
  mono?: boolean;
  label?: boolean;
}

/**
 * N24:31 brand mark — hilol + hijob silueti + "24:31" (an-Nur surasi, oyat 31).
 */
export function Logo({ size = 96, mono, label = true }: Props) {
  const { colors } = useTheme();
  const fill = mono ? colors.ink : colors.gold;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G>
          {/* Crescent */}
          <Path
            d="M 30 50 A 22 22 0 1 0 30 49.5 A 16 16 0 1 1 30 50 Z"
            fill={fill}
            opacity={0.9}
          />
          {/* Hijab silhouette */}
          <Path
            d="M 55 32 Q 45 34 42 44 Q 40 52 44 60 Q 48 68 56 72 L 62 72 Q 62 62 60 58 Q 66 55 66 48 Q 66 40 60 36 Q 58 34 55 32 Z"
            fill={fill}
          />
          {/* Face profile */}
          <Path
            d="M 58 44 Q 62 46 62 50 Q 61 54 58 55 Q 59 58 57 60 Q 58 62 56 63"
            stroke={colors.oliveDeep}
            strokeWidth={0.6}
            fill="none"
            opacity={0.4}
          />
          {/* Leaf */}
          <Path
            d="M 68 62 Q 73 60 76 64 Q 74 68 70 66 Z"
            fill={fill}
            opacity={0.85}
          />
        </G>
      </Svg>

      {label && (
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Line />
            <Svg height={22} width={70}>
              <Line x1={0} y1={11} x2={8} y2={11} stroke={fill} strokeWidth={0.6} />
              <SvgText
                x={35}
                y={18}
                fontSize={18}
                fontFamily="PlayfairDisplay-Bold"
                fill={fill}
                textAnchor="middle"
              >
                24:31
              </SvgText>
              <Line x1={62} y1={11} x2={70} y2={11} stroke={fill} strokeWidth={0.6} />
            </Svg>
          </View>
        </View>
      )}
    </View>
  );
}
