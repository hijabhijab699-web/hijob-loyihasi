'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Loader2,
  Package,
  Truck,
  Wallet,
  CreditCard,
  Tag,
  X,
} from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { useOrders } from '@/components/providers/OrdersProvider';
import { useLoyalty } from '@/components/providers/LoyaltyProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Award } from 'lucide-react';
import { checkPromo, createOrder } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

const CITIES = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  'Andijon',
  'Namangan',
  "Farg'ona",
  'Qashqadaryo',
  "Surxondaryo",
  'Jizzax',
  'Sirdaryo',
  'Xorazm',
  "Navoiy",
  "Qoraqalpog'iston",
];

const PAYMENTS: {
  key: 'cash' | 'card' | 'click' | 'payme';
  label: string;
  Icon: typeof Wallet;
  desc: string;
}[] = [
  { key: 'cash', label: 'Naqd', Icon: Wallet, desc: "Yetkazishda to'lov" },
  { key: 'card', label: 'Humo/Uzcard', Icon: CreditCard, desc: 'Plastik karta' },
  { key: 'click', label: 'Click', Icon: Wallet, desc: "Online to'lov" },
  { key: 'payme', label: 'Payme', Icon: Wallet, desc: "Online to'lov" },
];

interface PromoState {
  code: string;
  discount: number;
  freeShipping: boolean;
  description: string;
}

export default function CheckoutPage() {
  const cart = useCart();
  const ordersStore = useOrders();
  const loyalty = useLoyalty();
  const toast = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<Order['paymentMethod']>('cash');
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promo, setPromo] = useState<PromoState | null>(null);
  const [redeemPts, setRedeemPts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Order | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  const subtotal = cart.subtotal;
  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;
    if (promo?.freeShipping) return 0;
    return cart.shipping;
  }, [subtotal, promo, cart.shipping]);
  const discount = promo?.discount ?? 0;
  const maxRedeem = loyalty.maxRedeemable(subtotal);
  const pointsDiscount = Math.min(redeemPts, maxRedeem);
  const total = Math.max(0, subtotal - discount - pointsDiscount + shipping);

  if (!cart.isHydrated) {
    return (
      <section className="py-16 text-center text-ink-muted">Yuklanmoqda…</section>
    );
  }

  if (cart.items.length === 0 && !success) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-main max-w-xl text-center">
          <h1 className="font-serif text-3xl font-bold text-ink">Savat bo&apos;sh</h1>
          <p className="mt-3 text-ink-muted">
            Buyurtma berish uchun avval mahsulotlarni savatga qo&apos;shing.
          </p>
          <Link href="/katalog" className="btn-primary mt-6 inline-flex">
            Katalogga o&apos;tish
          </Link>
        </div>
      </section>
    );
  }

  const applyPromo = async () => {
    if (!promoInput.trim() || promoLoading) return;
    setPromoLoading(true);
    const res = await checkPromo(promoInput.trim(), subtotal);
    setPromoLoading(false);
    if (res.ok && res.data) {
      setPromo(res.data);
      toast.success(`Promo "${res.data.code}" qo'llandi`);
    } else {
      setPromo(null);
      toast.error(res.error ?? "Promo-kod noto'g'ri");
    }
  };

  const removePromo = () => {
    setPromo(null);
    setPromoInput('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await createOrder({
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        city,
        note: note.trim() || undefined,
      },
      items: cart.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        color: it.color,
        size: it.size,
      })),
      paymentMethod: payment,
    });
    setLoading(false);
    if (res.ok && res.data) {
      setSuccess(res.data);
      ordersStore.push({
        id: res.data.id,
        total: res.data.total,
        createdAt: res.data.createdAt,
      });
      if (pointsDiscount > 0) loyalty.redeem(pointsDiscount);
      const earned = loyalty.earn(res.data.total);
      setPointsEarned(earned);
      cart.clear();
      toast.success('Buyurtma qabul qilindi!');
    } else {
      toast.error(res.error ?? "Buyurtmani yuborib bo'lmadi");
    }
  };

  if (success) {
    return (
      <section className="py-16 md:py-24">
        <div className="container-main max-w-xl">
          <div className="card p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mt-6">
              Rahmat! Buyurtma qabul qilindi
            </h1>
            <p className="mt-3 text-ink-muted">
              Buyurtma raqami:{' '}
              <span className="font-mono text-ink">{success.id}</span>
            </p>
            <div className="mt-6 p-4 bg-bg-warm rounded-xl text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Mijoz:</span>
                <span className="font-medium">{success.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Telefon:</span>
                <span className="font-medium">{success.customer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Jami:</span>
                <span className="font-semibold text-brand">
                  {formatPrice(success.total)} so&apos;m
                </span>
              </div>
            </div>
            {pointsEarned !== null && pointsEarned > 0 && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">
                    +{formatPrice(pointsEarned)} ball qo&apos;shildi
                  </p>
                  <p className="text-sm text-amber-800 mt-0.5">
                    Keyingi xaridingizda ishlatasiz.
                  </p>
                </div>
              </div>
            )}
            <p className="mt-5 text-sm text-ink-muted">
              Operatorlarimiz tez orada sizga aloqaga chiqadi va buyurtmani tasdiqlaydi.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/buyurtma/${success.id}`}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Buyurtmani kuzatish
              </Link>
              <Link href="/katalog" className="btn-outline">
                Yana xarid qilish
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/savat" className="hover:text-brand">
            Savat
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Buyurtma</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-8">
          Buyurtma berish
        </h1>

        <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5">
                Shaxsiy ma&apos;lumotlar
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Ism *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="To'liq ism"
                  />
                </div>
                <div>
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Telefon *
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Email (ixtiyoriy)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" /> Yetkazib berish
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Shahar/viloyat *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Manzil *
                  </label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                    placeholder="Ko'cha, uy, kvartira"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-ink-muted mb-1.5">
                    Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full border border-rule rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                    placeholder="Masalan: Mo'ljal, qavat..."
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand" /> To&apos;lov usuli
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PAYMENTS.map(({ key, label, Icon, desc }) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setPayment(key)}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      payment === key
                        ? 'border-brand bg-brand/5'
                        : 'border-rule-light hover:border-rule'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mb-2 ${
                        payment === key ? 'text-brand' : 'text-ink-muted'
                      }`}
                    />
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-xl font-semibold text-ink mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand" /> Buyurtma
              </h2>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {cart.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-bg-warm shrink-0">
                      <Image
                        src={it.image}
                        alt={it.name}
                        fill
                        className="object-cover"
                        sizes="60px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink line-clamp-1">{it.name}</p>
                      <p className="text-xs text-ink-muted">
                        {it.quantity} × {formatPrice(it.price)} so&apos;m
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="mt-5 pt-5 border-t border-rule-light">
                {promo ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 rounded-lg px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="font-mono font-semibold">{promo.code}</span>
                      <span className="text-xs text-emerald-700">
                        {promo.description}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-emerald-700 hover:text-emerald-900"
                      aria-label="Promoni olib tashlash"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-ink-muted mb-1.5">
                      Promo-kod
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="HIJOB10"
                        className="flex-1 border border-rule rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="btn-outline !px-4 !py-2 text-sm disabled:opacity-60"
                      >
                        {promoLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Qo'llash"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Loyalty */}
              {loyalty.balance > 0 && (
                <div className="mt-5 pt-5 border-t border-rule-light">
                  <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span className="font-medium text-amber-900">
                        {formatPrice(loyalty.balance)} ball
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redeemPts > 0}
                        onChange={(e) =>
                          setRedeemPts(e.target.checked ? maxRedeem : 0)
                        }
                        className="w-4 h-4 accent-brand"
                      />
                      <span className="text-xs text-amber-900">
                        {redeemPts > 0 ? 'Ishlatilmoqda' : 'Ishlatish'}
                      </span>
                    </label>
                  </div>
                  {maxRedeem > 0 && (
                    <p className="text-xs text-ink-muted mt-1.5">
                      Ushbu buyurtmada maksimal: {formatPrice(maxRedeem)}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-rule-light space-y-2 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Mahsulotlar</span>
                  <span>{formatPrice(subtotal)} so&apos;m</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Chegirma</span>
                    <span>−{formatPrice(discount)} so&apos;m</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Ballar</span>
                    <span>−{formatPrice(pointsDiscount)} so&apos;m</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-muted">
                  <span>Yetkazish</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-600 font-medium">Bepul</span>
                    ) : (
                      <>{formatPrice(shipping)} so&apos;m</>
                    )}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-baseline">
                  <span className="font-medium text-ink">Jami</span>
                  <span className="font-serif text-2xl font-bold text-brand">
                    {formatPrice(total)} so&apos;m
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Buyurtmani tasdiqlash
              </button>
              <p className="mt-3 text-xs text-ink-muted text-center">
                Tasdiqlab, siz &quot;Shartlar&quot; bilan rozisiz.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}
