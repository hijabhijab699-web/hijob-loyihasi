import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

/**
 * Admin service — operations only admins and moderators perform. Keeps the
 * data model boring (no soft-delete tombstones etc.) and relies on
 * `verified`, `isActive`, `status` columns the rest of the system already
 * respects.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /* ────── Dashboard ────── */

  async dashboard() {
    const [users, buyers, sellersTotal, sellersVerified, products, published, orders, pending] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: 'buyer' } }),
        this.prisma.seller.count(),
        this.prisma.seller.count({ where: { verified: true } }),
        this.prisma.product.count(),
        this.prisma.product.count({ where: { status: 'published' } }),
        this.prisma.order.count(),
        this.prisma.product.count({ where: { status: 'pending' } }),
      ]);

    return {
      users: { total: users, buyers, sellers: sellersTotal },
      sellers: { total: sellersTotal, verified: sellersVerified, pending: sellersTotal - sellersVerified },
      products: { total: products, published, pendingReview: pending },
      orders: { total: orders },
    };
  }

  /* ────── Sellers ────── */

  async listSellers() {
    const sellers = await this.prisma.seller.findMany({
      include: {
        user: { select: { username: true, phone: true, fullName: true, isActive: true, createdAt: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sellers.map((s) => ({
      id: s.id,
      brandName: s.brandName,
      logoUrl: s.logoUrl,
      verified: s.verified,
      city: s.city,
      rating: Number(s.rating),
      reviewsCount: s.reviewsCount,
      productsCount: s._count.products,
      createdAt: s.createdAt,
      user: {
        ...s.user,
        active: s.user.isActive,
      },
    }));
  }

  async setSellerVerified(sellerId: string, verified: boolean) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    return this.prisma.seller.update({
      where: { id: sellerId },
      data: { verified },
      select: { id: true, brandName: true, verified: true },
    });
  }

  async banSellerUser(sellerId: string, banned: boolean) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    // Flipping the user's active flag locks out login + login-required endpoints.
    // Products stay visible until a separate archive action, so buyers don't
    // get surprise 404s mid-browsing.
    return this.prisma.user.update({
      where: { id: seller.userId },
      data: { isActive: !banned },
      select: { id: true, isActive: true },
    });
  }

  /**
   * Delete a seller permanently: their products, variants, style jobs,
   * face renders tied to those variants, cart/wishlist rows, and the
   * seller + user records themselves. Prisma cascade handles most of
   * this (every FK on the seller side has onDelete: Cascade); the one
   * thing we do explicitly is drop the user row so the login row goes
   * with the store. Orders are kept because they're a financial record.
   */
  async deleteSeller(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, userId: true, brandName: true },
    });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    await this.prisma.$transaction([
      this.prisma.seller.delete({ where: { id: sellerId } }),
      this.prisma.user.delete({ where: { id: seller.userId } }),
    ]);
    return { id: seller.id, deleted: true, brandName: seller.brandName };
  }

  /* ────── Products ────── */

  async listProducts(status?: ProductStatus) {
    const products = await this.prisma.product.findMany({
      where: status ? { status } : undefined,
      include: {
        seller: { select: { brandName: true, verified: true } },
        _count: { select: { variants: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return products.map((p) => ({
      id: p.id,
      titleRu: p.titleRu,
      titleUz: p.titleUz,
      categoryId: p.categoryId,
      status: p.status,
      coverUrl: p.coverUrl,
      basePriceUsd: Number(p.basePriceUsd),
      createdAt: p.createdAt,
      publishedAt: p.publishedAt,
      seller: p.seller,
      variantsCount: p._count.variants,
    }));
  }

  async setProductStatus(productId: string, status: ProductStatus) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        status,
        publishedAt: status === 'published' ? new Date() : product.publishedAt,
      },
      select: { id: true, titleRu: true, status: true, publishedAt: true },
    });
  }

  /**
   * Delete a product permanently. Variants and anything hanging off them
   * (variant renders, user face renders, cart/wishlist rows) go with it
   * via Prisma cascade. Orders keep their line-item snapshots, which
   * live on OrderItem and are copied at purchase time, so order history
   * stays readable even after a product is gone.
   */
  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, titleRu: true },
    });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    await this.prisma.product.delete({ where: { id: productId } });
    return { id: product.id, deleted: true, titleRu: product.titleRu };
  }

  /* ────── Users ────── */

  async listUsers(role?: 'buyer' | 'seller' | 'admin' | 'moderator') {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        username: true,
        phone: true,
        fullName: true,
        role: true,
        language: true,
        isActive: true,
        createdAt: true,
        lastSeenAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return users;
  }

  async banUser(userId: string, banned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !banned },
      select: { id: true, username: true, isActive: true },
    });
  }

  /**
   * Delete a user permanently. If the user owns a store (role=seller)
   * we refuse — the caller has to go through deleteSeller instead so
   * the brand+products are handled as one unit. Admins can't be
   * deleted this way either; demote them to buyer first. Everything
   * else (buyer rows: addresses, cart, wishlist, face renders, otp,
   * sessions) cascades off the user FK.
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, seller: { select: { id: true } } },
    });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (user.role === 'admin') {
      throw new BadRequestException('CANNOT_DELETE_ADMIN');
    }
    if (user.seller) {
      throw new BadRequestException('USE_DELETE_SELLER_INSTEAD');
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { id: user.id, deleted: true, username: user.username };
  }

  /* ────── Orders ────── */

  async listOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: { select: { username: true, fullName: true } },
        items: { select: { quantity: true, priceSnapshot: true, titleSnapshot: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return orders.map((o) => ({
      id: o.id,
      userUsername: o.user.username,
      userFullName: o.user.fullName,
      itemCount: o.items.length,
      totalUsd: Number(o.totalUsd),
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
    }));
  }
}
