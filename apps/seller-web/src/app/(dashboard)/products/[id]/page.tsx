import { listSellerProducts, getLatestStyleJob } from '@/lib/api';
import { DressMannequinForm } from './DressMannequinForm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const products = await listSellerProducts().catch(() => []);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  // Initial job state server-side so the chip renders immediately.
  const initialJob = await getLatestStyleJob(id).catch(() => null);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Mahsulotlar
      </Link>

      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-xl bg-surface2 overflow-hidden flex-shrink-0">
            {product.coverUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.coverUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-oliveDeep">{product.titleRu}</h1>
            <p className="text-muted text-sm mt-1">
              {product.variantCount} ta variant · {product.totalStock} dona zaxirada
            </p>
            <p className="font-display text-2xl text-gold mt-3">
              ${product.basePriceUsd.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <DressMannequinForm productId={product.id} initialJob={initialJob} />
    </div>
  );
}
