'use client';

import { useEffect, useState } from 'react';
import { Package, ClipboardList, DollarSign, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatPrice } from '@/lib/format';

interface Stats {
  totalProducts?: number;
  pendingProducts?: number;
  liveProducts?: number;
  totalOrders?: number;
  openOrders?: number;
  totalRevenueUzs?: number;
  views7d?: number;
}

// Mirrors the mobile (seller-tabs) Dashboard tab: four KPI tiles that
// read from /seller/stats. The mobile tab shows the same numbers in
// the same order so a seller moving between devices sees the same
// snapshot.
export default function SellerDashboard() {
  const auth = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.tokens?.accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/seller/stats', {
          headers: { Authorization: `Bearer ${auth.tokens!.accessToken}` },
        });
        const body = (await res.json()) as Stats | { error?: string };
        if (cancelled) return;
        if (!res.ok) throw new Error((body as { error?: string }).error ?? 'FAILED');
        setStats(body as Stats);
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

  const tiles = [
    {
      icon: Package,
      label: 'Mahsulotlar',
      value: stats?.totalProducts ?? 0,
      sub: `${stats?.liveProducts ?? 0} faol · ${stats?.pendingProducts ?? 0} tekshiruvda`,
    },
    {
      icon: ClipboardList,
      label: 'Buyurtmalar',
      value: stats?.totalOrders ?? 0,
      sub: `${stats?.openOrders ?? 0} ta ochiq`,
    },
    {
      icon: DollarSign,
      label: 'Umumiy savdo',
      value: `${formatPrice(stats?.totalRevenueUzs ?? 0)} so'm`,
      sub: 'Barcha vaqt davomida',
      wide: true,
    },
    {
      icon: Eye,
      label: '7 kunlik ko\'rishlar',
      value: stats?.views7d ?? 0,
      sub: "Katalog va mahsulot sahifasi",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className={`bg-white rounded-2xl p-5 md:p-6 border border-rule-light ${
                t.wide ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-dark" />
                </div>
                <p className="text-sm text-ink-muted font-medium">{t.label}</p>
              </div>
              <p className="font-serif text-3xl md:text-4xl font-bold text-ink">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t.value}
              </p>
              <p className="text-xs text-ink-muted mt-2">{t.sub}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Statistikani yuklab bo&apos;lmadi: {error}. Keyinroq qayta urinib ko&apos;ring.
        </div>
      )}
    </div>
  );
}
