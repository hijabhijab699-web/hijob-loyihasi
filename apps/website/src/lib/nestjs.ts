import type {
  ApiCategory,
  ApiProductVariant,
  ApiSeller,
  Category,
  Product,
  ProductBadge,
} from './types';

export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const USD_RATE = Number(process.env.NEXT_PUBLIC_USD_RATE ?? 12600) || 12600;

export interface NestjsHome {
  stores: ApiSeller[];
  categories: ApiCategory[];
  newArrivals: NestjsProduct[];
}

export interface NestjsProduct {
  id: string;
  sellerId: string;
  categoryId: string;
  title: { ru: string; uz: string; en: string };
  basePriceUsd: number;
  coverUrl: string;
  gallery?: string[];
  attributes?: Record<string, unknown> | null;
  createdAt: string;
  popularityScore?: number;
  variants?: ApiProductVariant[];
  seller?: ApiSeller | null;
}

export interface NestjsProductsPage {
  items: NestjsProduct[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `NestJS ${init?.method ?? 'GET'} ${path} → ${res.status} ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export function usdToUzs(usd: number): number {
  return Math.round((usd || 0) * USD_RATE);
}

function title(p: NestjsProduct, locale: 'uz' | 'ru' | 'en' = 'uz'): string {
  return p.title?.[locale] || p.title?.uz || p.title?.en || p.title?.ru || 'Mahsulot';
}

function badgeFor(p: NestjsProduct): ProductBadge | undefined {
  const created = new Date(p.createdAt).getTime();
  const now = Date.now();
  const days = (now - created) / (1000 * 60 * 60 * 24);
  if (days < 21) return 'new';
  if ((p.popularityScore ?? 0) >= 90) return 'bestseller';
  return undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function toProduct(p: NestjsProduct, locale: 'uz' | 'ru' | 'en' = 'uz'): Product {
  const name = title(p, locale);
  const slug = slugify(title(p, 'en')) || p.id;
  const price = usdToUzs(p.basePriceUsd);
  const stock = (p.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
  const colors = Array.from(
    new Set((p.variants ?? []).map((v) => v.color).filter(Boolean)),
  );
  const sizes = Array.from(
    new Set((p.variants ?? []).map((v) => v.size).filter(Boolean)),
  );
  const rating = p.seller?.rating ? Number(p.seller.rating) : 4.8;
  const reviews = p.seller?.reviewsCount ?? 0;
  const description =
    (typeof p.attributes?.description === 'string' && p.attributes.description) ||
    p.seller?.description ||
    "Premium sifatli mahsulot, qo'lda tanlangan materiallar.";

  return {
    id: p.id,
    title: p.title,
    name,
    slug,
    description,
    price,
    priceUsd: p.basePriceUsd,
    rating: Number.isFinite(rating) ? rating : 4.8,
    reviews: reviews || 0,
    badge: badgeFor(p),
    image: p.coverUrl,
    gallery: p.gallery ?? [p.coverUrl],
    category: p.categoryId,
    colors: colors.length ? colors : ['Universal'],
    sizes: sizes.length ? sizes : ['One size'],
    fabric: typeof p.attributes?.fabric === 'string' ? p.attributes.fabric : '',
    stock,
    featured: (p.popularityScore ?? 0) >= 80,
    createdAt: p.createdAt,
    variants: p.variants,
    seller: p.seller ?? undefined,
  };
}

export function toCategory(c: ApiCategory, locale: 'uz' | 'ru' | 'en' = 'uz'): Category {
  const name =
    locale === 'uz'
      ? c.nameUz
      : locale === 'ru'
        ? c.nameRu
        : c.nameEn;
  const covers: Record<string, string> = {
    scarves: '/images/category-ipak.webp',
    dresses: '/images/category-shoyi.webp',
    bags: '/images/category-pashmina.webp',
    accessories: '/images/category-shifon.webp',
  };
  return {
    slug: c.id as string,
    name,
    image: c.coverUrl || c.iconUrl || covers[c.id as string] || '/images/category-ipak.webp',
    description: '',
  };
}

export function getHome() {
  return j<NestjsHome>('/catalog/home');
}

const SORT_MAP: Record<string, string> = {
  popular: 'popularity',
  'price-asc': 'priceLow',
  'price-desc': 'priceHigh',
  newest: 'new',
  rating: 'popularity',
};

export interface ProductsQuery {
  category?: string;
  q?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  ids?: string[];
}

export async function getProducts(q: ProductsQuery = {}) {
  if (q.ids && q.ids.length) {
    const results = await Promise.all(
      q.ids.map(async (id) => {
        try {
          return await getProduct(id);
        } catch {
          return null;
        }
      }),
    );
    const items = results.filter((p): p is NestjsProduct => Boolean(p));
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      hasNext: false,
    } as NestjsProductsPage;
  }
  const sp = new URLSearchParams();
  if (q.category && q.category !== 'Barchasi') sp.set('category', q.category);
  if (q.q) sp.set('q', q.q);
  if (q.color) sp.set('color', q.color);
  if (q.size) sp.set('size', q.size);
  if (typeof q.minPrice === 'number') sp.set('minPrice', String(q.minPrice));
  if (typeof q.maxPrice === 'number') sp.set('maxPrice', String(q.maxPrice));
  if (q.sort) sp.set('sort', SORT_MAP[q.sort] ?? q.sort);
  if (q.page) sp.set('page', String(q.page));
  if (q.pageSize) sp.set('pageSize', String(q.pageSize));
  return j<NestjsProductsPage>(`/catalog/products?${sp.toString()}`);
}

export function getProduct(id: string) {
  return j<NestjsProduct>(`/catalog/products/${id}`);
}
