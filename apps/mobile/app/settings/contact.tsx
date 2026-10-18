import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { safeBack } from '../../src/lib/safe-back';

const CONTACTS = [
  {
    icon: 'paper-plane-outline' as const,
    label: 'Telegram',
    value: '@hijob_support',
    link: 'https://t.me/hijob_support',
    color: '#5F7A94',
    bg: 'rgba(95,122,148,0.1)',
  },
  {
    icon: 'call-outline' as const,
    label: 'Telefon',
    value: '+998 71 200 00 00',
    link: 'tel:+998712000000',
    color: '#7A8A5B',
    bg: 'rgba(122,138,91,0.1)',
  },
  {
    icon: 'mail-outline' as const,
    label: 'Email',
    value: 'support@hijob.uz',
    link: 'mailto:support@hijob.uz',
    color: '#C9A96E',
    bg: 'rgba(201,169,110,0.1)',
  },
];

export default function ContactScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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
            {isRu ? 'Связаться с нами' : "Biz bilan bog'laning"}
          </Text>
        </View>

        {/* Contact methods */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
            {isRu ? 'Способы связи' : 'Aloqa usullari'}
          </Text>
          <View style={{ gap: 10 }}>
            {CONTACTS.map((c) => (
              <Pressable
                key={c.label}
                onPress={() => Linking.openURL(c.link).catch(() => {})}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.rule,
                  padding: 16,
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="muted" style={{ fontSize: 11, marginBottom: 2 }}>{c.label}</Text>
                  <Text variant="bodySmall" color="ink" style={{ fontSize: 14, fontWeight: '500' }}>{c.value}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Message form */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
            {isRu ? 'Отправить сообщение' : 'Xabar yuborish'}
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.rule, padding: 16, gap: 14 }}>
            <View>
              <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', marginBottom: 6 }}>{isRu ? 'ТЕМА' : 'MAVZU'}</Text>
              <View style={{
                borderRadius: 12, borderWidth: 1, borderColor: colors.rule,
                paddingHorizontal: 14, height: 44, justifyContent: 'center',
              }}>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder={isRu ? 'Выберите тему...' : 'Mavzuni tanlang...'}
                  placeholderTextColor={colors.muted}
                  style={{ fontSize: 14, fontFamily: theme.fontFamilies.body, color: colors.ink }}
                />
              </View>
            </View>

            <View>
              <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', marginBottom: 6 }}>{isRu ? 'СООБЩЕНИЕ' : 'XABARINGIZ'}</Text>
              <View style={{
                borderRadius: 12, borderWidth: 1, borderColor: colors.rule,
                padding: 14, minHeight: 110,
              }}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={isRu ? 'Напишите сообщение...' : 'Xabaringizni yozing...'}
                  placeholderTextColor={colors.muted}
                  multiline
                  textAlignVertical="top"
                  style={{ fontSize: 14, fontFamily: theme.fontFamilies.body, color: colors.ink, minHeight: 80 }}
                />
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (!subject.trim() || !message.trim()) {
                  Alert.alert(
                    isRu ? 'Ошибка' : 'Xatolik',
                    isRu ? 'Введите тему и текст сообщения.' : 'Mavzu va xabar matnini kiriting.',
                  );
                  return;
                }
                // No feedback-submit endpoint yet, so compose a mailto with
                // the typed subject/body — opens the user's mail app with
                // the fields pre-filled.
                const url = `mailto:support@hijob.uz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                Linking.openURL(url)
                  .then(() => {
                    setSubject('');
                    setMessage('');
                  })
                  .catch(() =>
                    Alert.alert(
                      isRu ? 'Ошибка' : 'Xatolik',
                      isRu ? 'Не удалось открыть почту.' : "Pochta ilovasini ochib bo'lmadi.",
                    ),
                  );
              }}
              style={{
                height: 48, borderRadius: 14, backgroundColor: colors.oliveDeep,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
              }}
            >
              <Ionicons name="send" size={16} color={colors.goldSoft} />
              <Text variant="body" style={{ fontSize: 14, fontWeight: '700', color: colors.goldSoft }}>{isRu ? 'Отправить' : 'Yuborish'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Working hours */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{
            backgroundColor: 'rgba(201,169,110,0.08)', borderRadius: 14,
            padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Ionicons name="time-outline" size={20} color={colors.gold} />
            <View>
              <Text variant="bodySmall" color="ink" style={{ fontSize: 13, fontWeight: '500' }}>{isRu ? 'Часы работы' : 'Ish vaqti'}</Text>
              <Text variant="caption" color="muted" style={{ fontSize: 12 }}>{isRu ? 'Пн-Пт: 09:00 - 18:00' : 'Dush-Jum: 09:00 - 18:00'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
