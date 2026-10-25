import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private cachedRate: number | null = null;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Current USD→UZS rate. Cached in-process for 60 seconds so every
   * price-returning endpoint can call `priceUzs()` without a round-trip
   * on each item. Admin updates invalidate the cache.
   */
  async getRate(): Promise<number> {
    const now = Date.now();
    if (this.cachedRate !== null && now - this.cachedAt < 60_000) {
      return this.cachedRate;
    }
    const row = await this.prisma.appSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
    this.cachedRate = Number(row.usdToUzsRate);
    this.cachedAt = now;
    return this.cachedRate;
  }

  async setRate(adminUserId: string, rate: number) {
    if (!(rate > 0 && rate < 1_000_000)) {
      throw new Error('INVALID_RATE');
    }
    const row = await this.prisma.appSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', usdToUzsRate: rate, updatedBy: adminUserId },
      update: { usdToUzsRate: rate, updatedBy: adminUserId },
    });
    this.cachedRate = Number(row.usdToUzsRate);
    this.cachedAt = Date.now();
    return { usdToUzsRate: this.cachedRate, updatedAt: row.updatedAt.toISOString() };
  }

  /** USD amount → UZS, rounded to the nearest 100 so'm so the UI shows
   *  clean numbers like "250 000" rather than "249 987". */
  async toUzs(usd: number): Promise<number> {
    const rate = await this.getRate();
    const raw = usd * rate;
    return Math.round(raw / 100) * 100;
  }
}
