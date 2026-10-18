import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
              <View style={{
                width: 90, height: 90, borderRadius: 45,
                backgroundColor: 'rgba(138,141,91,0.12)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: colors.goldSoft,
              }}>
                <Ionicons name="person" size={36} color={colors.olive} />
              </View>
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

              <Pressable
                onPress={() => save.mutate()}
                disabled={save.isPending || fullName.trim().length < 2 || fullName.trim() === (data.fullName ?? '')}
                style={{
                  height: 52, borderRadius: 16,
                  backgroundColor: fullName.trim().length < 2 || fullName.trim() === (data.fullName ?? '') ? colors.rule : colors.oliveDeep,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: save.isPending ? 0.7 : 1,
                }}
              >
                {save.isPending ? (
                  <ActivityIndicator color={colors.goldSoft} />
                ) : (
                  <Text variant="body" style={{ fontSize: 15, fontWeight: '700', color: colors.goldSoft, fontFamily: theme.fontFamilies.display }}>
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
