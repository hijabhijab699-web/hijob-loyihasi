import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryId, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogFiltersDto } from './dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [stores, categories, newArrivals] = await Promise.all([
      this.prisma.seller.findMany({
        where: { verified: true },
        take: 10,
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
          description: true,
          rating: true,
          reviewsCount: true,
          verified: true,
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

    return { stores, categories, newArrivals: newArrivals.map(this.toProductDto) };
  }

  async listProducts(filters: CatalogFiltersDto) {
    const pageSize = Math.min(filters.pageSize ?? 20, 50);
    const page = Math.max(filters.page ?? 1, 1);

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.published,
      ...(filters.category && { categoryId: filters.category as CategoryId }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
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

    return {
      items: items.map(this.toProductDto),
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
    return this.toProductDto(product);
  }

  async listStores() {
    return this.prisma.seller.findMany({
      where: { verified: true },
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        brandName: true,
        logoUrl: true,
        description: true,
        rating: true,
        reviewsCount: true,
        verified: true,
      },
    });
  }

  private toProductDto = (p: {
    id: string;
    sellerId: string;
    categoryId: string;
    titleRu: string;
    titleUz: string | null;
    titleEn: string | null;
    basePriceUsd: Prisma.Decimal;
    coverUrl: string;
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
  }) => ({
    id: p.id,
    sellerId: p.sellerId,
    categoryId: p.categoryId,
    title: { ru: p.titleRu, uz: p.titleUz ?? p.titleRu, en: p.titleEn ?? p.titleRu },
    basePriceUsd: Number(p.basePriceUsd),
    coverUrl: p.coverUrl,
    gallery: p.gallery,
    attributes: p.attributes,
    createdAt: p.createdAt.toISOString(),
    popularityScore: p.popularityScore,
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
    })),
    seller: {
      brandName: p.seller.brandName,
      logoUrl: p.seller.logoUrl ?? '',
      rating: Number(p.seller.rating),
      reviewsCount: p.seller.reviewsCount,
    },
  });
}
