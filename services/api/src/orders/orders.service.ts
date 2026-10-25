import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto';
import { DeliveryType, DeliverySpeed, PaymentMethod } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PushService } from '../push/push.service';
import { SettingsService } from '../settings/settings.service';

const DELIVERY_FEES: Record<DeliveryType, Record<DeliverySpeed | 'default', number>> = {
  delivery: { today: 5, tomorrow: 3, scheduled: 4, default: 5 },
  pickup: { today: 0, tomorrow: 0, scheduled: 0, default: 0 },
  proba: { today: 5, tomorrow: 5, scheduled: 5, default: 5 },
  // Bron qilish / Saqlab turish: fizik yetkazib berish bo'lmaganligi
  // uchun bepul, do'konchi narx/muddat va yetkazib berish chat orqali
  // kelishib oladi.
  reserve: { today: 0, tomorrow: 0, scheduled: 0, default: 0 },
  hold: { today: 0, tomorrow: 0, scheduled: 0, default: 0 },
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
    private readonly settings: SettingsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!address) throw new NotFoundException('ADDRESS_NOT_FOUND');

      const variantIds = dto.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: {
            select: {
              titleRu: true,
              coverUrl: true,
              seller: { select: { id: true, userId: true, brandName: true } },
            },
          },
        },
      });

      if (variants.length !== dto.items.length) {
        throw new BadRequestException('SOME_VARIANTS_UNAVAILABLE');
      }

      let subtotal = 0;
      const orderItems = dto.items.map((requestedItem) => {
        const variant = variants.find((v) => v.id === requestedItem.variantId)!;
        if (variant.stock < requestedItem.quantity) {
          throw new BadRequestException(`OUT_OF_STOCK:${variant.sku}`);
        }
        const price = Number(variant.priceUsd ?? 0);
        subtotal += price * requestedItem.quantity;

        return {
          variantId: variant.id,
          quantity: requestedItem.quantity,
          priceSnapshot: price,
          titleSnapshot: variant.product.titleRu,
          imageSnapshot: variant.images[0] ?? variant.product.coverUrl,
          colorSnapshot: variant.color,
          sizeSnapshot: variant.size,
        };
      });

      const deliveryFee =
        DELIVERY_FEES[dto.deliveryType]?.[dto.deliverySpeed ?? 'default'] ?? 0;

      const total = subtotal + deliveryFee;

      const order = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId,
          deliveryType: dto.deliveryType as DeliveryType,
          deliverySpeed: dto.deliverySpeed as DeliverySpeed | undefined,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          comment: dto.comment,
          subtotalUsd: subtotal,
          deliveryFeeUsd: deliveryFee,
          totalUsd: total,
          paymentMethod: dto.paymentMethod as PaymentMethod,
          addressSnapshot: {
            city: address.city,
            district: address.district,
            street: address.street,
            building: address.building,
            apartment: address.apartment,
          },
          items: { create: orderItems },
        },
      });

      // Reserve stock
      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart items that were checked out
      await tx.cartItem.deleteMany({
        where: { userId, variantId: { in: variantIds } },
      });

      // Collect distinct seller user ids so the post-tx hook can notify
      // every shop whose variant is in this order. One notification per
      // seller user, even if the buyer bought several items from them.
      const sellerUserIds = Array.from(
        new Set(
          variants
            .map((v) => v.product.seller?.userId)
            .filter((v): v is string => !!v),
        ),
      );
      const sellerBrand =
        variants[0]?.product.seller?.brandName ?? '';

      // TZ Phase 8 — snapshot the UZS total at order time so the receipt
      // never drifts after admin changes the rate.
      const uzsTotal = await this.settings.toUzs(total);

      const result = {
        orderId: order.id,
        totalUsd: total,
        totalUzs: uzsTotal,
        // TODO: integrate Payme/Click. For MVP return placeholder.
        paymentUrl: `https://payme.dev/checkout/${order.id}`,
        sellerUserIds,
        sellerBrand,
      };
      return result;
    }).then(async (result) => {
      // In-app inbox entry fires outside the transaction so a failed
      // notification write never rolls back the order itself.
      await this.notifications
        .create({
          userId,
          kind: 'order_update',
          title: 'Buyurtma qabul qilindi',
          body: `#${result.orderId.slice(0, 8).toUpperCase()} — $${result.totalUsd.toFixed(2)}`,
          data: { orderId: result.orderId, kind: 'created' },
        })
        .catch(() => undefined);

      // TZ Phase 5.1 — notify each seller whose variant is in this order:
      // in-app inbox row + Expo push to any registered device of theirs.
      // Failures here never roll back the buyer's order.
      const orderShort = `#${result.orderId.slice(0, 8).toUpperCase()}`;
      await Promise.all(
        result.sellerUserIds.map(async (sellerUserId) => {
          try {
            await this.notifications.create({
              userId: sellerUserId,
              kind: 'order_update',
              title: 'Yangi buyurtma',
              body: `${orderShort} — $${result.totalUsd.toFixed(2)}`,
              data: { orderId: result.orderId, kind: 'seller_new' },
            });
            await this.push.sendToUser(
              sellerUserId,
              'Yangi buyurtma',
              `${orderShort} — $${result.totalUsd.toFixed(2)} savatga tushdi`,
              { orderId: result.orderId, kind: 'seller_new' },
            );
          } catch (err) {
            this.logger.warn(
              `seller notification failed for ${sellerUserId}: ${(err as Error).message}`,
            );
          }
        }),
      );

      // Caller only cares about the buyer-facing fields.
      return {
        orderId: result.orderId,
        totalUsd: result.totalUsd,
        totalUzs: result.totalUzs,
        paymentUrl: result.paymentUrl,
      };
    });
  }

  async listOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, address: true },
    });
    return orders.map((o) => this.toPublicOrder(o));
  }

  async getOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, address: true },
    });
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    return this.toPublicOrder(order);
  }

  /**
   * Build the timeline the mobile client renders. Every step gets a static
   * position; the "reached" flag says whether we've passed it yet.
   */
  private orderTimeline(status: string, deliveryType: string) {
    const isProba = deliveryType === 'proba';
    const isPickup = deliveryType === 'pickup';

    const steps: Array<{ key: string; label: string; reachedAt: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'proba_scheduled' }> = [
      { key: 'placed', label: 'Buyurtma qabul qilindi', reachedAt: 'pending' },
      { key: 'confirmed', label: 'To\'lov tasdiqlandi', reachedAt: 'confirmed' },
      { key: 'processing', label: 'Tayyorlanmoqda', reachedAt: 'processing' },
    ];
    if (isProba) {
      steps.push({ key: 'proba', label: 'Proba jo\'natildi', reachedAt: 'proba_scheduled' });
    } else if (isPickup) {
      steps.push({ key: 'ready', label: 'Do\'konda tayyor', reachedAt: 'shipped' });
    } else {
      steps.push({ key: 'shipped', label: 'Yo\'lda', reachedAt: 'shipped' });
    }
    steps.push({ key: 'delivered', label: 'Yetkazildi', reachedAt: 'delivered' });

    const order: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      proba_scheduled: 3,
      delivered: 4,
      returned: -1,
      cancelled: -1,
    };
    const rank = order[status] ?? 0;

    return steps.map((step, idx) => ({
      key: step.key,
      label: step.label,
      reached: idx <= rank,
      active: idx === rank,
    }));
  }

  private toPublicOrder(o: Awaited<ReturnType<PrismaService['order']['findFirst']>> & {
    items: Array<any>;
    address: any;
  }) {
    return {
      id: o!.id,
      status: o!.orderStatus,
      paymentStatus: o!.paymentStatus,
      paymentMethod: o!.paymentMethod,
      deliveryType: o!.deliveryType,
      deliverySpeed: o!.deliverySpeed,
      scheduledAt: o!.scheduledAt?.toISOString() ?? null,
      subtotalUsd: Number(o!.subtotalUsd),
      deliveryFeeUsd: Number(o!.deliveryFeeUsd),
      totalUsd: Number(o!.totalUsd),
      createdAt: o!.createdAt.toISOString(),
      address: o!.address
        ? {
            city: o!.address.city,
            district: o!.address.district,
            street: o!.address.street,
            building: o!.address.building,
          }
        : null,
      items: o!.items.map((it: any) => ({
        title: it.titleSnapshot,
        color: it.colorSnapshot,
        size: it.sizeSnapshot,
        quantity: it.quantity,
        priceUsd: Number(it.priceSnapshot),
        image: it.imageSnapshot,
      })),
      timeline: this.orderTimeline(o!.orderStatus, o!.deliveryType),
    };
  }
}
