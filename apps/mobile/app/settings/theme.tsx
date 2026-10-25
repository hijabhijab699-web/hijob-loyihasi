import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { safeBack } from '../../src/lib/safe-back';

type Pref = 'light' | 'dark' | 'system';

export default function ThemeSettingsScreen() {
  const { colors, theme, scheme, preference, setPreference } = useTheme();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const options: Array<{
    key: Pref;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    labelUz: string;
    labelRu: string;
    descUz: string;
    descRu: string;
  }> = [
    {
      key: 'system',
      icon: 'phone-portrait-outline',
      labelUz: 'Avtomatik',
      labelRu: 'Автоматически',
      descUz: 'Telefon tizimiga mos ravishda',
      descRu: 'По настройкам системы',
    },
    {
      key: 'light',
      icon: 'sunny-outline',
      labelUz: 'Yorug\'',
      labelRu: 'Светлая',
      descUz: 'Krem fon · doim yorug\'',
      descRu: 'Кремовый фон · всегда светлая',
    },
    {
      key: 'dark',
      icon: 'moon-outline',
      labelUz: 'Qorong\'u',
      labelRu: 'Тёмная',
      descUz: 'To\'q fon · ko\'z charchamaydi',
      descRu: 'Тёмный фон · легче глазам',
    },
  ];

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
          {isRu ? 'Внешний вид' : 'Ko\'rinish'}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
          {isRu ? 'Тема' : 'Mavzu'}
        </Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.rule, overflow: 'hidden' }}>
          {options.map((opt, i) => {
            const selected = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setPreference(opt.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  padding: 16, paddingHorizontal: 18,
                  borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: colors.rule,
                  backgroundColor: selected ? 'rgba(54,57,36,0.04)' : 'transparent',
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: selected ? colors.oliveDeep : colors.surface2,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={opt.icon} size={20} color={selected ? colors.goldSoft : colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" color="ink" style={{ fontWeight: '600', fontSize: 14 }}>
                    {isRu ? opt.labelRu : opt.labelUz}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {isRu ? opt.descRu : opt.descUz}
                  </Text>
                </View>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? colors.oliveDeep : colors.rule,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.oliveDeep }} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule }}>
          <Text variant="caption" color="muted" style={{ fontSize: 12, lineHeight: 18 }}>
            {isRu
              ? `Сейчас активна ${scheme === 'dark' ? 'тёмная' : 'светлая'} тема${preference === 'system' ? ' (по системе)' : ''}.`
              : `Hozir ${scheme === 'dark' ? 'qorong\'u' : 'yorug\''} mavzu faol${preference === 'system' ? ' (tizim bo\'yicha)' : ''}.`}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
