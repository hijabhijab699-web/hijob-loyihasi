'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts } from '@/lib/api-client';
import type { Product } from '@/lib/types';

// Client-side popular products list. The server-component path was
// silently failing in production because the Vercel runtime's fetch
// to api.2431.uz was timing out from HKG; the /api/products proxy
// goes out from the user's region and lands reliably.
export function PopularProductsClient({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initial);
  const [loading, setLoading] = useState(initial.length === 0);

  useEffect(() => {
    if (initial.length > 0) return;
    let cancelled = false;
    (async () => {
      const res = await fetchProducts({ sort: 'popularity', pageSize: 6 });
      if (cancelled) return;
      if (res.ok && res.data) setProducts(res.data.items);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initial.length]);

  return (
    <section className="py-12 md:py-16">
      <div className="container-main">
        <div className="flex items-center justify-between mb-10 reveal-up">
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            Mashhur mahsulotlar
          </h2>
          <Link
            href="/katalog"
            className="text-brand font-medium hover:text-brand-dark transition-colors flex items-center gap-1 hover:gap-2"
          >
            Barchasi
            <ArrowRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="py-16 text-center text-ink-muted">
            <Loader2 className="w-6 h-6 animate-spin inline-block" />
          </div>
        ) : products.length === 0 ? (
          // Rather than announcing "backend not connected" to buyers, we
          // simply hide this section when the API is briefly unreachable.
          // The catalog page still exposes everything.
          null
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {products.map((p, i) => (
              <div key={p.id} className={`reveal-up reveal-delay-${(i % 3) + 1}`}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
