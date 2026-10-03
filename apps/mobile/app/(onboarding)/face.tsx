import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View, Text as RNText } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

export default function FaceCaptureScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const refreshMe = useAuth((s) => s.refreshMe);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const startScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Kamera ruxsati', 'Yuz skaneri uchun kameraga ruxsat kerak');
        return;
      }
    }
    setScanning(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) return;
      const form = new FormData();
      form.append('front', {
        uri: photo.uri,
        name: 'front.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      await api.post('/onboarding/face/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });
      await refreshMe();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message ?? 'Tarmoq xatosi');
    } finally {
      setProcessing(false);
    }
  };

  const skip = () => {
    router.replace('/(tabs)/home');
  };

  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        {/* Overlay */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={260} height={320} viewBox="0 0 260 320">
            <Ellipse cx={130} cy={160} rx={110} ry={140} stroke={colors.gold} strokeWidth={3} fill="none" strokeDasharray="8 6" />
          </Svg>
        </View>
        <SafeAreaView edges={['top', 'bottom']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Pressable
              onPress={() => setScanning(false)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Svg width={18} height={18} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 4 L6 9 L12 14" />
              </Svg>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 8 }}>
              Yuzingizni ramkaga joylashtiring
            </RNText>
            <Pressable
              onPress={capturePhoto}
              disabled={processing}
              style={{
                paddingVertical: 16, backgroundColor: colors.oliveDeep, borderRadius: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: processing ? 0.6 : 1,
              }}
            >
              <Svg width={18} height={18} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
                <Circle cx={9} cy={9} r={7} />
                <Circle cx={9} cy={9} r={3} />
              </Svg>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 15, fontWeight: '600', color: colors.goldSoft }}>
                {processing ? 'Yuklanmoqda...' : 'Suratga olish'}
              </RNText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 4 L6 9 L12 14" />
            </Svg>
          </Pressable>

          {/* Progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, color: colors.muted }}>
              3 / 3
            </RNText>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, flexGrow: 1, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <RNText style={{ fontFamily: theme.fontFamilies.display, fontSize: 26, fontWeight: '700', color: colors.oliveDeep, marginBottom: 6, textAlign: 'center' }}>
            Yuz skaneri
          </RNText>
          <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 32, textAlign: 'center' }}>
            Virtual primerka uchun yuzingizni skanerlang
          </RNText>

          {/* Face Scan Area */}
          <View
            style={{
              width: 260, height: 320, borderRadius: 130,
              borderWidth: 2, borderStyle: 'dashed', borderColor: colors.olive,
              backgroundColor: colors.surface,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 28, position: 'relative',
            }}
          >
            {/* Face Outline */}
            <Svg width={120} height={160} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <Ellipse cx={60} cy={70} rx={48} ry={60} stroke={colors.oliveSoft} strokeWidth={1.5} />
              <Ellipse cx={40} cy={58} rx={8} ry={4} stroke={colors.olive} strokeWidth={1.5} />
              <Ellipse cx={80} cy={58} rx={8} ry={4} stroke={colors.olive} strokeWidth={1.5} />
              <Path d="M56 72 Q60 82 64 72" stroke={colors.olive} strokeWidth={1.5} />
              <Path d="M44 90 Q60 100 76 90" stroke={colors.olive} strokeWidth={1.5} />
              <Line x1={12} y1={70} x2={108} y2={70} stroke={colors.gold} strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />
            </Svg>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.olive, fontWeight: '500', marginTop: 12 }}>
              Yuzingizni ramkaga joylashtiring
            </RNText>

            {/* Corner Markers */}
            <View style={{ position: 'absolute', top: 16, left: 24, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: colors.gold, borderTopLeftRadius: 4 }} />
            <View style={{ position: 'absolute', top: 16, right: 24, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: colors.gold, borderTopRightRadius: 4 }} />
            <View style={{ position: 'absolute', bottom: 16, left: 24, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: colors.gold, borderBottomLeftRadius: 4 }} />
            <View style={{ position: 'absolute', bottom: 16, right: 24, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: colors.gold, borderBottomRightRadius: 4 }} />
          </View>

          {/* Instructions Card */}
          <View
            style={{
              width: '100%', backgroundColor: colors.surface, borderRadius: 16,
              padding: 18, borderWidth: 1, borderColor: colors.rule, gap: 14, marginBottom: 20,
            }}
          >
            <InstructionRow
              icon={
                <Svg width={16} height={16} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round">
                  <Circle cx={8} cy={8} r={5} />
                  <Path d="M8 5v3" />
                  <Circle cx={8} cy={11} r={0.5} fill={colors.oliveDeep} />
                </Svg>
              }
              title="Yaxshi yoritilgan joy"
              desc="Tabiiy yorug'likda suratga tushing"
              colors={colors}
              theme={theme}
            />
            <InstructionRow
              icon={
                <Svg width={16} height={16} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round">
                  <Rect x={3} y={3} width={10} height={10} rx={2} />
                  <Circle cx={8} cy={7} r={2} />
                  <Path d="M4 13l2.5-3 1.5 1.5 2-2.5 3 4" />
                </Svg>
              }
              title="To'g'ri qarash"
              desc="Kameraga to'g'ri qarang"
              colors={colors}
              theme={theme}
            />
            <InstructionRow
              icon={
                <Svg width={16} height={16} fill="none" stroke={colors.oliveDeep} strokeWidth={1.5} strokeLinecap="round">
                  <Circle cx={8} cy={8} r={6} />
                  <Path d="M8 4v4l2.5 2.5" />
                </Svg>
              }
              title="Qimirlamang"
              desc="3 soniya davomida harakatsiz turing"
              colors={colors}
              theme={theme}
            />
          </View>

          {/* Privacy Note */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 24, paddingHorizontal: 4, width: '100%' }}>
            <Svg width={16} height={16} fill="none" stroke={colors.olive} strokeWidth={1.5} strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
              <Rect x={2} y={8} width={12} height={7} rx={2} />
              <Path d="M5 8V5a3 3 0 016 0v3" />
            </Svg>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, color: colors.muted, lineHeight: 16, flex: 1 }}>
              Yuz ma'lumotlari qurilmangizda saqlanadi va serverga yuborilmaydi
            </RNText>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Actions */}
          <View style={{ gap: 12, width: '100%' }}>
            <Pressable
              onPress={startScan}
              style={{
                width: '100%', paddingVertical: 16, backgroundColor: colors.oliveDeep,
                borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Svg width={18} height={18} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
                <Circle cx={9} cy={9} r={7} />
                <Circle cx={9} cy={9} r={3} />
              </Svg>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 15, fontWeight: '600', color: colors.goldSoft }}>
                Skanerlash
              </RNText>
            </Pressable>

            <Pressable onPress={skip} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, color: colors.muted, fontWeight: '500' }}>
                O'tkazib yuborish
              </RNText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function InstructionRow({ icon, title, desc, colors, theme }: { icon: React.ReactNode; title: string; desc: string; colors: any; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${colors.oliveDeep}10`, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 2 }}>{title}</RNText>
        <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, color: colors.muted }}>{desc}</RNText>
      </View>
    </View>
  );
}
