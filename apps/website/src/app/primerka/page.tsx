import PrimerkaClient from './PrimerkaClient';
import { getProducts, toProduct } from '@/lib/nestjs';
import type { Product } from '@/lib/types';

export const metadata = {
  title: "Primerka — 24:31",
  description: "Virtual sinab ko'rish. Selfi yuklang, AI o'zingizni mahsulotda ko'ring.",
};

export const dynamic = 'force-dynamic';

const WEARABLE_CATEGORIES: Array<'scarves' | 'dresses' | 'abaya'> = [
  'scarves',
  'dresses',
  'abaya',
];

// Prefetch the kiydi-mumkin katalog on the server so the client can render
// the hero immediately. The client still reads /tryon/my-renders for the
// buyer's pre-rendered variants once the user signs in.
export default async function PrimerkaPage() {
  const pages = await Promise.all(
    WEARABLE_CATEGORIES.map((c) =>
      getProducts({ category: c, pageSize: 20 }).catch(() => null),
    ),
  );
  const products: Product[] = pages
    .flatMap((p) => p?.items ?? [])
    .map((p) => toProduct(p));
  return <PrimerkaClient products={products} />;
}
