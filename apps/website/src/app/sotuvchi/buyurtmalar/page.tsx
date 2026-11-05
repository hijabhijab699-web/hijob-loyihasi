'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatPrice } from '@/lib/format';

interface SellerOrder {
  id: string;
  orderNumber?: string;
  customerName?: string;
  totalUzs?: number;
  status: 'new' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const STATUS_LABEL: Record<SellerOrder['status'], string> = {
  new: 'Yangi',
  confirmed: 'Tasdiqlandi',
  packed: "Qadoqlandi",
  shipped: 'Yo\'lda',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};

const STATUS_COLOR: Record<SellerOrder['status'], string> = {
  new: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function SellerOrders() {
  const auth = useAuth();
  const [items, setItems] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.tokens?.accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/seller/orders', {
          headers: { Authorization: `Bearer ${auth.tokens!.accessToken}` },
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(body?.error ?? 'FAILED');
        setItems(Array.isArray(body) ? body : body?.items ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'FETCH_FAILED');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.tokens?.accessToken]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-ink">Buyurtmalar</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Jami {items.length} ·{' '}
          {items.filter((o) => o.status === 'new' || o.status === 'confirmed').length} ta ochiq
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin inline-block" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Yuklab bo&apos;lmadi: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-rule-light rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-ink-light mx-auto mb-3" />
          <h3 className="font-serif text-xl font-semibold text-ink">
            Hali buyurtma yo&apos;q
          </h3>
          <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
            Yangi buyurtma kelganda bu yerda ko&apos;rinadi.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-rule-light rounded-2xl overflow-hidden">
          <ul className="divide-y divide-rule-light">
            {items.map((o) => (
              <li key={o.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink">
                    #{o.orderNumber ?? o.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {o.customerName ?? 'Xaridor'} ·{' '}
                    {new Date(o.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <p className="font-semibold text-ink whitespace-nowrap">
                  {formatPrice(o.totalUzs ?? 0)} so&apos;m
                </p>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-rule-light text-ink'}`}
                >
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
