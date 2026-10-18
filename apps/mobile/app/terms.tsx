import { Pressable, ScrollView, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../src/theme/ThemeProvider';
import { safeBack } from '../src/lib/safe-back';

interface Section {
  title: string;
  body: string;
}

const SECTIONS_UZ: Section[] = [
  {
    title: '1. Umumiy qoidalar',
    body: '24:31 ilovasi — ro\'mol va zamonaviy modest kiyimlar uchun virtual primerka xizmati. Ilovadan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.',
  },
  {
    title: '2. Hisob (akkaunt)',
    body: 'Hisob yaratish uchun ism, telefon raqam va parol kerak. Hisob ma\'lumotlarining maxfiyligi uchun siz javobgarsiz. Boshqa shaxs nomidan hisob yaratish taqiqlanadi.',
  },
  {
    title: '3. Virtual primerka',
    body: 'Yuz skaneri va bo\'y o\'lchovi faqat sizning avatar primerkasini yaratish uchun ishlatiladi. Yuz ma\'lumotlari qurilmangizda shifrlangan holda saqlanadi va serverga asl ko\'rinishda yuborilmaydi.',
  },
  {
    title: '4. Xaridlar va to\'lovlar',
    body: 'Ilova orqali qilingan xaridlar sotuvchi do\'konlarning narx va yetkazib berish shartlariga bo\'ysunadi. 24:31 vositachi platforma hisoblanadi.',
  },
  {
    title: '5. Taqiqlangan harakatlar',
    body: 'Ilovada haqoratli, noqonuniy yoki boshqalarning haq-huquqlarini buzadigan kontent joylash, soxta hisob yaratish, boshqa foydalanuvchilarga zarar yetkazish taqiqlanadi.',
  },
  {
    title: '6. Intellektual mulk',
    body: 'Ilovaning dizayni, logotipi, kodi va kontenti 24:31 ga tegishli. Ruxsatsiz nusxalash yoki tarqatish taqiqlanadi.',
  },
  {
    title: '7. Javobgarlikni cheklash',
    body: '24:31 ilova xizmatlari "bor holicha" taqdim etiladi. Virtual primerka natijalari taxminiy bo\'lib, haqiqiy mahsulot ko\'rinishidan farq qilishi mumkin.',
  },
  {
    title: '8. O\'zgartirishlar',
    body: 'Ushbu shartlar yangilanishi mumkin. Katta o\'zgarishlar haqida foydalanuvchilarga oldindan xabar beriladi.',
  },
  {
    title: '9. Aloqa',
    body: 'Savollar yoki shikoyatlar bo\'yicha: support@24-31.app',
  },
];

const SECTIONS_RU: Section[] = [
  {
    title: '1. Общие положения',
    body: 'Приложение 24:31 — сервис виртуальной примерки платков и современной скромной одежды. Используя приложение, вы соглашаетесь со следующими условиями.',
  },
  {
    title: '2. Учётная запись',
    body: 'Для создания аккаунта требуется имя, номер телефона и пароль. Вы несёте ответственность за сохранность данных аккаунта. Создание аккаунта от имени другого лица запрещено.',
  },
  {
    title: '3. Виртуальная примерка',
    body: 'Сканер лица и измерения роста используются только для создания вашего аватара примерки. Данные лица хранятся в зашифрованном виде на вашем устройстве и не отправляются на сервер в исходном виде.',
  },
  {
    title: '4. Покупки и платежи',
    body: 'Покупки через приложение подчиняются условиям цен и доставки магазинов-продавцов. 24:31 является платформой-посредником.',
  },
  {
    title: '5. Запрещённые действия',
    body: 'Запрещается размещать оскорбительный, незаконный или нарушающий права других контент, создавать поддельные аккаунты, причинять вред другим пользователям.',
  },
  {
    title: '6. Интеллектуальная собственность',
    body: 'Дизайн, логотип, код и контент приложения принадлежат 24:31. Копирование или распространение без разрешения запрещено.',
  },
  {
    title: '7. Ограничение ответственности',
    body: 'Услуги приложения 24:31 предоставляются «как есть». Результаты виртуальной примерки являются приблизительными и могут отличаться от реального вида товара.',
  },
  {
    title: '8. Изменения',
    body: 'Эти условия могут обновляться. О существенных изменениях пользователи будут уведомлены заранее.',
  },
  {
    title: '9. Связь',
    body: 'По вопросам и жалобам: support@24-31.app',
  },
];

export default function TermsScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const sections = isRu ? SECTIONS_RU : SECTIONS_UZ;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => safeBack()}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 4 L6 9 L12 14" />
            </Svg>
          </Pressable>
          <RNText
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 20, fontWeight: '700',
              color: colors.oliveDeep, flex: 1,
            }}
          >
            {isRu ? 'Условия использования' : 'Foydalanish shartlari'}
          </RNText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <RNText
            style={{
              fontFamily: theme.fontFamilies.body,
              fontSize: 12, color: colors.muted,
              marginBottom: 20,
            }}
          >
            {isRu ? 'Последнее обновление: 15 октября 2026' : 'Oxirgi yangilanish: 2026-yil 15-oktyabr'}
          </RNText>

          {sections.map((s) => (
            <View key={s.title} style={{ marginBottom: 20 }}>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 16, fontWeight: '700',
                  color: colors.oliveDeep, marginBottom: 6,
                }}
              >
                {s.title}
              </RNText>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 14, lineHeight: 22,
                  color: colors.ink,
                }}
              >
                {s.body}
              </RNText>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
