import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { useAuth } from '../../src/store/auth';
import { safeBack } from '../../src/lib/safe-back';

interface Me {
  id: string;
  username: string;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  language: 'uz' | 'ru' | 'en';
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, editable = true, colors, theme }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, paddingLeft: 4 }}>
        {label}
      </Text>
      <View style={{
        backgroundColor: editable ? colors.surface : colors.surfaceAlt,
        borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
        paddingHorizontal: 14, height: 48, justifyContent: 'center',
        opacity: editable ? 1 : 0.7,
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          editable={editable}
          style={{ fontSize: 14, fontFamily: theme.fontFamilies.body, color: colors.ink }}
        />
      </View>
    </View>
  );
}

export default function ProfileDetailsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const refreshMe = useAuth((s) => s.refreshMe);

  const { data, isLoading } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => (await api.get<Me>('/users/me')).data,
  });

  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (data) setFullName(data.fullName ?? '');
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me', { fullName: fullName.trim() });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      await refreshMe();
      Alert.alert('✓', 'Saqlandi');
    },
    onError: (e: any) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (uri: string) => {
      const form = new FormData();
      const name = uri.split('/').pop() || 'avatar.jpg';
      const type = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg';
      form.append('avatar', { uri, name, type } as any);
      await api.post('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      await refreshMe();
    },
    onError: (e: any) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Ruxsat kerak', 'Rasm tanlash uchun galereyaga ruxsat bering');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    uploadAvatar.mutate(res.assets[0].uri);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
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
            Profil ma'lumotlari
          </Text>
        </View>

        {isLoading || !data ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.oliveDeep} />
          </View>
        ) : (
          <>
            <View style={{ alignItems: 'center', marginBottom: 28 }}>
              <Pressable
                onPress={pickAvatar}
                disabled={uploadAvatar.isPending}
                style={{
                  width: 108, height: 108, borderRadius: 54,
                  backgroundColor: 'rgba(138,141,91,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: colors.goldSoft,
                  overflow: 'hidden',
                }}
              >
                {data.avatarUrl ? (
                  <Image source={{ uri: data.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={44} color={colors.olive} />
                )}
                {uploadAvatar.isPending && (
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
                Rasm o'zgartirish uchun bosing
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <FormField
                label="ISM VA FAMILIYA"
                value={fullName}
                onChangeText={setFullName}
                placeholder="To'liq ismingizni kiriting"
                colors={colors}
                theme={theme}
              />
              <FormField
                label="USERNAME"
                value={`@${data.username}`}
                editable={false}
                colors={colors}
                theme={theme}
              />
              <FormField
                label="TELEFON RAQAM"
                value={data.phone}
                editable={false}
                colors={colors}
                theme={theme}
              />

              <Text variant="caption" color="muted" style={{ fontSize: 11, marginBottom: 20, paddingHorizontal: 4 }}>
                Username va telefon raqam o'zgartirilmaydi — ular hisobga kirish identifikatori. O'zgartirmoqchi bo'lsangiz support'ga murojaat qiling.
              </Text>

              {(() => {
                const isDisabled =
                  save.isPending ||
                  fullName.trim().length < 2 ||
                  fullName.trim() === (data.fullName ?? '');
                return (
                  <Pressable
                    onPress={() => save.mutate()}
                    disabled={isDisabled}
                    style={{
                      height: 52,
                      borderRadius: 16,
                      // Always use the dark olive bg so the gold label
                      // reads clearly; dim with opacity when disabled
                      // instead of switching to a near-background colour
                      // that erased the label on first paint.
                      backgroundColor: colors.oliveDeep,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: save.isPending ? 0.7 : isDisabled ? 0.5 : 1,
                    }}
                  >
                    {save.isPending ? (
                      <ActivityIndicator color={colors.goldSoft} />
                    ) : (
                      <Text
                        variant="body"
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: colors.goldSoft,
                          fontFamily: theme.fontFamilies.display,
                        }}
                      >
                        Saqlash
                      </Text>
                    )}
                  </Pressable>
                );
              })()}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
