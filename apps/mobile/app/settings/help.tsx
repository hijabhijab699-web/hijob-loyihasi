import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { safeBack } from '../../src/lib/safe-back';

const FAQ_UZ = [
  { q: 'Buyurtmani qanday berishim mumkin?', a: "Mahsulotni tanlang, savatga qo'shing va buyurtmani rasmiylashtiring. To'lov naqd yoki karta orqali amalga oshiriladi." },
  { q: 'Virtual primerka qanday ishlaydi?', a: "Profilga yuzingiz va tana o'lchovlaringizni kiriting. So'ng mahsulot sahifasida \"Sinab ko'rish\" tugmasini bosing." },
  { q: 'Mahsulotni qaytarish mumkinmi?', a: "14 kun ichida foydalanilmagan mahsulotni qaytarish mumkin. Buyurtma sahifasidan so'rov yuboring." },
  { q: 'Yetkazish qancha vaqt oladi?', a: 'Toshkent shahrida 1-2 kun, viloyatlarga 3-5 ish kuni.' },
  { q: "To'lov usullari qanday?", a: "Naqd pul, Payme, Click, va bank kartasi orqali to'lash mumkin." },
];

const FAQ_RU = [
  { q: 'Как сделать заказ?', a: 'Выберите товар, добавьте в корзину и оформите заказ. Оплата наличными или картой.' },
  { q: 'Как работает виртуальная примерка?', a: 'Добавьте в профиль фото лица и параметры тела. Затем на странице товара нажмите «Примерить».' },
  { q: 'Можно ли вернуть товар?', a: 'В течение 14 дней можно вернуть неиспользованный товар. Отправьте запрос со страницы заказа.' },
  { q: 'Сколько занимает доставка?', a: 'По Ташкенту 1-2 дня, по регионам 3-5 рабочих дней.' },
  { q: 'Какие способы оплаты?', a: 'Наличные, Payme, Click и банковская карта.' },
];

export default function HelpCenterScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [expanded, setExpanded] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const FAQ = isRu ? FAQ_RU : FAQ_UZ;
  const filtered = search ? FAQ.filter((f) => f.q.toLowerCase().includes(search.toLowerCase())) : FAQ;

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
            {isRu ? 'Центр помощи' : 'Yordam markazi'}
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
            paddingHorizontal: 14, height: 44,
          }}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={isRu ? 'Поиск вопроса...' : 'Savolni qidirish...'}
              placeholderTextColor={colors.muted}
              style={{ flex: 1, fontSize: 14, fontFamily: theme.fontFamilies.body, color: colors.ink }}
            />
          </View>
        </View>

        {/* FAQ */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
            Ko'p so'raladigan savollar
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.rule, overflow: 'hidden' }}>
            {filtered.map((faq, i) => (
              <Pressable
                key={i}
                onPress={() => setExpanded(expanded === i ? null : i)}
                style={{
                  padding: 16,
                  borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: colors.rule,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text variant="bodySmall" color="ink" style={{ flex: 1, fontSize: 14, fontWeight: '500' }}>{faq.q}</Text>
                  <Ionicons name={expanded === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
                </View>
                {expanded === i && (
                  <Text variant="caption" color="muted" style={{ fontSize: 13, lineHeight: 19, marginTop: 10, paddingRight: 24 }}>
                    {faq.a}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}
