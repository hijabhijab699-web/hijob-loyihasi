import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const PLAN_SPECS: Record<
  SubscriptionPlan,
  { months: number; priceUsd: number; labelUz: string; labelRu: string }
> = {
  monthly: { months: 1, priceUsd: 12, labelUz: '1 oy', labelRu: '1 месяц' },
  halfyear: { months: 6, priceUsd: 60, labelUz: '6 oy', labelRu: '6 месяцев' },
  yearly: { months: 12, priceUsd: 100, labelUz: '12 oy', labelRu: '12 месяцев' },
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async listPlans() {
    const rate = await this.settings.getRate();
    return Object.entries(PLAN_SPECS).map(([plan, s]) => ({
      plan,
      months: s.months,
      priceUsd: s.priceUsd,
      priceUzs: Math.round((s.priceUsd * rate) / 100) * 100,
      labelUz: s.labelUz,
      labelRu: s.labelRu,
    }));
  }

  async currentForUser(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new ForbiddenException('SELLER_PROFILE_MISSING');
    return this.currentForSeller(seller.id);
  }

  async currentForSeller(sellerId: string) {
    const now = new Date();
    // Mark anything whose end slipped past "now" as expired so active
    // queries never return a stale row.
    await this.prisma.sellerSubscription.updateMany({
      where: { sellerId, status: SubscriptionStatus.active, endAt: { lt: now } },
      data: { status: SubscriptionStatus.expired },
    });
    const latest = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      sellerId,
      current: latest
        ? {
            id: latest.id,
            plan: latest.plan,
            status: latest.status,
            priceUsd: latest.priceUsd,
            priceUzs: latest.priceUzs ? latest.priceUzs.toString() : null,
            startAt: latest.startAt?.toISOString() ?? null,
            endAt: latest.endAt?.toISOString() ?? null,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
      isActive: latest?.status === SubscriptionStatus.active && (latest.endAt ?? new Date(0)) > now,
      plans: await this.listPlans(),
    };
  }

  async startPurchase(userId: string, plan: SubscriptionPlan) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new ForbiddenException('SELLER_PROFILE_MISSING');
    const spec = PLAN_SPECS[plan];
    if (!spec) throw new BadRequestException('INVALID_PLAN');

    // Prevent duplicate pending rows for the same plan — reuse any open one.
    const existingPending = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId: seller.id, status: SubscriptionStatus.pending, plan },
    });
    if (existingPending) {
      return {
        id: existingPending.id,
        plan,
        status: existingPending.status,
        priceUsd: existingPending.priceUsd,
      };
    }

    // Snapshot UZS at purchase time so the pending row shows the seller
    // the som amount they need to transfer at the current rate.
    const uzs = BigInt(Math.round((await this.settings.toUzs(spec.priceUsd))));

    const row = await this.prisma.sellerSubscription.create({
      data: {
        sellerId: seller.id,
        plan,
        priceUsd: spec.priceUsd,
        priceUzs: uzs,
        status: SubscriptionStatus.pending,
      },
    });
    return {
      id: row.id,
      plan,
      status: row.status,
      priceUsd: row.priceUsd,
      priceUzs: row.priceUzs ? row.priceUzs.toString() : null,
    };
  }

  /**
   * Admin-side activation. The TZ says payment is agreed off-platform and
   * verified by hand, so this flips the row and sets the window relative to
   * `activatedAt` (now by default).
   */
  async activate(adminUserId: string, subscriptionId: string, priceUzs?: bigint) {
    const row = await this.prisma.sellerSubscription.findUnique({ where: { id: subscriptionId } });
    if (!row) throw new NotFoundException('SUBSCRIPTION_NOT_FOUND');
    const spec = PLAN_SPECS[row.plan];
    if (!spec) throw new BadRequestException('INVALID_PLAN');
    const start = new Date();
    const end = new Date(start.getTime());
    end.setMonth(end.getMonth() + spec.months);

    // Mark earlier active rows for this seller as expired so the admin never
    // ends up with two overlapping active windows.
    await this.prisma.sellerSubscription.updateMany({
      where: {
        sellerId: row.sellerId,
        status: SubscriptionStatus.active,
        id: { not: row.id },
      },
      data: { status: SubscriptionStatus.expired },
    });

    return this.prisma.sellerSubscription.update({
      where: { id: row.id },
      data: {
        status: SubscriptionStatus.active,
        startAt: start,
        endAt: end,
        activatedBy: adminUserId,
        priceUzs: priceUzs ?? row.priceUzs,
      },
    });
  }

  async cancel(adminUserId: string, subscriptionId: string) {
    const row = await this.prisma.sellerSubscription.findUnique({ where: { id: subscriptionId } });
    if (!row) throw new NotFoundException('SUBSCRIPTION_NOT_FOUND');
    return this.prisma.sellerSubscription.update({
      where: { id: row.id },
      data: { status: SubscriptionStatus.cancelled, activatedBy: adminUserId },
    });
  }

  /** True when the seller may use paid shop-management endpoints. */
  async isSellerActive(sellerId: string): Promise<boolean> {
    const now = new Date();
    const row = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId, status: SubscriptionStatus.active, endAt: { gt: now } },
    });
    return !!row;
  }

  async listAll(status?: SubscriptionStatus) {
    const rows = await this.prisma.sellerSubscription.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        seller: { select: { id: true, brandName: true, user: { select: { phone: true } } } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      sellerId: r.sellerId,
      brandName: r.seller.brandName,
      phone: r.seller.user.phone,
      plan: r.plan,
      status: r.status,
      priceUsd: r.priceUsd,
      priceUzs: r.priceUzs ? r.priceUzs.toString() : null,
      startAt: r.startAt?.toISOString() ?? null,
      endAt: r.endAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
