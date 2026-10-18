import PrimerkaClient from './PrimerkaClient';
import { getProducts, toProduct } from '@/lib/nestjs';

export const metadata = {
  title: 'Primerka — Hijob',
  description: "Virtual sinab ko'rish. Rasm yuklang, ro'molni tanlang, ko'rib chiqing.",
};

export const dynamic = 'force-dynamic';

export default async function PrimerkaPage() {
  const page = await getProducts({ category: 'scarves', pageSize: 12 }).catch(() => null);
  const scarves = (page?.items ?? []).map((p) => toProduct(p));
  return <PrimerkaClient scarves={scarves} />;
}
