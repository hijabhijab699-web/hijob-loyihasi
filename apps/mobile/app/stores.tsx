import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Screen } from '../src/components/Screen';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';
import { api } from '../src/api/client';
import { safeBack } from '../src/lib/safe-back';

interface Store {
  id: string;
  brandName: string;
  logoUrl: string | null;
  description: string | null;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  isTop: boolean;
  isPremium: boolean;
  country: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
  distanceKm: number | null;
}

interface Options {
  countries: string[];
  cities: string[];
  districts: string[];
}

export default function StoresScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const [q, setQ] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [filterOpen, setFilterOpen] = useState<null | 'country' | 'city' | 'district'>(null);

  const { data: options } = useQuery<Options>({
    queryKey: ['store-filter-options'],
    queryFn: async () => (await api.get<Options>('/catalog/stores/filters/options')).data,
  });

  const { data: stores = [], isLoading, refetch } = useQuery<Store[]>({
    queryKey: ['stores', { q, country, city, district, coords, radiusKm }],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (q.trim().length >= 2) params.q = q.trim();
      if (country) params.country = country;
      if (city) params.city = city;
      if (district) params.district = district;
      if (coords) {
        params.latitude = coords.lat;
        params.longitude = coords.lng;
        params.radiusKm = radiusKm;
      }
      return (await api.get<Store[]>('/catalog/stores', { params })).data;
    },
  });

  const clearFilters = () => {
    setCountry(null);
    setCity(null);
    setDistrict(null);
    setCoords(null);
    setQ('');
  };

  const activeCount =
    (country ? 1 : 0) + (city ? 1 : 0) + (district ? 1 : 0) + (coords ? 1 : 0);

  async function useMyLocation() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        isRu ? 'Разрешение нужно' : 'Ruxsat kerak',
        isRu ? 'Включите геолокацию, чтобы увидеть ближайшие магазины' : "Yaqin do'konlarni ko'rish uchun lokatsiyaga ruxsat bering",
      );
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
  }

  const openOptions: string[] = useMemo(() => {
    if (filterOpen === 'country') return options?.countries ?? [];
    if (filterOpen === 'city') return options?.cities ?? [];
    if (filterOpen === 'district') return options?.districts ?? [];
    return [];
  }, [filterOpen, options]);

  function pickOption(v: string | null) {
    if (filterOpen === 'country') setCountry(v);
    if (filterOpen === 'city') setCity(v);
    if (filterOpen === 'district') setDistrict(v);
    setFilterOpen(null);
  }

  return (
    <Screen>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => safeBack()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.ink} />
        </Pressable>
        <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
          {isRu ? 'Магазины' : "Do'konlar"}
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, height: 46 }}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={isRu ? 'Поиск магазина…' : "Do'kon qidirish…"}
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 14, color: colors.ink }}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}>
        <FilterChip
          label={coords ? (isRu ? `${radiusKm} км вокруг` : `${radiusKm} km atrofida`) : (isRu ? 'Рядом' : 'Yaqin atrofda')}
          icon="location"
          active={!!coords}
          onPress={coords ? () => setCoords(null) : useMyLocation}
          colors={colors}
        />
        <FilterChip
          label={country ?? (isRu ? 'Страна' : 'Davlat')}
          icon="globe-outline"
          active={!!country}
          onPress={() => setFilterOpen('country')}
          colors={colors}
        />
        <FilterChip
          label={city ?? (isRu ? 'Город' : 'Shahar')}
          icon="business-outline"
          active={!!city}
          onPress={() => setFilterOpen('city')}
          colors={colors}
        />
        <FilterChip
          label={district ?? (isRu ? 'Район' : 'Tuman')}
          icon="map-outline"
          active={!!district}
          onPress={() => setFilterOpen('district')}
          colors={colors}
        />
        {activeCount > 0 && (
          <FilterChip
            label={isRu ? 'Сбросить' : 'Tozalash'}
            icon="close"
            active={false}
            onPress={clearFilters}
            colors={colors}
            variant="danger"
          />
        )}
      </ScrollView>

      {/* Stores list */}
      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      ) : stores.length === 0 ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Ionicons name="storefront-outline" size={48} color={colors.muted} />
          <Text variant="body" color="muted" style={{ marginTop: 12, textAlign: 'center' }}>
            {isRu ? 'Магазинов не найдено' : "Hech qanday do'kon topilmadi"}
          </Text>
          {activeCount > 0 && (
            <Pressable onPress={clearFilters} style={{ marginTop: 16 }}>
              <Text variant="caption" color="gold" style={{ fontWeight: '600' }}>
                {isRu ? 'Сбросить фильтры' : 'Filtrlarni tozalash'}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <StoreCard
              store={item}
              onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
              colors={colors}
              theme={theme}
              isRu={isRu}
            />
          )}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}

      {/* Option picker */}
      <Modal visible={!!filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(null)}>
        <Pressable onPress={() => setFilterOpen(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 32, maxHeight: '70%' }}
          >
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleMedium" color="ink">
                {filterOpen === 'country' ? (isRu ? 'Страна' : 'Davlat') : filterOpen === 'city' ? (isRu ? 'Город' : 'Shahar') : (isRu ? 'Район' : 'Tuman')}
              </Text>
              <Pressable onPress={() => setFilterOpen(null)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Pressable onPress={() => pickOption(null)} style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.rule }}>
                <Text variant="body" color="muted">{isRu ? 'Все' : 'Barchasi'}</Text>
              </Pressable>
              {openOptions.map((opt) => (
                <Pressable key={opt} onPress={() => pickOption(opt)} style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.rule }}>
                  <Text variant="body" color="ink">{opt}</Text>
                </Pressable>
              ))}
              {openOptions.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text variant="caption" color="muted">
                    {isRu ? 'Нет вариантов' : "Variantlar yo'q"}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onPress,
  colors,
  variant,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
  colors: any;
  variant?: 'danger';
}) {
  const bg = variant === 'danger' ? 'rgba(220, 40, 40, 0.1)' : active ? colors.oliveDeep : colors.surface;
  const fg = variant === 'danger' ? '#DC2828' : active ? colors.goldSoft : colors.ink;
  const border = variant === 'danger' ? 'rgba(220,40,40,0.3)' : active ? colors.oliveDeep : colors.rule;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        paddingHorizontal: 14,
        height: 36,
        borderRadius: 18,
      }}
    >
      <Ionicons name={icon} size={14} color={fg} />
      <Text variant="caption" style={{ color: fg, fontWeight: '600', fontSize: 12 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function StoreCard({ store, onPress, colors, theme, isRu }: { store: Store; onPress: () => void; colors: any; theme: any; isRu: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 14,
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: store.isPremium ? colors.gold : colors.rule,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.oliveDeep,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="displayLarge" style={{ fontFamily: theme.fontFamilies.display, fontSize: 22, color: colors.goldSoft, fontWeight: '700' }}>
          {store.brandName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text variant="body" color="ink" style={{ fontSize: 15, fontWeight: '600' }}>
            {store.brandName}
          </Text>
          {store.isPremium && (
            <View style={{ backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text variant="caption" style={{ fontSize: 9, color: colors.oliveDeep, fontWeight: '700' }}>
                PREMIUM
              </Text>
            </View>
          )}
          {store.isTop && !store.isPremium && (
            <View style={{ backgroundColor: colors.oliveDeep, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text variant="caption" style={{ fontSize: 9, color: colors.goldSoft, fontWeight: '700' }}>
                TOP
              </Text>
            </View>
          )}
          {store.verified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.gold} />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Ionicons name="star" size={12} color={colors.gold} />
          <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
            {store.rating.toFixed(1)} · {store.reviewsCount}
          </Text>
        </View>
        {(store.city || store.district) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={11} color={colors.muted} />
            <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
              {[store.city, store.district].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        {store.distanceKm !== null && (
          <Text variant="caption" color="gold" style={{ fontSize: 11, fontWeight: '600', marginTop: 2 }}>
            {store.distanceKm < 1
              ? `${Math.round(store.distanceKm * 1000)} m`
              : `${store.distanceKm.toFixed(1)} km`}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ alignSelf: 'center' }} />
    </Pressable>
  );
}
