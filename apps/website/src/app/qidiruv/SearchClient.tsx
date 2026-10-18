'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { searchProducts } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export default function SearchClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const initial = sp.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = sp.get('q') ?? '';
    if (!query) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    searchProducts(query).then((res) => {
      if (res.ok && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
      }
      setLoading(false);
    });
  }, [sp]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    router.push(`/qidiruv?q=${encodeURIComponent(value)}`);
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container-main">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Qidiruv</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
          Qidiruv
        </h1>

        <form onSubmit={submit} className="mt-6 flex items-center gap-2 bg-bg-warm rounded-xl px-4 py-3 max-w-2xl">
          <Search className="w-5 h-5 text-ink-muted shrink-0" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mahsulot nomi, mato, rang..."
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted"
          />
          <button type="submit" className="btn-primary text-sm !px-5 !py-2">
            Qidirish
          </button>
        </form>

        <div className="mt-8">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin inline-block text-ink-muted" />
            </div>
          ) : !sp.get('q') ? (
            <p className="text-ink-muted">
              Qidiruv so&apos;zini yozing va &quot;Qidirish&quot; tugmasini bosing.
            </p>
          ) : total === 0 ? (
            <div className="py-16 text-center">
              <p className="text-ink-muted">
                &ldquo;{sp.get('q')}&rdquo; bo&apos;yicha hech narsa topilmadi.
              </p>
              <Link
                href="/katalog"
                className="btn-outline inline-flex items-center gap-2 mt-6"
              >
                Katalogga o&apos;tish
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-6">
                <span className="font-semibold text-ink">{total}</span> ta natija
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
