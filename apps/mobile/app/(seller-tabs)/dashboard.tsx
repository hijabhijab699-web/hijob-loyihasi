import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { api } from '../../src/api/client';

interface SellerStats {
  totalProducts: number;
  activeOrders: number;
  revenue: number;
  tryOnCount: number;
}

type OrderStatus = 'new' | 'preparing' | 'shipping' | 'delivered';

interface RecentOrder {
  id: string;
  code: string;
  customerName: string;
  time: string;
  status: OrderStatus;
  total: number;
  items: Array<{ name: string; qty: number; imageUrl?: string | null }>;
}

const STATUS_BADGES: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  new: { label: 'Yangi', bg: 'rgba(217,162,75,0.12)', color: '#D9A24B' },
  preparing: { label: 'Tayyorlanmoqda', bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B' },
  shipping: { label: "Yo'lda", bg: 'rgba(95,122,148,0.12)', color: '#5F7A94' },
  delivered: { label: 'Yetkazildi', bg: 'rgba(54,57,36,0.08)', color: '#363924' },
};

// Zero-state stats so the dashboard can render while /seller/stats loads
// or during a network outage. Real values replace this once the query lands.
const EMPTY_STATS: SellerStats = {
  totalProducts: 0,
  activeOrders: 0,
  revenue: 0,
  tryOnCount: 0,
};

interface SellerProductPreview {
  id: string;
  titleRu: string;
  titleUz: string | null;
  basePriceUsd: number;
  coverUrl: string | null;
}

const PLACEHOLDER_BG = ['#EDE5D0', '#D9D0BE'];

export default function SellerDashboard() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const lang = (i18n.language?.slice(0, 2) ?? 'uz') as 'uz' | 'ru' | 'en' | 'ar';
  // Shared helper for 4-language inline strings that aren't worth a key.
  const L = (uz: string, ru: string, en: string, ar: string) =>
    ({ uz, ru, en, ar }[lang] ?? uz);
  const qc = useQueryClient();

  const { data: stats } = useQuery<SellerStats>({
    queryKey: ['seller', 'stats'],
    queryFn: async () => (await api.get('/seller/stats')).data,
    staleTime: 30_000,
  });

  // Preview of the 3 most recent orders; the dedicated Orders tab shows the
  // full list from the same endpoint.
  const { data: recentOrders } = useQuery<RecentOrder[]>({
    queryKey: ['seller', 'orders', 'recent'],
    queryFn: async () => (await api.get<RecentOrder[]>('/seller/orders')).data.slice(0, 3),
    staleTime: 30_000,
  });

  // Seller's own first 2 products for the "Top mahsulotlar" strip; this
  // replaces the hard-coded placeholder names that showed stock titles even
  // for brand-new sellers.
  const { data: topProducts } = useQuery<SellerProductPreview[]>({
    queryKey: ['seller', 'products', 'top'],
    queryFn: async () => (await api.get<SellerProductPreview[]>('/seller/products')).data.slice(0, 2),
    staleTime: 30_000,
  });

  const s = stats ?? EMPTY_STATS;
  const revenue = s.revenue >= 1000 ? `$${(s.revenue / 1000).toFixed(1)}k` : `$${s.revenue}`;

  const STAT_CARDS: Array<{
    label: string;
    value: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    iconColor: string;
    iconBg: string;
    route?: string;
  }> = [
    {
      label: L('Mahsulotlar', 'Товары', 'Products', 'المنتجات'),
      value: String(s.totalProducts),
      icon: 'grid-outline',
      iconColor: colors.oliveDeep,
      iconBg: 'rgba(54,57,36,0.08)',
      route: '/(seller-tabs)/products',
    },
    {
      label: L('Buyurtmalar', 'Заказы', 'Orders', 'الطلبات'),
      value: String(s.activeOrders),
      icon: 'cube-outline',
      iconColor: '#A88848',
      iconBg: 'rgba(201,169,110,0.15)',
      route: '/(seller-tabs)/orders',
    },
    {
      label: L('Daromad', 'Доход', 'Revenue', 'الإيرادات'),
      value: revenue,
      icon: 'trending-up-outline',
      iconColor: '#7A8A5B',
      iconBg: 'rgba(122,138,91,0.12)',
      route: '/(seller-tabs)/analytics',
    },
    {
      label: L('Primerka', 'Примерки', 'Try-ons', 'التجارب'),
      value: String(s.tryOnCount),
      icon: 'body-outline',
      iconColor: colors.oliveDeep,
      iconBg: 'rgba(54,57,36,0.08)',
      route: '/(seller-tabs)/analytics',
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['seller'] });
            }}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <View>
            <Text
              variant="displayLarge"
              color="oliveDeep"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 26,
                fontWeight: '700',
              }}
            >
              {L('Bosh sahifa', 'Главная', 'Home', 'الرئيسية')}
            </Text>
            <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
              {L("Do'koningiz holati", 'Состояние вашего магазина', 'Your shop status', 'حالة متجرك')}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(seller-tabs)/profile')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.goldSoft} />
          </Pressable>
        </View>

        {/* Stat Cards Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          {STAT_CARDS.map((card) => (
            <Pressable
              key={card.label}
              onPress={() => card.route && router.push(card.route as any)}
              style={({ pressed }) => ({
                width: '47%',
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.rule,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View>
                  <Text
                    variant="caption"
                    color="muted"
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {card.label}
                  </Text>
                  <Text
                    variant="displayLarge"
                    color="oliveDeep"
                    style={{
                      fontFamily: theme.fontFamilies.display,
                      fontSize: 32,
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    {card.value}
                  </Text>
                </View>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: card.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={card.icon} size={18} color={card.iconColor} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <Text
            variant="bodySmall"
            color="oliveDeep"
            style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}
          >
            {L('Tezkor amallar', 'Быстрые действия', 'Quick actions', 'إجراءات سريعة')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/seller/add-product' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: colors.oliveDeep,
                borderRadius: 12,
              }}
            >
              <Ionicons name="add" size={22} color={colors.goldSoft} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.goldSoft }}
              >
                {L('Yangi mahsulot', 'Новый товар', 'New product', 'منتج جديد')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(seller-tabs)/orders' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: colors.surface2,
                borderRadius: 12,
                borderWidth: scheme === 'dark' ? 1 : 0,
                borderColor: colors.rule,
              }}
            >
              <Ionicons name="cube-outline" size={22} color={colors.ink} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.ink }}
              >
                {L('Buyurtmalar', 'Заказы', 'Orders', 'الطلبات')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(seller-tabs)/analytics' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: colors.surface2,
                borderRadius: 12,
                borderWidth: scheme === 'dark' ? 1 : 0,
                borderColor: colors.rule,
              }}
            >
              <Ionicons name="bar-chart-outline" size={22} color={colors.ink} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.ink }}
              >
                {L('Statistika', 'Статистика', 'Analytics', 'الإحصاءات')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Orders */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              {L("So'nggi buyurtmalar", 'Последние заказы', 'Latest orders', 'أحدث الطلبات')}
            </Text>
            <Pressable onPress={() => router.push('/(seller-tabs)/orders' as any)}>
              <Text variant="bodySmall" style={{ fontSize: 12, color: colors.gold }}>
                {L('Barchasi →', 'Все →', 'All →', 'الكل ←')}
              </Text>
            </Pressable>
          </View>
          <View style={{ gap: 10 }}>
            {(recentOrders && recentOrders.length > 0) ? recentOrders.map((order) => {
              const badge = STATUS_BADGES[order.status];
              const firstItem = order.items[0];
              const subtitle = firstItem
                ? `${firstItem.qty} dona · ${new Date(order.time).toLocaleDateString()}`
                : new Date(order.time).toLocaleDateString();
              return (
                <View
                  key={order.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 10,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 10,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: colors.surface2,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="bodySmall"
                      color="ink"
                      style={{ fontSize: 13, fontWeight: '500' }}
                      numberOfLines={1}
                    >
                      {firstItem?.name ?? order.customerName}
                    </Text>
                    <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                      {subtitle}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: badge.bg,
                      borderRadius: 20,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ fontSize: 11, fontWeight: '500', color: badge.color }}
                    >
                      {badge.label}
                    </Text>
                  </View>
                </View>
              );
            }) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                  {L("Hali buyurtmalar yo'q", 'Пока нет заказов', 'No orders yet', 'لا توجد طلبات بعد')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Products */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              {L('Top mahsulotlar', 'Топ товары', 'Top products', 'المنتجات الأعلى')}
            </Text>
            <Pressable onPress={() => router.push('/(seller-tabs)/products' as any)}>
              <Text variant="bodySmall" style={{ fontSize: 12, color: colors.gold }}>
                {L('Barchasi →', 'Все →', 'All →', 'الكل ←')}
              </Text>
            </Pressable>
          </View>
          {(topProducts && topProducts.length > 0) ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {topProducts.map((prod, i) => (
                <Pressable
                  key={prod.id}
                  onPress={() => router.push(`/seller/product/${prod.id}` as any)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: 100,
                      backgroundColor: PLACEHOLDER_BG[i % PLACEHOLDER_BG.length],
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {prod.coverUrl ? (
                      <Image source={{ uri: prod.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="ribbon-outline" size={32} color="rgba(255,255,255,0.3)" />
                    )}
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text variant="caption" color="muted" style={{ fontSize: 12 }} numberOfLines={1}>
                      {prod.titleRu || prod.titleUz || "Nomsiz"}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="oliveDeep"
                      style={{
                        fontFamily: theme.fontFamilies.display,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      ${prod.basePriceUsd.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                {L("Hali mahsulot qo'shilmagan", 'Товары ещё не добавлены', 'No products yet', 'لا توجد منتجات بعد')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
