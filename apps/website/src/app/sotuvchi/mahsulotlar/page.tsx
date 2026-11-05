'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Package, Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatPrice } from '@/lib/format';

interface SellerProduct {
  id: string;
  title: { ru?: string; uz?: string; en?: string } | string;
  basePriceUsd?: number;
  coverUrl?: string;
  status: 'draft' | 'pending' | 'live' | 'rejected' | 'archived';
  categoryId?: string;
}

const STATUS_LABEL: Record<SellerProduct['status'], string> = {
  draft: 'Qoralama',
  pending: 'Tekshiruvda',
  live: 'Faol',
  rejected: 'Rad etildi',
  archived: 'Arxiv',
};

const STATUS_COLOR: Record<SellerProduct['status'], string> = {
  draft: 'bg-rule-light text-ink',
  pending: 'bg-amber-50 text-amber-700',
  live: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  archived: 'bg-ink/10 text-ink-muted',
};

function title(p: SellerProduct): string {
  if (typeof p.title === 'string') return p.title;
  return p.title?.uz || p.title?.en || p.title?.ru || 'Mahsulot';
}

export default function SellerProducts() {
  const auth = useAuth();
  const [items, setItems] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.tokens?.accessToken) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/seller/products', {
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

  const uzsRate = 12600;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Mahsulotlar</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Hammasi {items.length} · faol {items.filter((p) => p.status === 'live').length}
          </p>
        </div>
        <Link
          href="/sotuvchi/mahsulotlar/yangi"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yangi mahsulot
        </Link>
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
          <Package className="w-12 h-12 text-ink-light mx-auto mb-3" />
          <h3 className="font-serif text-xl font-semibold text-ink">
            Hali mahsulot yo&apos;q
          </h3>
          <p className="text-sm text-ink-muted mt-1 mb-5 max-w-sm mx-auto">
            Birinchi mahsulotingizni qo&apos;shing — rasm, nom, narx va o&apos;lchamlarni
            kiriting, so&apos;ng tekshiruvga yuboring.
          </p>
          <Link
            href="/sotuvchi/mahsulotlar/yangi"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yangi mahsulot qo&apos;shish
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-rule-light rounded-2xl overflow-hidden">
          <ul className="divide-y divide-rule-light">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-bg-cream shrink-0">
                  {p.coverUrl ? (
                    <Image
                      src={p.coverUrl}
                      alt={title(p)}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-ink-light m-auto mt-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{title(p)}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {p.categoryId ?? 'uncategorized'} ·{' '}
                    {formatPrice(Math.round((p.basePriceUsd ?? 0) * uzsRate))} so&apos;m
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
