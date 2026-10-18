'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { fetchProducts } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';

export default function WishlistPage() {
  const wl = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wl.isHydrated) return;
    if (wl.ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const res = await fetchProducts({
        ids: wl.ids.join(','),
        pageSize: 60,
      });
      if (res.ok && res.data) setProducts(res.data.items);
      setLoading(false);
    })();
  }, [wl.ids, wl.isHydrated]);

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <nav className="text-sm text-ink-muted mb-4">
          <Link href="/" className="hover:text-brand">
            Bosh sahifa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink font-medium">Sevimlilar</span>
        </nav>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-ink">
          Sevimlilar
        </h1>
        <p className="text-ink-muted mt-2">
          {wl.ids.length > 0
            ? `${wl.ids.length} ta mahsulot saqlangan`
            : "Hali hech narsa qo'shilmagan"}
        </p>

        <div className="mt-8">
          {!wl.isHydrated || loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-6 h-6 animate-spin inline-block text-ink-muted" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-bg-warm mx-auto flex items-center justify-center">
                <Heart className="w-9 h-9 text-brand" />
              </div>
              <p className="mt-6 text-ink-muted">
                Sevimli mahsulotlaringiz shu yerda ko&apos;rinadi.
              </p>
              <Link
                href="/katalog"
                className="btn-primary inline-flex items-center gap-2 mt-6"
              >
                Katalogga o&apos;tish
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
