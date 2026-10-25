import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';
import { api } from '../src/api/client';
import { safeBack } from '../src/lib/safe-back';

interface ChatRow {
  id: string;
  role: 'buyer' | 'seller';
  partner: { id: string; kind: 'buyer' | 'seller'; name: string; avatarUrl: string | null };
  unread: number;
  lastMessage: { kind: string; body: string; createdAt: string; mine: boolean } | null;
  lastMessageAt: string;
}

export default function ChatsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const { data = [], isLoading, refetch } = useQuery<ChatRow[]>({
    queryKey: ['chats'],
    queryFn: async () => (await api.get<ChatRow[]>('/chats')).data,
    refetchInterval: 15000,
  });

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => safeBack()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.ink} />
        </Pressable>
        <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
          {isRu ? 'Сообщения' : 'Xabarlar'}
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      ) : data.length === 0 ? (
        <View style={{ padding: 48, alignItems: 'center' }}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.muted} />
          <Text variant="body" color="muted" style={{ marginTop: 12, textAlign: 'center' }}>
            {isRu ? 'Пока нет сообщений' : "Hali xabarlar yo'q"}
          </Text>
          <Text variant="caption" color="muted" style={{ marginTop: 6, textAlign: 'center', fontSize: 12 }}>
            {isRu ? 'Напишите магазину с его страницы' : "Do'kon sahifasidan xabar yuboring"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 14,
                backgroundColor: item.unread > 0 ? colors.surface : colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: item.unread > 0 ? colors.gold : colors.rule,
                marginBottom: 8,
                alignItems: 'center',
              }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.oliveDeep, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.goldSoft, fontWeight: '700', fontSize: 20, fontFamily: theme.fontFamilies.display }}>
                  {(item.partner.name || '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="body" color="ink" numberOfLines={1} style={{ fontWeight: '600', fontSize: 14 }}>
                    {item.partner.name}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                    {timeAgo(item.lastMessageAt, isRu)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text variant="caption" color="muted" numberOfLines={1} style={{ flex: 1, fontSize: 13 }}>
                    {item.lastMessage
                      ? `${item.lastMessage.mine ? (isRu ? 'Вы: ' : 'Siz: ') : ''}${item.lastMessage.body}`
                      : (isRu ? 'Нет сообщений' : 'Xabar yo\'q')}
                  </Text>
                  {item.unread > 0 && (
                    <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 11, color: colors.oliveDeep, fontWeight: '800' }}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function timeAgo(iso: string, isRu: boolean) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isRu ? 'сейчас' : 'hozir';
  if (mins < 60) return `${mins} ${isRu ? 'мин' : 'daq'}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${isRu ? 'ч' : 'soat'}`;
  const d = Math.floor(hrs / 24);
  return `${d} ${isRu ? 'д' : 'kun'}`;
}
