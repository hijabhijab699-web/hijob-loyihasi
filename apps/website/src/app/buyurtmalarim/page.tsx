'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Search, ArrowRight, Clock } from 'lucide-react';
import { useOrders } from '@/components/providers/OrdersProvider';
import { formatPrice } from '@/lib/format';

export default function MyOrdersPage() {
  const router = useRouter();
  const { orders, isHydrated } = useOrders();
  const [lookupId, setLookupId] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = lookupId.trim();
    if (!id) return;
    router.push(`/buyurtma/${id}`);
  };

  return (
    <section className="py-10 md:py-14">
      <div className="container-main max-w-3xl">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Buyurtmalarim</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
          Buyurtmalarim
        </h1>
        <p className="text-ink-muted mt-2">
          Bu brauzerda qilgan buyurtmalaringiz ro&apos;yxati va kuzatish.
        </p>

        {/* Lookup */}
        <form onSubmit={submit} className="mt-6 card p-5">
          <label className="block text-sm text-ink-muted mb-2">
            Buyurtma raqami bilan topish
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-bg-warm rounded-lg px-3">
              <Search className="w-4 h-4 text-ink-muted" />
              <input
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="ord_..."
                className="flex-1 bg-transparent outline-none text-sm py-2.5 font-mono"
              />
            </div>
            <button type="submit" className="btn-primary text-sm !px-5">
              Kuzatish
            </button>
          </div>
        </form>

        <div className="mt-8">
          {!isHydrated ? (
            <p className="text-ink-muted">Yuklanmoqda…</p>
          ) : orders.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-bg-warm mx-auto flex items-center justify-center">
                <Package className="w-8 h-8 text-brand" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-ink mt-5">
                Hali buyurtmangiz yo&apos;q
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Birinchi buyurtmani berib ko&apos;ring — ro&apos;yxat bu yerda ko&apos;rinadi.
              </p>
              <Link href="/katalog" className="btn-primary inline-flex items-center gap-2 mt-6">
                Katalogga o&apos;tish
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/buyurtma/${o.id}`}
                  className="card p-4 flex items-center gap-4 hover-lift"
                >
                  <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-ink truncate">{o.id}</p>
                    <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(o.createdAt).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand">
                      {formatPrice(o.total)} so&apos;m
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">Batafsil →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
