import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

interface Variant {
  color: string;
  colorHex: string;
  sizes: string;
  stock: number;
}

const MOCK_VARIANTS: Variant[] = [
  { color: 'Qizil', colorHex: '#B85450', sizes: 'S, M, L, XL', stock: 20 },
  { color: 'Qora', colorHex: '#2A2820', sizes: 'S, M, L', stock: 15 },
];

export default function AddProductScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();

  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [variants] = useState<Variant[]>(MOCK_VARIANTS);

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/seller/products', { nameUz, nameRu, description, price });
    },
    onSuccess: () => {
      Alert.alert('Saqlandi', "Mahsulot muvaffaqiyatli qo'shildi");
      router.back();
    },
  });

  const inputStyle = {
    width: '100%' as const,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 10,
    fontSize: 14,
    color: colors.ink,
  };

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.rule,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <Text
          variant="displayLarge"
          color="oliveDeep"
          style={{
            fontFamily: theme.fontFamilies.display,
            fontSize: 22,
            fontWeight: '700',
          }}
        >
          Yangi mahsulot
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <Text
            variant="bodySmall"
            color="oliveDeep"
            style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}
          >
            Rasmlar
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Main image placeholder */}
            <Pressable
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: colors.rule,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="image-outline" size={28} color={colors.muted} />
              <Text variant="caption" color="muted" style={{ fontSize: 10 }}>
                Asosiy
              </Text>
            </Pressable>
            {/* Additional slots */}
            {[1, 2].map((i) => (
              <Pressable
                key={i}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: colors.rule,
                  backgroundColor: colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={24} color={colors.rule} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.rule,
            gap: 14,
          }}
        >
          <Text
            variant="bodySmall"
            color="oliveDeep"
            style={{ fontSize: 13, fontWeight: '600' }}
          >
            Asosiy ma'lumot
          </Text>

          {/* Name Uz */}
          <View>
            <Text variant="caption" color="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Nomi (o'zbekcha)
            </Text>
            <TextInput
              value={nameUz}
              onChangeText={setNameUz}
              placeholder="Masalan: Ipak ro'mol Premium"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
          </View>

          {/* Name Ru */}
          <View>
            <Text variant="caption" color="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Nomi (ruscha)
            </Text>
            <TextInput
              value={nameRu}
              onChangeText={setNameRu}
              placeholder="Например: Шёлковый платок Премиум"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
          </View>

          {/* Description */}
          <View>
            <Text variant="caption" color="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              Tavsif
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Mahsulot haqida batafsil..."
              placeholderTextColor={colors.muted}
              multiline
              style={{
                ...inputStyle,
                minHeight: 72,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Category + Price row */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Kategoriya
              </Text>
              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.rule,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text variant="bodySmall" color="ink" style={{ fontSize: 14 }}>
                  Ro'mollar
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Narx (USD)
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="$0.00"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
          </View>
        </View>

        {/* Variants */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.rule,
            gap: 14,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              Variantlar
            </Text>
            <Pressable>
              <Text variant="bodySmall" style={{ fontSize: 12, fontWeight: '500', color: colors.gold }}>
                + Qo'shish
              </Text>
            </Pressable>
          </View>

          {variants.map((v) => (
            <View
              key={v.color}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: colors.surfaceAlt,
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: v.colorHex,
                  flexShrink: 0,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ fontSize: 13, fontWeight: '500' }}
                >
                  {v.color}
                </Text>
                <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                  {v.sizes} · Zaxira: {v.stock}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.muted} />
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={() => submit.mutate()}
          style={({ pressed }) => ({
            backgroundColor: colors.oliveDeep,
            borderRadius: 14,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Ionicons name="checkmark" size={18} color={colors.goldSoft} />
          <Text
            variant="body"
            style={{ fontSize: 15, fontWeight: '600', color: colors.goldSoft }}
          >
            Saqlash
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
