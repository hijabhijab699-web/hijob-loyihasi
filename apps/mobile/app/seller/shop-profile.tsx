import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { safeBack } from '../../src/lib/safe-back';

interface SellerProfile {
  id: string;
  brandName: string;
  logoUrl: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  isTop: boolean;
  isPremium: boolean;
}

function Field({ label, value, onChangeText, placeholder, multiline, colors, theme }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, paddingLeft: 4 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
        paddingHorizontal: 14,
        minHeight: multiline ? 96 : 48,
        paddingVertical: multiline ? 10 : 0,
        justifyContent: 'center',
      }}>
        <TextInput
          value={value ?? ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          multiline={multiline}
          style={{
            fontSize: 14,
            fontFamily: theme.fontFamilies.body,
            color: colors.ink,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 76 : undefined,
          }}
        />
      </View>
    </View>
  );
}

export default function ShopProfileScreen() {
  const { colors, theme } = useTheme();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<SellerProfile>({
    queryKey: ['seller-profile'],
    queryFn: async () => (await api.get<SellerProfile>('/seller/profile')).data,
  });

  const [form, setForm] = useState<Partial<SellerProfile>>({});

  useEffect(() => {
    if (data) setForm({
      brandName: data.brandName,
      description: data.description,
      country: data.country ?? 'Uzbekistan',
      city: data.city,
      district: data.district,
      addressLine: data.addressLine,
      latitude: data.latitude,
      longitude: data.longitude,
      logoUrl: data.logoUrl,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch('/seller/profile', {
        brandName: form.brandName,
        description: form.description,
        country: form.country,
        city: form.city,
        district: form.district,
        addressLine: form.addressLine,
        latitude: form.latitude,
        longitude: form.longitude,
        logoUrl: form.logoUrl,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-profile'] });
      Alert.alert('✓', 'Saqlandi');
    },
    onError: (e: any) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  const uploadLogo = useMutation({
    mutationFn: async (uri: string) => {
      const fd = new FormData();
      const name = uri.split('/').pop() || 'logo.jpg';
      const type = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg';
      fd.append('files', { uri, name, type } as any);
      const res = await api.post<{ files: Array<{ url: string }> }>('/seller/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.files[0]?.url;
    },
    onSuccess: (url) => {
      if (url) setForm((f) => ({ ...f, logoUrl: url }));
    },
    onError: (e: any) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat kerak', 'Galereyaga ruxsat bering');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    uploadLogo.mutate(res.assets[0].uri);
  }

  const pickLocation = useMutation({
    mutationFn: async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        throw new Error('LOCATION_PERMISSION_DENIED');
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    },
    onSuccess: (coords) => {
      setForm((f) => ({ ...f, latitude: coords.latitude, longitude: coords.longitude }));
      Alert.alert('✓', `Lokatsiya olingan: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    },
    onError: (e: any) => {
      if (e?.message === 'LOCATION_PERMISSION_DENIED') {
        Alert.alert('Ruxsat kerak', 'Lokatsiyaga ruxsat bering yoki qo\'lda kiriting');
      } else {
        Alert.alert(errorTitle(), errorMessage(e));
      }
    },
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Pressable
            onPress={() => safeBack()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </Pressable>
          <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
            Do'kon ma'lumotlari
          </Text>
        </View>

        {isLoading || !data ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.oliveDeep} />
          </View>
        ) : (
          <>
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Pressable
                onPress={pickLogo}
                disabled={uploadLogo.isPending}
                style={{
                  width: 108, height: 108, borderRadius: 54,
                  backgroundColor: 'rgba(138,141,91,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: colors.goldSoft,
                  overflow: 'hidden',
                }}
              >
                {form.logoUrl ? (
                  <Image source={{ uri: form.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="storefront" size={44} color={colors.olive} />
                )}
                {uploadLogo.isPending && (
                  <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
                <View style={{
                  position: 'absolute', right: 4, bottom: 4,
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: colors.oliveDeep,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: colors.surface,
                }}>
                  <Ionicons name="camera" size={14} color={colors.surface} />
                </View>
              </Pressable>
              <Text variant="caption" color="muted" style={{ marginTop: 10, fontSize: 11 }}>
                Logo o'zgartirish uchun bosing
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <Field label="DO'KON NOMI" value={form.brandName} onChangeText={(v: string) => setForm((f) => ({ ...f, brandName: v }))} placeholder="Masalan: Hijob Style" colors={colors} theme={theme} />
              <Field label="TAVSIF" value={form.description} onChangeText={(v: string) => setForm((f) => ({ ...f, description: v }))} placeholder="Do'koningiz haqida qisqa ma'lumot" multiline colors={colors} theme={theme} />
              <Field label="DAVLAT" value={form.country} onChangeText={(v: string) => setForm((f) => ({ ...f, country: v }))} placeholder="Uzbekistan" colors={colors} theme={theme} />
              <Field label="SHAHAR" value={form.city} onChangeText={(v: string) => setForm((f) => ({ ...f, city: v }))} placeholder="Toshkent" colors={colors} theme={theme} />
              <Field label="TUMAN" value={form.district} onChangeText={(v: string) => setForm((f) => ({ ...f, district: v }))} placeholder="Chilonzor" colors={colors} theme={theme} />
              <Field label="TO'LIQ MANZIL" value={form.addressLine} onChangeText={(v: string) => setForm((f) => ({ ...f, addressLine: v }))} placeholder="Ko'cha, uy raqami, mo'ljal" multiline colors={colors} theme={theme} />

              {/* Location pin */}
              <View style={{ marginBottom: 20 }}>
                <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, paddingLeft: 4 }}>
                  LOKATSIYA (XARITA)
                </Text>
                <Pressable
                  onPress={() => pickLocation.mutate()}
                  disabled={pickLocation.isPending}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
                    paddingHorizontal: 14, paddingVertical: 14,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: colors.oliveDeep,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {pickLocation.isPending ? (
                      <ActivityIndicator color={colors.goldSoft} size="small" />
                    ) : (
                      <Ionicons name="location" size={20} color={colors.goldSoft} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="ink" style={{ fontWeight: '600', fontSize: 14 }}>
                      {form.latitude && form.longitude
                        ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                        : 'GPS orqali belgilash'}
                    </Text>
                    <Text variant="caption" color="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {form.latitude ? 'O\'zgartirish uchun bosing' : 'Telefon lokatsiyasidan foydalanadi'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
                {form.latitude != null && form.longitude != null && (
                  <Pressable
                    onPress={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  >
                    <Text variant="caption" color="danger" style={{ fontSize: 12 }}>
                      Lokatsiyani o'chirish
                    </Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => save.mutate()}
                disabled={save.isPending || !form.brandName?.trim()}
                style={{
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: colors.oliveDeep,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: save.isPending || !form.brandName?.trim() ? 0.5 : 1,
                  marginTop: 8,
                }}
              >
                {save.isPending ? (
                  <ActivityIndicator color={colors.goldSoft} />
                ) : (
                  <Text variant="body" style={{ color: colors.goldSoft, fontWeight: '700', fontSize: 15 }}>
                    Saqlash
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
