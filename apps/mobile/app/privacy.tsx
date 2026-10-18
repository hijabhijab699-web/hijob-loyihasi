import { Pressable, ScrollView, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../src/theme/ThemeProvider';
import { safeBack } from '../src/lib/safe-back';

interface Section {
  title: string;
  body: string;
}

const SECTIONS_UZ: Section[] = [
  {
    title: '1. Qanday ma\'lumotlar yig\'iladi',
    body: 'Ism, familiya, telefon raqam, parol (shifrlangan), bo\'y va vazn (ixtiyoriy), yuz skaneri (qurilmangizda shifrlangan holda), tanlagan do\'konlar va buyurtma tarixi.',
  },
  {
    title: '2. Yuz ma\'lumotlari',
    body: 'Yuz surati faqat sizning qurilmangizda shifrlangan holda saqlanadi. Server shifrlangan nusxani olishi mumkin, lekin uni to\'g\'ridan-to\'g\'ri ochib ko\'rish mumkin emas. Hech kim — hatto 24:31 jamoasi ham — sizning yuzingizni ko\'ra olmaydi.',
  },
  {
    title: '3. Ma\'lumotlar nima uchun ishlatiladi',
    body: 'Virtual primerka yaratish, mos tavsiyalar berish, buyurtmalarni qayta ishlash, aloqa (bildirishnomalar) va xizmat sifatini yaxshilash uchun.',
  },
  {
    title: '4. Uchinchi tomonlar',
    body: 'Shaxsiy ma\'lumotlaringiz uchinchi tomonlarga sotilmaydi. Faqat buyurtma yetkazib berish uchun kerakli ma\'lumotlar (ism, manzil, telefon) sotuvchi do\'konga uzatiladi.',
  },
  {
    title: '5. Ma\'lumotlar xavfsizligi',
    body: 'Hamma parollar bcrypt bilan hashlanadi. Yuz ma\'lumotlari AES-256 shifrlash bilan himoyalanadi. Server bilan aloqa HTTPS orqali amalga oshiriladi.',
  },
  {
    title: '6. Sizning huquqlaringiz',
    body: 'Ma\'lumotlaringizni ko\'rish, o\'zgartirish yoki o\'chirish huquqingiz bor. Hisobni o\'chirish uchun sozlamalardan foydalaning yoki support@24-31.app ga yozing.',
  },
  {
    title: '7. Cookies va analitika',
    body: 'Ilova faqat anonim foydalanish statistikasini yig\'adi (qaysi ekranlar ochildi, xatolar). Reklama izlab yurgichlari ishlatilmaydi.',
  },
  {
    title: '8. Yosh chegarasi',
    body: 'Ilova 13 yoshdan katta foydalanuvchilar uchun. Yoshi kichikroq bolalardan ma\'lumot ongli ravishda yig\'ilmaydi.',
  },
  {
    title: '9. Siyosatdagi o\'zgarishlar',
    body: 'Ushbu siyosat o\'zgartirilishi mumkin. Muhim o\'zgarishlar haqida ilova orqali xabar beriladi.',
  },
  {
    title: '10. Aloqa',
    body: 'Maxfiylik bo\'yicha savollar: privacy@24-31.app',
  },
];

const SECTIONS_RU: Section[] = [
  {
    title: '1. Какие данные собираются',
    body: 'Имя, фамилия, номер телефона, пароль (зашифрованный), рост и вес (по желанию), сканер лица (хранится в зашифрованном виде на вашем устройстве), выбранные магазины и история заказов.',
  },
  {
    title: '2. Данные лица',
    body: 'Изображение лица хранится только в зашифрованном виде на вашем устройстве. Сервер может получить зашифрованную копию, но не может напрямую её открыть. Никто — даже команда 24:31 — не может увидеть ваше лицо.',
  },
  {
    title: '3. Для чего используются данные',
    body: 'Для создания виртуальной примерки, персональных рекомендаций, обработки заказов, связи (уведомления) и улучшения качества сервиса.',
  },
  {
    title: '4. Третьи стороны',
    body: 'Ваши личные данные не продаются третьим сторонам. Только данные, необходимые для доставки заказа (имя, адрес, телефон), передаются магазину-продавцу.',
  },
  {
    title: '5. Безопасность данных',
    body: 'Все пароли хэшируются с помощью bcrypt. Данные лица защищены шифрованием AES-256. Связь с сервером осуществляется через HTTPS.',
  },
  {
    title: '6. Ваши права',
    body: 'Вы имеете право просматривать, изменять или удалять ваши данные. Для удаления аккаунта используйте настройки или напишите на support@24-31.app.',
  },
  {
    title: '7. Cookies и аналитика',
    body: 'Приложение собирает только анонимную статистику использования (какие экраны открывались, ошибки). Рекламные трекеры не используются.',
  },
  {
    title: '8. Возрастное ограничение',
    body: 'Приложение для пользователей старше 13 лет. Данные от детей младшего возраста сознательно не собираются.',
  },
  {
    title: '9. Изменения политики',
    body: 'Эта политика может быть изменена. О важных изменениях будет сообщено через приложение.',
  },
  {
    title: '10. Связь',
    body: 'Вопросы по конфиденциальности: privacy@24-31.app',
  },
];

export default function PrivacyScreen() {
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
            {isRu ? 'Политика конфиденциальности' : 'Maxfiylik siyosati'}
          </RNText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Lead card: privacy promise */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
              backgroundColor: `${colors.olive}14`,
              borderWidth: 1,
              borderColor: `${colors.olive}33`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 22,
            }}
          >
            <View
              style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: colors.oliveDeep,
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Svg width={18} height={18} fill="none" stroke={colors.goldSoft} strokeWidth={1.8}>
                <Rect x={3} y={8} width={12} height={8} rx={2} />
                <Path d="M5.5 8V5.5a3.5 3.5 0 017 0V8" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 13, fontWeight: '600',
                  color: colors.oliveDeep, marginBottom: 2,
                }}
              >
                {isRu ? 'Ваше лицо принадлежит вам' : 'Yuzingiz — faqat sizniki'}
              </RNText>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 12, lineHeight: 17,
                  color: colors.muted,
                }}
              >
                {isRu
                  ? 'Данные лица хранятся на вашем устройстве в зашифрованном виде. Мы не продаём данные.'
                  : 'Yuz ma\'lumotlari qurilmangizda shifrlangan holda saqlanadi. Biz ma\'lumotlarni sotmaymiz.'}
              </RNText>
            </View>
          </View>

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
