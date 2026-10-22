import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  View,
  Text as RNText,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G, Path, Polyline } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useTryonOnboarding } from '../../src/store/tryon-onboarding';
import { api } from '../../src/api/client';

const WOMAN_IMG = require('../../assets/body-woman.png');
const FALLBACK_FACE = require('../../assets/demo-face.jpg');

export default function AvatarReadyScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const faceUri = useTryonOnboarding((s) => s.faceUri);
  const faceOverlayUrl = useTryonOnboarding((s) => s.faceOverlayUrl);
  const heightCm = useTryonOnboarding((s) => s.heightCm);
  const bodyType = useTryonOnboarding((s) => s.bodyType);
  const storeId = useTryonOnboarding((s) => s.storeId);
  const markComplete = useTryonOnboarding((s) => s.markComplete);

  // Prep status: `null` = idle (initial render), `uploading` = we're
  // posting the selfie to /tryon/prepare, `done` = backend has queued the
  // pre-renders and we can enter the Primerka tab. We don't block navigation
  // on the queue completing — the catalog will show whatever renders are
  // already ready and keep polling for the rest.
  const [prepState, setPrepState] = useState<'idle' | 'uploading' | 'done'>('idle');

  const bodyLabel =
    bodyType === 'slim' ? "Ozg'in" : bodyType === 'full' ? "To'la" : "O'rtacha";

  const faceScale = useRef(new Animated.Value(0.6)).current;
  const faceOpacity = useRef(new Animated.Value(0)).current;
  const haloRotation = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.spring(faceScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(faceOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(haloRotation, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [faceScale, faceOpacity, checkScale, haloRotation]);

  const spin = haloRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Prefer the server-cropped transparent-background PNG when available —
  // it drops in without a boxy portrait rim. Fall back to the raw selfie
  // (and finally the demo) when it hasn't come back yet.
  const faceSource = faceOverlayUrl
    ? { uri: faceOverlayUrl }
    : faceUri
      ? { uri: faceUri }
      : FALLBACK_FACE;
  const useTransparentOverlay = !!faceOverlayUrl;

  // Fire the one-time /tryon/prepare upload as soon as this screen mounts —
  // the user is reading the "Avatar tayyor!" copy anyway, so we spend that
  // time persisting the selfie + enqueuing the background face-swap jobs.
  // The hero button stays enabled; worst case the user hits it before the
  // network call returns and we fire-and-forget the request.
  useEffect(() => {
    if (!faceUri || prepState !== 'idle') return;
    setPrepState('uploading');
    (async () => {
      try {
        const form = new FormData();
        form.append('face', {
          uri: faceUri,
          name: 'selfie.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
        if (bodyType) form.append('bodyType', bodyType);
        if (heightCm != null) form.append('heightCm', String(heightCm));
        if (storeId) form.append('sellerId', storeId);
        await api.post('/tryon/prepare', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 45_000,
        });
      } catch (e: any) {
        console.warn('tryon prepare failed', e?.message ?? e);
        // Non-fatal: the Primerka tab shows raw mannequins until the next
        // "Yuzni yangilash" tap retries the upload.
      } finally {
        setPrepState('done');
      }
    })();
  }, [faceUri, bodyType, heightCm, storeId, prepState]);

  const enter = async () => {
    await markComplete();
    router.replace('/(tabs)/tryon');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />

      {/* Decorative background */}
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
        <Svg width="100%" height="100%" viewBox="0 0 390 844" fill="none">
          <G opacity={0.1} transform="translate(320, 90) rotate(30)">
            <Path d="M0 35C8 18 26 5 44 0C40 12 30 26 18 35C9 42 4 37 0 35Z" fill={colors.olive} />
          </G>
          <G opacity={0.08} transform="translate(-10, 160) rotate(-20)">
            <Path d="M0 28C7 14 22 4 38 0C34 10 25 22 14 28C7 33 2 30 0 28Z" fill={colors.olive} />
          </G>
          <G opacity={0.1} transform="translate(-10, 640) rotate(-25)">
            <Path d="M0 45C10 22 32 8 55 0C50 15 38 30 22 42C12 50 4 46 0 45Z" fill={colors.oliveDark} />
          </G>
          <G opacity={0.08} transform="translate(340, 620) rotate(15)">
            <Path d="M0 40C10 20 28 6 48 0C44 14 34 28 20 38C10 46 4 42 0 40Z" fill={colors.oliveDark} />
          </G>
          <Circle cx={340} cy={280} r={1.6} fill={colors.gold} opacity={0.3} />
          <Circle cx={40} cy={340} r={1.2} fill={colors.gold} opacity={0.25} />
          <Circle cx={60} cy={520} r={1.4} fill={colors.gold} opacity={0.25} />
        </Svg>
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Progress header */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RNText style={{
              fontFamily: theme.fontFamilies.body, fontSize: 12,
              color: colors.muted, fontWeight: '500',
            }}>
              4 / 4
            </RNText>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
            </View>
          </View>
        </View>

        {/* Title block */}
        <View style={{ alignItems: 'center', paddingTop: 20, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{ width: 20, height: 1, backgroundColor: colors.gold, opacity: 0.6 }} />
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: colors.oliveDeep,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Svg width={16} height={16} fill="none" stroke={colors.goldSoft} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="3 8 7 12 13 4" />
                </Svg>
              </View>
            </Animated.View>
            <View style={{ width: 20, height: 1, backgroundColor: colors.gold, opacity: 0.6 }} />
          </View>

          <RNText style={{
            fontFamily: theme.fontFamilies.display, fontSize: 30, fontWeight: '700',
            color: colors.oliveDeep, textAlign: 'center',
          }}>
            Avatar tayyor!
          </RNText>
          <RNText style={{
            fontFamily: theme.fontFamilies.body, fontSize: 14,
            color: colors.muted, lineHeight: 20, textAlign: 'center',
            marginTop: 6, paddingHorizontal: 20,
          }}>
            Yuzingiz manekenga joylashtirildi. Endi istalgan ro'molni sinab ko'ring
          </RNText>
        </View>

        {/* Mannequin + face preview */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Rotating halo */}
          <Animated.View style={{
            position: 'absolute', width: 320, height: 320,
            transform: [{ rotate: spin }],
          }}>
            <Svg width={320} height={320} viewBox="0 0 320 320" fill="none">
              <Circle cx={160} cy={160} r={150}
                stroke={colors.gold} strokeWidth={1} strokeDasharray="4 10" opacity={0.4} />
              <Circle cx={160} cy={30} r={3} fill={colors.gold} opacity={0.7} />
              <Circle cx={290} cy={160} r={2} fill={colors.olive} opacity={0.5} />
              <Circle cx={160} cy={290} r={2.5} fill={colors.gold} opacity={0.6} />
              <Circle cx={30} cy={160} r={2} fill={colors.olive} opacity={0.5} />
            </Svg>
          </Animated.View>

          {/* Backdrop ellipse */}
          <View style={{
            position: 'absolute', width: 260, height: 320, borderRadius: 160,
            backgroundColor: `${colors.goldSoft}1F`,
          }} />

          {/* Mannequin body with the buyer's face sitting inside the hijab's
              face opening. The oval is small (matches real face size), lower
              on the frame (so it falls inside the hijab, not above it), and
              has a subtle inner shadow so the join reads as a real wearer. */}
          <View style={{ width: 220, height: 400, position: 'relative' }}>
            <Image
              source={WOMAN_IMG}
              style={{ width: 220, height: 400, position: 'absolute', top: 0, left: 0 }}
              contentFit="contain"
            />

            {/* Face: small oval, centered over the hijab's face opening */}
            {(() => {
              const faceW = 56;
              const faceH = 68;
              const faceTop = 32;
              const faceLeft = (220 - faceW) / 2;
              return (
                <>
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: faceTop,
                      left: faceLeft,
                      width: faceW,
                      height: faceH,
                      borderRadius: useTransparentOverlay ? 0 : faceW / 2,
                      overflow: useTransparentOverlay ? 'visible' : 'hidden',
                      opacity: faceOpacity,
                      transform: [{ scale: faceScale }],
                      shadowColor: colors.oliveDeep,
                      shadowOpacity: 0.25,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <Image
                      source={faceSource}
                      style={{ width: '100%', height: '100%' }}
                      contentFit={useTransparentOverlay ? 'contain' : 'cover'}
                    />
                    {!useTransparentOverlay && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          bottom: 0, left: 0, right: 0, height: 10,
                          backgroundColor: 'rgba(0,0,0,0.14)',
                        }}
                      />
                    )}
                  </Animated.View>
                  {/* Thin gold ring hugging the face oval (only when we're
                      using the raw selfie — the transparent PNG has its own
                      feathered edge). */}
                  {!useTransparentOverlay && (
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: faceTop,
                        left: faceLeft,
                        width: faceW,
                        height: faceH,
                        borderRadius: faceW / 2,
                        borderWidth: 1,
                        borderColor: `${colors.goldSoft}66`,
                        opacity: faceOpacity,
                        transform: [{ scale: faceScale }],
                      }}
                    />
                  )}
                </>
              );
            })()}

            {/* Shimmer sweep sparkle */}
            <View style={{
              position: 'absolute', top: 110, right: 20,
              width: 10, height: 10,
            }}>
              <Svg width={10} height={10} viewBox="0 0 10 10">
                <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={colors.gold} opacity={0.8} />
              </Svg>
            </View>
          </View>

          {/* Stats pills */}
          <View style={{
            position: 'absolute', bottom: 20, left: 20, right: 20,
            flexDirection: 'row', gap: 8, justifyContent: 'center',
          }}>
            {heightCm != null && (
              <StatPill
                icon={<Svg width={14} height={14} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round"><Path d="M7 1v12M4 3l3-2 3 2M4 11l3 2 3-2" /></Svg>}
                label={`${heightCm} sm`}
                colors={colors}
                theme={theme}
              />
            )}
            {bodyType && (
              <StatPill
                icon={<Svg width={14} height={14} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round"><Path d="M5 13V7l2-3 2 3v6" /><Path d="M3 13h8" /></Svg>}
                label={bodyLabel}
                colors={colors}
                theme={theme}
              />
            )}
            <StatPill
              icon={<Svg width={14} height={14} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round"><Circle cx={7} cy={5} r={2.5} /><Path d="M2 13c0-3 2-5 5-5s5 2 5 5" /></Svg>}
              label="Yuz tayyor"
              colors={colors}
              theme={theme}
            />
          </View>
        </View>

        {/* Enter button */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          {prepState === 'uploading' && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, marginBottom: 10,
            }}>
              <ActivityIndicator size="small" color={colors.oliveDeep} />
              <RNText style={{
                fontFamily: theme.fontFamilies.body, fontSize: 12,
                color: colors.muted,
              }}>
                AI yuzingizni mahsulotlarga qo'ymoqda…
              </RNText>
            </View>
          )}
          <Pressable
            onPress={enter}
            style={{
              width: '100%', paddingVertical: 18, backgroundColor: colors.oliveDeep,
              borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <RNText style={{
              fontFamily: theme.fontFamilies.display, fontSize: 17, fontWeight: '700',
              color: colors.goldSoft, letterSpacing: 0.3,
            }}>
              Primerkaga kirish
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

function StatPill({
  icon, label, colors, theme,
}: {
  icon: React.ReactNode;
  label: string;
  colors: any;
  theme: any;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.ruleSoft,
      borderRadius: 999,
    }}>
      {icon}
      <RNText style={{
        fontFamily: theme.fontFamilies.body, fontSize: 12, fontWeight: '600',
        color: colors.oliveDeep,
      }}>
        {label}
      </RNText>
    </View>
  );
}
