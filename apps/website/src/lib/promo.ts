export type PromoKind = 'percent' | 'fixed' | 'shipping';

export interface PromoCode {
  code: string;
  kind: PromoKind;
  value: number;
  minSubtotal?: number;
  description: string;
}

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'HIJOB10',
    kind: 'percent',
    value: 10,
    description: "Birinchi xaridga 10% chegirma",
  },
  {
    code: 'YANGI15',
    kind: 'percent',
    value: 15,
    minSubtotal: 300000,
    description: "300 000 so'mdan ortiq buyurtmaga 15%",
  },
  {
    code: 'TEZKOR',
    kind: 'shipping',
    value: 0,
    description: "Bepul yetkazib berish",
  },
  {
    code: 'HAFTA50',
    kind: 'fixed',
    value: 50000,
    minSubtotal: 250000,
    description: "250 000 so'mdan 50 000 chegirma",
  },
];

export interface PromoResult {
  code: string;
  discount: number;
  freeShipping: boolean;
  description: string;
}

export function applyPromo(
  code: string,
  subtotal: number,
): PromoResult | { error: string } {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { error: "Kodni kiriting" };
  const promo = PROMO_CODES.find((p) => p.code === trimmed);
  if (!promo) return { error: "Bunday promo-kod topilmadi" };
  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    return {
      error: `Minimal buyurtma summasi: ${promo.minSubtotal.toLocaleString('ru-RU')} so'm`,
    };
  }
  let discount = 0;
  let freeShipping = false;
  if (promo.kind === 'percent') {
    discount = Math.round((subtotal * promo.value) / 100);
  } else if (promo.kind === 'fixed') {
    discount = Math.min(promo.value, subtotal);
  } else if (promo.kind === 'shipping') {
    freeShipping = true;
  }
  return {
    code: promo.code,
    discount,
    freeShipping,
    description: promo.description,
  };
}
