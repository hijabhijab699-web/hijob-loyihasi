import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { setLanguage } from '../../src/i18n/i18n';
import { safeBack } from '../../src/lib/safe-back';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ar', label: 'العربية', short: 'AR' },
] as const;

type Lang = (typeof LANGUAGES)[number]['code'];

export default function LanguageScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const selected = (i18n.language?.slice(0, 2) ?? 'uz') as Lang;

  return (
    <Screen>
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
          {{ uz: 'Til', ru: 'Язык', en: 'Language', ar: 'اللغة' }[selected]}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          {{ uz: 'Ilova tili', ru: 'Язык приложения', en: 'App language', ar: 'لغة التطبيق' }[selected]}
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.rule, overflow: 'hidden' }}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = selected === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => {
                  setLanguage(lang.code);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  padding: 16, paddingHorizontal: 18,
                  borderBottomWidth: i < LANGUAGES.length - 1 ? 1 : 0, borderBottomColor: colors.rule,
                  backgroundColor: isSelected ? 'rgba(54,57,36,0.03)' : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isSelected ? colors.oliveDeep : colors.surfaceGlass,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.oliveDeep : colors.rule,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: isSelected ? '#fff' : colors.ink,
                      letterSpacing: 0.5,
                    }}
                  >
                    {lang.short}
                  </Text>
                </View>
                <Text variant="bodySmall" color="ink" style={{ flex: 1, fontSize: 15, fontWeight: isSelected ? '600' : '400' }}>
                  {lang.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.oliveDeep} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
