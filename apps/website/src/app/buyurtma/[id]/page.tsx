'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { fetchOrder } from '@/lib/api-client';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';

const STATUS_STEPS: {
  key: Order['status'];
  label: string;
  Icon: typeof Clock;
}[] = [
  { key: 'pending', label: 'Qabul qilindi', Icon: Clock },
  { key: 'confirmed', label: 'Tasdiqlandi', Icon: CheckCircle2 },
  { key: 'shipped', label: 'Yoʻlda', Icon: Truck },
  { key: 'delivered', label: 'Yetkazildi', Icon: Package },
];

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      setLoading(true);
      const res = await fetchOrder(params.id);
      if (res.ok && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error ?? "Buyurtma topilmadi");
      }
      setLoading(false);
    })();
  }, [params?.id]);

  if (loading) {
    return (
      <section className="py-20 text-center text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin inline-block" />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="py-20">
        <div className="container-main max-w-xl text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 mx-auto flex items-center justify-center">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink mt-5">
            Buyurtma topilmadi
          </h1>
          <p className="mt-3 text-ink-muted">{error ?? "ID ni tekshirib qayta urinib ko'ring."}</p>
          <Link href="/katalog" className="btn-primary mt-6 inline-flex">
            Katalogga o&apos;tish
          </Link>
        </div>
      </section>
    );
  }

  const currentStatusIndex = order.status === 'cancelled'
    ? -1
    : STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <section className="py-10 md:py-14">
      <div className="container-main max-w-3xl">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <Link href="/buyurtmalarim" className="hover:text-brand">
            Buyurtmalarim
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-mono text-xs">{order.id}</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
          Buyurtma
        </h1>
        <p className="text-ink-muted mt-2">
          <span className="font-mono text-xs">{order.id}</span> ·{' '}
          {new Date(order.createdAt).toLocaleString('uz-UZ')}
        </p>

        {/* Status timeline */}
        <div className="mt-8 card p-6">
          {order.status === 'cancelled' ? (
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Bekor qilingan</p>
                <p className="text-sm text-ink-muted">Operator bilan bogʻlaning</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between relative">
              <div
                className="absolute top-5 left-5 right-5 h-0.5 bg-rule-light"
                aria-hidden
              />
              <div
                className="absolute top-5 left-5 h-0.5 bg-brand transition-all"
                aria-hidden
                style={{
                  width:
                    currentStatusIndex <= 0
                      ? '0%'
                      : `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                  maxWidth: 'calc(100% - 2.5rem)',
                }}
              />
              {STATUS_STEPS.map((s, i) => {
                const Icon = s.Icon;
                const active = i <= currentStatusIndex;
                return (
                  <div
                    key={s.key}
                    className="relative flex flex-col items-center gap-2 z-10"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        active
                          ? 'bg-brand text-white'
                          : 'bg-bg-warm text-ink-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs text-center ${
                        active ? 'text-ink font-medium' : 'text-ink-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mt-6 card p-6">
          <h2 className="font-serif text-xl font-semibold text-ink mb-4">
            Mahsulotlar
          </h2>
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg-warm shrink-0">
                  <Image
                    src={it.image}
                    alt={it.name}
                    fill
                    className="object-cover"
                    sizes="70px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/mahsulot/${it.productId}`}
                    className="text-sm font-medium text-ink hover:text-brand line-clamp-1"
                  >
                    {it.name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {[it.color, it.size].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {it.quantity} × {formatPrice(it.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-rule-light space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Mahsulotlar</span>
              <span>{formatPrice(order.subtotal)} so&apos;m</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Yetkazish</span>
              <span>
                {order.shipping === 0 ? (
                  <span className="text-emerald-600 font-medium">Bepul</span>
                ) : (
                  <>{formatPrice(order.shipping)} so&apos;m</>
                )}
              </span>
            </div>
            <div className="pt-2 flex justify-between items-baseline">
              <span className="font-medium text-ink">Jami</span>
              <span className="font-serif text-2xl font-bold text-brand">
                {formatPrice(order.total)} so&apos;m
              </span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="mt-6 card p-6">
          <h2 className="font-serif text-xl font-semibold text-ink mb-4">
            Yetkazib berish
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Mijoz" value={order.customer.name} />
            <Field label="Telefon" value={order.customer.phone} />
            {order.customer.email && (
              <Field label="Email" value={order.customer.email} />
            )}
            <Field label="Shahar" value={order.customer.city} />
            <Field label="Manzil" value={order.customer.address} wide />
            {order.customer.note && (
              <Field label="Izoh" value={order.customer.note} wide />
            )}
            <Field label="To'lov" value={paymentLabel(order.paymentMethod)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-ink mt-0.5">{value}</p>
    </div>
  );
}

function paymentLabel(p: Order['paymentMethod']) {
  switch (p) {
    case 'cash':
      return 'Naqd (yetkazishda)';
    case 'card':
      return 'Humo/Uzcard';
    case 'click':
      return 'Click';
    case 'payme':
      return 'Payme';
    default:
      return p;
  }
}
