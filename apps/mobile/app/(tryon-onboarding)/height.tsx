import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View, Text as RNText } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Line, Path } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTryonOnboarding } from '../../src/store/tryon-onboarding';
import { safeBack } from '../../src/lib/safe-back';

const WOMAN_IMG = require('../../assets/body-woman.png');

const MIN_H = 140;
const MAX_H = 210;
const TICK_W = 14;

export default function HeightScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const saved = useTryonOnboarding((s) => s.heightCm);
  const setHeight = useTryonOnboarding((s) => s.setHeight);

  const [value, setValue] = useState<number>(saved ?? 168);
  const listRef = useRef<FlatList<number>>(null);

  const ticks = useMemo(
    () => Array.from({ length: MAX_H - MIN_H + 1 }, (_, i) => MIN_H + i),
    [],
  );

  useEffect(() => {
    const idx = value - MIN_H;
    // scroll after mount so the initial value is centered under the pointer
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: idx * TICK_W, animated: false });
    }, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMomentumEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TICK_W);
    const next = Math.min(MAX_H, Math.max(MIN_H, MIN_H + idx));
    if (next !== value) {
      setValue(next);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const next = async () => {
    await setHeight(value);
    router.push('/(tryon-onboarding)/face');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 8,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Pressable
            onPress={() => safeBack()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round">
              <Path d="M12 4 L6 9 L12 14" />
            </Svg>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNText style={{
              fontFamily: theme.fontFamilies.body, fontSize: 12,
              color: colors.muted, fontWeight: '500',
            }}>
              1 / 4
            </RNText>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.rule }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.rule }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.rule }} />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <RNText style={{
            fontFamily: theme.fontFamilies.display, fontSize: 28, fontWeight: '700',
            color: colors.oliveDeep, marginBottom: 6,
          }}>
            Bo'yingiz qancha?
          </RNText>
          <RNText style={{
            fontFamily: theme.fontFamilies.body, fontSize: 14,
            color: colors.muted, lineHeight: 20,
          }}>
            Avatar sizning aniq o'lchovingizda ko'rsatiladi
          </RNText>
        </View>

        {/* Illustration + big number */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
          {/* Woman silhouette with dashed height line */}
          <View style={{ width: 160, height: 320, position: 'relative' }}>
            <View style={{
              position: 'absolute', left: 10, top: 10, bottom: 10, width: 8,
              alignItems: 'center',
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.olive }} />
              <Svg style={{ flex: 1, width: 2 }} viewBox="0 0 2 100" preserveAspectRatio="none">
                <Line x1={1} y1={0} x2={1} y2={100} stroke={colors.olive} strokeWidth={2} strokeDasharray="6 4" />
              </Svg>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.olive }} />
            </View>
            <Image
              source={WOMAN_IMG}
              style={{ width: 150, height: 310, position: 'absolute', left: 30, top: 5 }}
              contentFit="contain"
            />
          </View>

          {/* Big number */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <RNText style={{
              fontFamily: theme.fontFamilies.display, fontSize: 72, fontWeight: '700',
              color: colors.oliveDeep, lineHeight: 78,
            }}>
              {value}
            </RNText>
            <RNText style={{
              fontFamily: theme.fontFamilies.body, fontSize: 16,
              color: colors.oliveSoft, fontWeight: '500', letterSpacing: 1,
            }}>
              sm
            </RNText>
            <View style={{ height: 1, width: 60, backgroundColor: `${colors.gold}66`, marginVertical: 12 }} />
            <RNText style={{
              fontFamily: theme.fontFamilies.body, fontSize: 11,
              color: colors.muted, textAlign: 'center', paddingHorizontal: 8,
            }}>
              Chapga-o'ngga suring
            </RNText>
          </View>
        </View>

        {/* Horizontal ruler */}
        <View style={{ height: 90, position: 'relative', marginBottom: 10 }}>
          <FlatList
            ref={listRef}
            data={ticks}
            keyExtractor={(n) => String(n)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_W}
            decelerationRate="fast"
            onMomentumScrollEnd={onMomentumEnd}
            contentContainerStyle={{ paddingHorizontal: (TICK_W * 12) }}
            getItemLayout={(_, index) => ({ length: TICK_W, offset: TICK_W * index, index })}
            renderItem={({ item }) => {
              const major = item % 10 === 0;
              const mid = item % 5 === 0;
              return (
                <View style={{ width: TICK_W, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20 }}>
                  <View style={{
                    width: 2,
                    height: major ? 36 : mid ? 24 : 16,
                    backgroundColor: major ? colors.oliveDeep : mid ? colors.oliveSoft : colors.rule,
                    borderRadius: 1,
                  }} />
                  {major && (
                    <RNText style={{
                      fontFamily: theme.fontFamilies.body, fontSize: 10, marginTop: 4,
                      color: colors.muted,
                    }}>
                      {item}
                    </RNText>
                  )}
                </View>
              );
            }}
          />
          {/* Center pointer */}
          <View pointerEvents="none" style={{
            position: 'absolute', top: 10, left: 0, right: 0,
            alignItems: 'center',
          }}>
            <Svg width={14} height={10} viewBox="0 0 14 10">
              <Path d="M7 10 L0 0 L14 0 Z" fill={colors.gold} />
            </Svg>
            <View style={{ width: 2, height: 52, backgroundColor: colors.gold, marginTop: -1 }} />
          </View>
        </View>

        {/* Next */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable
            onPress={next}
            style={{
              width: '100%', paddingVertical: 18, backgroundColor: colors.oliveDeep,
              borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <RNText style={{
              fontFamily: theme.fontFamilies.display, fontSize: 17, fontWeight: '700',
              color: colors.goldSoft, letterSpacing: 0.3,
            }}>
              Keyingi
            </RNText>
            <Svg width={18} height={18} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
              <Path d="M7 4l6 5-6 5" />
            </Svg>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
