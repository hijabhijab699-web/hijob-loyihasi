import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listReviews } from '@/lib/db';
import { getProduct, getProducts, toProduct } from '@/lib/nestjs';
import ProductDetail from './ProductDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  let product;
  try {
    const raw = await getProduct(id);
    product = toProduct(raw);
  } catch {
    notFound();
  }

  const [reviews, relatedPage] = await Promise.all([
    listReviews(product.id),
    getProducts({ category: product.category, pageSize: 5 }).catch(() => null),
  ]);

  const related = (relatedPage?.items ?? [])
    .filter((p) => p.id !== product.id)
    .map((p) => toProduct(p))
    .slice(0, 4);

  return (
    <>
      <section className="bg-bg-cream">
        <div className="container-main py-6">
          <nav className="text-sm text-ink-muted">
            <Link href="/" className="hover:text-brand">
              Bosh sahifa
            </Link>
            <span className="mx-2">/</span>
            <Link href="/katalog" className="hover:text-brand">
              Katalog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      <ProductDetail product={product} reviews={reviews} related={related} />
    </>
  );
}
