import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

interface HomeFeed {
  stores: Array<{ id: string; brandName: string; logoUrl: string | null }>;
  categories: Array<{ id: string; nameRu: string; nameUz: string; iconUrl: string | null }>;
  newArrivals: Array<{
    id: string;
    title: { ru: string };
    basePriceUsd: number;
    coverUrl: string;
    variants: Array<{ id: string }>;
  }>;
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();

  const { data } = useQuery<HomeFeed>({
    queryKey: ['home'],
    queryFn: async () => (await api.get('/catalog/home')).data,
  });

  return (
    <Screen gradient>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Pressable hitSlop={12}>
            <Ionicons name="menu-outline" size={28} color={colors.ink} />
          </Pressable>
          <Logo size={70} label={false} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: theme.radii.pill,
              backgroundColor: colors.surfaceGlass,
              borderWidth: 1,
              borderColor: colors.rule,
            }}
          >
            <Ionicons name="globe-outline" size={16} color={colors.ink} />
            <Text variant="caption" color="ink">
              {i18n.language === 'ru' ? 'Русский' : 'O\'zbekcha'}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <View
          style={{
            paddingHorizontal: 20,
            marginTop: 8,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 14,
          }}
        >
          <Ionicons name="search-outline" size={22} color={colors.ink} />
          <Ionicons name="heart-outline" size={22} color={colors.ink} />
          <View>
            <Ionicons name="bag-outline" size={22} color={colors.ink} />
          </View>
        </View>

        {/* Stores */}
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Text variant="displayMedium" color="oliveDeep">
              {t('home.stores')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text variant="bodySmall" color="oliveDeep">
                {t('home.allStores')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.oliveDeep} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}
          >
            {(data?.stores ?? []).map((store, idx) => (
              <View key={store.id} style={{ alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: idx === 2 ? 110 : 76,
                    height: idx === 2 ? 110 : 76,
                    borderRadius: idx === 2 ? 55 : 38,
                    backgroundColor: colors.surface,
                    borderWidth: idx === 2 ? 2 : 1,
                    borderColor: idx === 2 ? colors.gold : colors.rule,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    variant="titleSmall"
                    color="oliveDeep"
                    style={{ fontFamily: theme.fontFamilies.display }}
                  >
                    {store.brandName.slice(0, 4).toUpperCase()}
                  </Text>
                </View>
                {idx === 2 && (
                  <Text variant="caption" color="ink" style={{ fontWeight: '600' }}>
                    {store.brandName}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            padding: 12,
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {(
            [
              { id: 'scarves', icon: 'shirt-outline' as const },
              { id: 'dresses', icon: 'woman-outline' as const },
              { id: 'bags', icon: 'briefcase-outline' as const },
              { id: 'accessories', icon: 'diamond-outline' as const },
            ] as const
          ).map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.id } })}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: theme.radii.md,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: colors.rule,
              }}
            >
              <Ionicons name={cat.icon} size={28} color={colors.oliveDark} />
              <Text variant="caption" color="ink">
                {t(`home.categories.${cat.id}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* New Arrivals */}
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Text variant="displayMedium" color="oliveDeep">
              {t('home.newArrivals')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text variant="bodySmall" color="oliveDeep">
                {t('common.seeAll')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.oliveDeep} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 14 }}
          >
            {(data?.newArrivals ?? []).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                style={{
                  width: 180,
                  backgroundColor: colors.surface,
                  borderRadius: theme.radii.lg,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.rule,
                }}
              >
                <View style={{ height: 220, backgroundColor: colors.surfaceAlt, position: 'relative' }}>
                  <Image
                    source={{ uri: p.coverUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.surfaceGlass,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="heart-outline" size={18} color={colors.ink} />
                  </View>
                </View>
                <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {p.title.ru}
                    </Text>
                    <Text variant="titleSmall" color="ink" style={{ marginTop: 2 }}>
                      ${p.basePriceUsd}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.goldSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="bag-add-outline" size={16} color={colors.ink} />
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}
