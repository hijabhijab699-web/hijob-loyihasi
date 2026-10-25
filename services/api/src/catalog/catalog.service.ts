import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryId, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogFiltersDto, StoreFiltersDto } from './dto';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [stores, categories, newArrivals] = await Promise.all([
      this.prisma.seller.findMany({
        where: { verified: true },
        take: 8,
        // Home surfaces newly opened shops only — the "Yangi do'konchilar"
        // strip. Older verified sellers are reachable from the Katalog tab.
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
          description: true,
          rating: true,
          reviewsCount: true,
          verified: true,
          createdAt: true,
        },
      }),
      this.prisma.category.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.product.findMany({
        where: { status: ProductStatus.published },
        orderBy: { publishedAt: 'desc' },
        take: 12,
        include: {
          variants: { take: 1 },
          seller: { select: { brandName: true, logoUrl: true, rating: true, reviewsCount: true } },
        },
      }),
    ]);

    return { stores, categories, newArrivals: newArrivals.map((p) => this.toProductDto(p)) };
  }

  async listProducts(filters: CatalogFiltersDto) {
    const pageSize = Math.min(filters.pageSize ?? 20, 50);
    const page = Math.max(filters.page ?? 1, 1);

    // Case-insensitive match against the Russian + Uzbek titles. Short
    // strings are intentionally allowed so a 2-letter query ("хи" / "ro")
    // still returns something while the user types.
    const q = filters.q?.trim();
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.published,
      ...(filters.category && { categoryId: filters.category as CategoryId }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
      ...(q && q.length >= 2 && {
        OR: [
          { titleRu: { contains: q, mode: 'insensitive' } },
          { titleUz: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(filters.minPrice !== undefined && { basePriceUsd: { gte: filters.minPrice } }),
      ...(filters.maxPrice !== undefined && {
        basePriceUsd: {
          ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
          lte: filters.maxPrice,
        },
      }),
      // Variant-level filters — a product matches if ANY of its variants
      // match the colour/size the buyer picked. Hijabs ship as "one-size"
      // (110x110), so a size filter effectively only trims apparel + bags.
      ...((filters.size || filters.color) && {
        variants: {
          some: {
            ...(filters.size && { size: filters.size }),
            ...(filters.color && { color: filters.color }),
          },
        },
      }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sort === 'priceLow'
        ? { basePriceUsd: 'asc' }
        : filters.sort === 'priceHigh'
          ? { basePriceUsd: 'desc' }
          : filters.sort === 'new'
            ? { publishedAt: 'desc' }
            : { popularityScore: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          variants: true,
          seller: { select: { brandName: true, logoUrl: true, rating: true, reviewsCount: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // Attach each product's latest 9-variant map so the Primerka tab can
    // show buyer-size renders in the list without a per-product round-trip.
    const productIds = items.map((p) => p.id);
    const jobs = productIds.length
      ? await this.prisma.productStyleJob.findMany({
          where: {
            productId: { in: productIds },
            status: 'done',
            resultVariants: { not: Prisma.JsonNull },
          },
          orderBy: { finishedAt: 'desc' },
          select: { productId: true, resultVariants: true },
        })
      : [];
    const variantsByProduct = new Map<string, Record<string, string>>();
    for (const j of jobs) {
      if (variantsByProduct.has(j.productId)) continue;
      if (j.resultVariants && typeof j.resultVariants === 'object') {
        variantsByProduct.set(j.productId, j.resultVariants as Record<string, string>);
      }
    }

    return {
      items: items.map((p) => this.toProductDto(p, undefined, variantsByProduct.get(p.id) ?? null)),
      total,
      page,
      pageSize,
      hasNext: page * pageSize < total,
    };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        seller: {
          select: { id: true, brandName: true, logoUrl: true, description: true, rating: true, reviewsCount: true, verified: true },
        },
      },
    });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');

    // Look up the latest "done" style-job per targetSize for this product so
    // the mobile client can show a buyer the mannequin+scarf render that
    // matches their height band. Null-size (one-size items) goes under "*".
    const jobs = await this.prisma.productStyleJob.findMany({
      where: { productId: id, status: 'done', resultUrl: { not: null } },
      orderBy: { finishedAt: 'desc' },
      select: { targetSize: true, resultUrl: true, resultVariants: true },
    });
    const renderedBySize = new Map<string, string>();
    for (const j of jobs) {
      const key = (j.targetSize ?? '*').toLowerCase();
      if (!renderedBySize.has(key) && j.resultUrl) renderedBySize.set(key, j.resultUrl);
    }
    // The newest done job's 9-variant map (if any) is what the Primerka
    // picker on mobile uses to pick a body-matched render.
    const latestWithVariants = jobs.find(
      (j) => j.resultVariants && typeof j.resultVariants === 'object',
    );
    const resultVariants = (latestWithVariants?.resultVariants as Record<string, string> | null) ?? null;
    return this.toProductDto(product, renderedBySize, resultVariants);
  }

  async listStores(filters: StoreFiltersDto = {}) {
    const q = filters.q?.trim();
    const where: Prisma.SellerWhereInput = {
      ...(filters.country && { country: filters.country }),
      ...(filters.city && { city: filters.city }),
      ...(filters.district && { district: filters.district }),
      ...(q && q.length >= 2 && {
        brandName: { contains: q, mode: 'insensitive' },
      }),
    };

    const sellers = await this.prisma.seller.findMany({
      where,
      // Premium > Top > verified > rating. `isTop` / `isPremium` were added
      // in migration 20261024223900 with defaults false, so legacy rows sort
      // last within each tier.
      orderBy: [
        { isPremium: 'desc' },
        { isTop: 'desc' },
        { verified: 'desc' },
        { rating: 'desc' },
      ],
      select: {
        id: true,
        brandName: true,
        logoUrl: true,
        description: true,
        rating: true,
        reviewsCount: true,
        verified: true,
        isTop: true,
        isPremium: true,
        country: true,
        city: true,
        district: true,
        addressLine: true,
        latitude: true,
        longitude: true,
      },
    });

    // Proximity-sort when coordinates are given. Haversine distance is cheap
    // in JS for a few hundred rows; a DB-level solution needs postgis which
    // isn't wired in yet. radiusKm defaults to 50.
    if (filters.latitude !== undefined && filters.longitude !== undefined) {
      const radiusKm = filters.radiusKm ?? 50;
      const withDistance = sellers
        .map((s) => {
          const lat = s.latitude ? Number(s.latitude) : null;
          const lng = s.longitude ? Number(s.longitude) : null;
          const distanceKm =
            lat !== null && lng !== null
              ? haversineKm(filters.latitude!, filters.longitude!, lat, lng)
              : null;
          return { ...s, distanceKm };
        })
        .filter((s) => s.distanceKm !== null && s.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      return withDistance;
    }

    return sellers.map((s) => ({ ...s, distanceKm: null }));
  }

  async getStore(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, phone: true } },
        _count: { select: { products: { where: { status: ProductStatus.published } } } },
      },
    });
    if (!seller) throw new NotFoundException('STORE_NOT_FOUND');
    // Category breakdown so the shop page can show "Ro'mollar 24 · Ko'ylaklar 12".
    const byCategory = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: { sellerId: id, status: ProductStatus.published },
      _count: true,
    });
    return {
      id: seller.id,
      brandName: seller.brandName,
      ownerName: seller.user?.fullName ?? null,
      phone: seller.user?.phone ?? null,
      logoUrl: seller.logoUrl,
      description: seller.description,
      rating: Number(seller.rating),
      reviewsCount: seller.reviewsCount,
      verified: seller.verified,
      isTop: seller.isTop,
      isPremium: seller.isPremium,
      country: seller.country,
      city: seller.city,
      district: seller.district,
      addressLine: seller.addressLine,
      latitude: seller.latitude ? Number(seller.latitude) : null,
      longitude: seller.longitude ? Number(seller.longitude) : null,
      productsCount: seller._count.products,
      productsByCategory: byCategory.map((b) => ({ categoryId: b.categoryId, count: b._count })),
      createdAt: seller.createdAt.toISOString(),
    };
  }

  /**
   * TZ Phase 4: Home shows products from the buyer's nearest stores. When
   * (latitude, longitude) are provided, stores are ranked by proximity
   * (Haversine) and up to `radiusKm` (default 50) are considered. Without
   * coordinates we fall back to filtering by city + district, and finally
   * to all published products if nothing is set.
   */
  async nearbyProducts(filters: StoreFiltersDto) {
    const where: Prisma.SellerWhereInput = {
      ...(filters.country && { country: filters.country }),
      ...(filters.city && { city: filters.city }),
      ...(filters.district && { district: filters.district }),
    };

    let sellerIds: string[] | null = null;
    if (filters.latitude !== undefined && filters.longitude !== undefined) {
      const radiusKm = filters.radiusKm ?? 50;
      const geo = await this.prisma.seller.findMany({
        where,
        select: { id: true, latitude: true, longitude: true },
      });
      sellerIds = geo
        .map((s) => ({
          id: s.id,
          d:
            s.latitude != null && s.longitude != null
              ? haversineKm(filters.latitude!, filters.longitude!, Number(s.latitude), Number(s.longitude))
              : Infinity,
        }))
        .filter((s) => s.d <= radiusKm)
        .sort((a, b) => a.d - b.d)
        .slice(0, 20)
        .map((s) => s.id);
    } else if (filters.city || filters.district || filters.country) {
      const nearby = await this.prisma.seller.findMany({
        where,
        select: { id: true },
        take: 20,
      });
      sellerIds = nearby.map((s) => s.id);
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.published,
        ...(sellerIds && sellerIds.length > 0 && { sellerId: { in: sellerIds } }),
      },
      orderBy: { publishedAt: 'desc' },
      take: 16,
      include: {
        variants: { take: 1 },
        seller: { select: { brandName: true, logoUrl: true, rating: true, reviewsCount: true } },
      },
    });

    return { items: products.map((p) => this.toProductDto(p)) };
  }

  /**
   * TZ Phase 4: TOP + Premium stores shown as their own strip on the home
   * screen. Premium always appears first and is visually distinct in the
   * mobile client. Admin assigns both tiers through PATCH /admin/sellers/:id/tier.
   */
  async topStores() {
    return this.prisma.seller.findMany({
      where: { OR: [{ isPremium: true }, { isTop: true }] },
      orderBy: [{ isPremium: 'desc' }, { isTop: 'desc' }, { rating: 'desc' }],
      take: 12,
      select: {
        id: true,
        brandName: true,
        logoUrl: true,
        description: true,
        rating: true,
        reviewsCount: true,
        verified: true,
        isTop: true,
        isPremium: true,
        city: true,
        district: true,
      },
    });
  }

  async storeFilterOptions() {
    const sellers = await this.prisma.seller.findMany({
      select: { country: true, city: true, district: true },
    });
    const countries = new Set<string>();
    const cities = new Set<string>();
    const districts = new Set<string>();
    for (const s of sellers) {
      if (s.country) countries.add(s.country);
      if (s.city) cities.add(s.city);
      if (s.district) districts.add(s.district);
    }
    return {
      countries: Array.from(countries).sort(),
      cities: Array.from(cities).sort(),
      districts: Array.from(districts).sort(),
    };
  }

  private toProductDto = (
    p: {
      id: string;
      sellerId: string;
      categoryId: string;
      titleRu: string;
      titleUz: string | null;
      titleEn: string | null;
      basePriceUsd: Prisma.Decimal;
      coverUrl: string;
      styledImageUrl?: string | null;
      gallery: string[];
      attributes: Prisma.JsonValue;
      createdAt: Date;
      popularityScore: number;
      variants: Array<{
        id: string;
        color: string;
        colorHex: string;
        size: string;
        priceUsd: Prisma.Decimal | null;
        stock: number;
        images: string[];
      }>;
      seller: {
        brandName: string;
        logoUrl: string | null;
        rating: Prisma.Decimal;
        reviewsCount: number;
      };
    },
    renderedBySize?: Map<string, string>,
    resultVariants?: Record<string, string> | null,
  ) => ({
    id: p.id,
    sellerId: p.sellerId,
    categoryId: p.categoryId,
    title: { ru: p.titleRu, uz: p.titleUz ?? p.titleRu, en: p.titleEn ?? p.titleRu },
    basePriceUsd: Number(p.basePriceUsd),
    // TZ §3.2 — kiyimlar maneken ustida ko'rinishi kerak. Prefer the
    // ml-garment styled image (seller upload composited onto a studio
    // mannequin) over the raw seller photo so cards always show the
    // product worn, not laid flat on a table.
    coverUrl: p.styledImageUrl ?? p.coverUrl,
    rawCoverUrl: p.coverUrl,
    styledImageUrl: p.styledImageUrl ?? null,
    gallery: p.gallery,
    attributes: p.attributes,
    createdAt: p.createdAt.toISOString(),
    popularityScore: p.popularityScore,
    // 3×3 (body-type × height) grid of rendered mannequin+scarf images.
    // Keyed like "slim-short", "medium-mid", … "full-tall". Mobile picks the
    // one matching the buyer's bodyType + height band. Null for legacy
    // products that haven't been re-rendered under the new flow.
    resultVariants: resultVariants ?? null,
    variants: p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      priceUsd: Number(v.priceUsd ?? p.basePriceUsd),
      stock: v.stock,
      images: v.images,
      hasTryOn: true,
      // Legacy single-render fallback (per-scarf-size), kept so older
      // clients keep working.
      renderedUrl: renderedBySize?.get((v.size ?? '').toLowerCase()) ?? null,
    })),
    seller: {
      brandName: p.seller.brandName,
      logoUrl: p.seller.logoUrl ?? '',
      rating: Number(p.seller.rating),
      reviewsCount: p.seller.reviewsCount,
    },
  });
}
