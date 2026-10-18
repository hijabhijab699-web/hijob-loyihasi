'use client';

import { useEffect, useState } from 'react';
import { useRecent } from '@/components/providers/RecentProvider';
import { fetchProducts } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface Props {
  excludeId?: string;
  title?: string;
}

export function RecentlyViewed({
  excludeId,
  title = "So'nggi ko'rilganlar",
}: Props) {
  const { ids, isHydrated } = useRecent();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const filtered = ids.filter((id) => id !== excludeId);
    if (filtered.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    fetchProducts({ ids: filtered.join(','), pageSize: 8 }).then((res) => {
      if (res.ok && res.data) {
        // preserve order from recent ids
        const map = new Map(res.data.items.map((p) => [p.id, p]));
        setItems(filtered.map((id) => map.get(id)).filter(Boolean) as Product[]);
      }
      setLoading(false);
    });
  }, [ids, isHydrated, excludeId]);

  if (!isHydrated || loading || items.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container-main">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-6">
          {title}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
