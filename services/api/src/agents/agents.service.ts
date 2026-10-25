import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

interface OnboardShopInput {
  // Owner (new user that will log in as the shop)
  ownerFullName: string;
  ownerUsername: string;
  ownerPhone: string;
  ownerPassword: string;
  ownerLanguage?: 'uz' | 'ru' | 'en' | 'ar';

  // Shop profile
  brandName: string;
  description?: string;
  logoUrl?: string;
  country?: string;
  city?: string;
  district?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async requireAgent(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    });
    if (!user?.isActive || (user.role !== 'agent' && user.role !== 'admin')) {
      throw new ForbiddenException('AGENT_ROLE_REQUIRED');
    }
  }

  /**
   * TZ Phase 11 — the agent creates the shop owner's account AND the seller
   * profile in one call. Owner's phone / @username collisions bounce before
   * any row is written. Initial registration is free; the subscription flow
   * runs the first time the owner opens the paid cabinet.
   */
  async onboardShop(agentUserId: string, dto: OnboardShopInput) {
    await this.requireAgent(agentUserId);

    const username = dto.ownerUsername.replace(/^@/, '').toLowerCase().trim();
    if (username.length < 3) throw new BadRequestException('USERNAME_TOO_SHORT');

    const phone = dto.ownerPhone.trim();
    if (!/^\+?\d{9,15}$/.test(phone)) throw new BadRequestException('INVALID_PHONE');

    const [existingByPhone, existingByUsername] = await Promise.all([
      this.prisma.user.findUnique({ where: { phone } }),
      this.prisma.user.findUnique({ where: { username } }),
    ]);
    if (existingByPhone) throw new ConflictException('PHONE_TAKEN');
    if (existingByUsername) throw new ConflictException('USERNAME_TAKEN');

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          fullName: dto.ownerFullName,
          username,
          phone,
          passwordHash,
          role: 'seller',
          language: dto.ownerLanguage ?? 'uz',
          phoneVerified: true, // agent met the owner in person
        },
      });
      const seller = await tx.seller.create({
        data: {
          userId: owner.id,
          brandName: dto.brandName,
          description: dto.description,
          logoUrl: dto.logoUrl,
          country: dto.country ?? 'Uzbekistan',
          city: dto.city,
          district: dto.district,
          addressLine: dto.addressLine,
          latitude: dto.latitude,
          longitude: dto.longitude,
          onboardedByAgentId: agentUserId,
        },
      });
      this.logger.log(`agent ${agentUserId} onboarded shop ${seller.id} (${seller.brandName})`);
      return {
        sellerId: seller.id,
        ownerId: owner.id,
        brandName: seller.brandName,
        ownerUsername: `@${owner.username}`,
        ownerPhone: owner.phone,
      };
    });
  }

  async listMyShops(agentUserId: string) {
    await this.requireAgent(agentUserId);
    const rows = await this.prisma.seller.findMany({
      where: { onboardedByAgentId: agentUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, phone: true, username: true, isActive: true, lastSeenAt: true } },
        _count: { select: { products: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return rows.map((s) => ({
      id: s.id,
      brandName: s.brandName,
      logoUrl: s.logoUrl,
      verified: s.verified,
      isTop: s.isTop,
      isPremium: s.isPremium,
      city: s.city,
      district: s.district,
      createdAt: s.createdAt.toISOString(),
      productsCount: s._count.products,
      owner: s.user,
      currentSubscription: s.subscriptions[0]
        ? {
            plan: s.subscriptions[0].plan,
            status: s.subscriptions[0].status,
            endAt: s.subscriptions[0].endAt?.toISOString() ?? null,
          }
        : null,
    }));
  }

  async stats(agentUserId: string) {
    await this.requireAgent(agentUserId);
    const [total, active, products] = await Promise.all([
      this.prisma.seller.count({ where: { onboardedByAgentId: agentUserId } }),
      this.prisma.sellerSubscription.count({
        where: {
          status: 'active',
          seller: { onboardedByAgentId: agentUserId },
        },
      }),
      this.prisma.product.count({
        where: { seller: { onboardedByAgentId: agentUserId } },
      }),
    ]);
    return {
      shopsOnboarded: total,
      shopsWithActiveSubscription: active,
      productsPublished: products,
    };
  }
}
