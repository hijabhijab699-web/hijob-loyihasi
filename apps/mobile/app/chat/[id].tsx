import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { safeBack } from '../../src/lib/safe-back';

interface Message {
  id: string;
  kind: 'text' | 'product' | 'payment_link' | 'receipt';
  body: string;
  payload: Record<string, unknown> | null;
  senderId: string;
  mine: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function ChatScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const messagesQ = useQuery<Message[]>({
    queryKey: ['chat', id, 'messages'],
    queryFn: async () => (await api.get<Message[]>(`/chats/${id}/messages`)).data,
    enabled: !!id,
    refetchInterval: 5000,
  });

  const send = useMutation({
    mutationFn: async (body: string) => {
      const res = await api.post(`/chats/${id}/messages`, { body });
      return res.data;
    },
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['chat', id, 'messages'] });
      qc.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  useEffect(() => {
    if ((messagesQ.data?.length ?? 0) > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messagesQ.data?.length]);

  const messages = messagesQ.data ?? [];

  return (
    <Screen>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.rule }}>
        <Pressable
          onPress={() => safeBack()}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="body" color="ink" style={{ fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
            {isRu ? 'Чат' : 'Suhbat'}
          </Text>
        </View>
      </View>

      {messagesQ.isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}
          renderItem={({ item }) => (
            <View style={{
              alignSelf: item.mine ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: item.mine ? colors.oliveDeep : colors.surface,
              borderWidth: item.mine ? 0 : 1,
              borderColor: colors.rule,
            }}>
              <Text variant="body" style={{ color: item.mine ? colors.goldSoft : colors.ink, fontSize: 14, lineHeight: 20 }}>
                {item.body}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' }}>
                <Text variant="caption" style={{ fontSize: 10, color: item.mine ? 'rgba(245,241,232,0.6)' : colors.muted }}>
                  {new Date(item.createdAt).toLocaleTimeString(isRu ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {item.mine && (
                  <Ionicons
                    name={item.readAt ? 'checkmark-done' : 'checkmark'}
                    size={12}
                    color={item.readAt ? colors.gold : 'rgba(245,241,232,0.6)'}
                  />
                )}
              </View>
            </View>
          )}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={{
          flexDirection: 'row', alignItems: 'flex-end',
          paddingHorizontal: 12, paddingVertical: 10, gap: 8,
          borderTopWidth: 1, borderTopColor: colors.rule,
          backgroundColor: colors.surface,
        }}>
          <View style={{
            flex: 1,
            minHeight: 42,
            maxHeight: 120,
            backgroundColor: colors.surface2,
            borderRadius: 21,
            paddingHorizontal: 16,
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.rule,
          }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={isRu ? 'Напишите сообщение…' : 'Xabar yozing…'}
              placeholderTextColor={colors.muted}
              multiline
              style={{ fontSize: 14, color: colors.ink, paddingVertical: 10, maxHeight: 100 }}
            />
          </View>
          <Pressable
            onPress={() => text.trim() && send.mutate(text.trim())}
            disabled={!text.trim() || send.isPending}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: text.trim() && !send.isPending ? colors.oliveDeep : colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {send.isPending ? (
              <ActivityIndicator color={colors.goldSoft} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color={colors.goldSoft} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
