// Static fallback categories. Live data comes from NestJS /catalog/home.
import type { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    slug: 'scarves',
    name: "Ro'mollar",
    image: '/images/category-ipak.webp',
    description: "Ipak, shoyi, shifon, pashmina ro'mollar",
  },
  {
    slug: 'dresses',
    name: "Ko'ylaklar",
    image: '/images/category-shoyi.webp',
    description: "Oqshom va kundalik ko'ylaklar",
  },
  {
    slug: 'bags',
    name: "Sumkalar",
    image: '/images/category-pashmina.webp',
    description: "Ayollar aksessuarlari",
  },
  {
    slug: 'accessories',
    name: 'Aksessuarlar',
    image: '/images/category-shifon.webp',
    description: "Sirg'alar, bilakuzuklar, soat",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
