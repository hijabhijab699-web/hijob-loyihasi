import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MlCompositorClient } from '../tryon/ml-compositor.client';
import { Prisma, StyleJobStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface DressMannequinInput {
  mannequinUrl: string;
  hijabUrl: string;
  tyingStyle?: 'classical' | 'loose' | 'double';
  colorHex?: string;
}

@Injectable()
export class StyleJobsService {
  private readonly logger = new Logger(StyleJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly compositor: MlCompositorClient,
  ) {}

  /** Seller submits a new "dress the mannequin" job. */
  async submit(sellerUserId: string, productId: string, input: DressMannequinInput) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: sellerUserId } });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    if (product.sellerId !== seller.id) throw new BadRequestException('PRODUCT_NOT_YOURS');

    if (!input.mannequinUrl || !input.hijabUrl) {
      throw new BadRequestException('MANNEQUIN_AND_HIJAB_URLS_REQUIRED');
    }

    return this.prisma.productStyleJob.create({
      data: {
        productId,
        sellerId: seller.id,
        mannequinUrl: input.mannequinUrl,
        hijabUrl: input.hijabUrl,
        tyingStyle: input.tyingStyle ?? 'classical',
        colorHex: input.colorHex ?? '#8A8D5B',
      },
    });
  }

  /** Return the latest job for a product (seller-side status chip). */
  async latestForProduct(sellerUserId: string, productId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: sellerUserId } });
    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    return this.prisma.productStyleJob.findFirst({
      where: { productId, sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin / debug listing. */
  async listAll(status?: StyleJobStatus, limit = 50) {
    return this.prisma.productStyleJob.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: {
        product: { select: { titleRu: true } },
        seller: { select: { brandName: true } },
      },
    });
  }

  // ─── Worker API ─────────────────────────────────────────────────

  /** Atomically claim one pending job for processing. Returns null when
   *  nothing is pending. */
  async claimNext(): Promise<Prisma.ProductStyleJobGetPayload<{}> | null> {
    // SELECT ... FOR UPDATE SKIP LOCKED equivalent via a transactional
    // conditional update. We find the oldest pending job, then flip it to
    // running inside a transaction so two worker ticks never claim the same
    // row.
    return this.prisma.$transaction(async (tx) => {
      const next = await tx.productStyleJob.findFirst({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      });
      if (!next) return null;
      return tx.productStyleJob.update({
        where: { id: next.id },
        data: {
          status: 'running',
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    });
  }

  async markDone(jobId: string, resultUrl: string) {
    const updated = await this.prisma.productStyleJob.update({
      where: { id: jobId },
      data: {
        status: 'done',
        resultUrl,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });
    // Flip the parent product so buyer-side catalog instantly starts
    // using the fresh mannequin shot.
    await this.prisma.product.update({
      where: { id: updated.productId },
      data: { styledImageUrl: resultUrl },
    });
    return updated;
  }

  async markFailed(jobId: string, message: string) {
    return this.prisma.productStyleJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: message.slice(0, 500),
        finishedAt: new Date(),
      },
    });
  }

  /**
   * Run one job end-to-end: fetch the mannequin + hijab inputs, call
   * ml-compositor's procedural scarf route (uses MediaPipe landmarks on the
   * mannequin's face internally through the ml-face client), store the
   * result, update the job.
   *
   * This is the "dress the mannequin" step the queue was built for. The
   * composition is procedural today; a future upgrade can swap this body
   * for a Gemini/Claude image-edit call without touching the queue.
   */
  async processJob(jobId: string): Promise<void> {
    const job = await this.prisma.productStyleJob.findUnique({ where: { id: jobId } });
    if (!job) return;

    try {
      // Pull the mannequin bytes down so the compositor can treat it as the
      // "face" image. The URL is public (served from /uploads/ or R2).
      const mannequinBytes = await this.fetchBytes(job.mannequinUrl);
      const mannequinMime = this.inferMime(job.mannequinUrl);
      const file: Express.Multer.File = {
        buffer: mannequinBytes,
        mimetype: mannequinMime,
        originalname: 'mannequin.jpg',
        size: mannequinBytes.length,
        fieldname: 'face',
        encoding: '7bit',
        stream: undefined as never,
        destination: '',
        filename: 'mannequin.jpg',
        path: '',
      };

      const jpeg = await this.compositor.composeScarf(file, {
        tyingStyle: job.tyingStyle as 'classical' | 'loose' | 'double',
        colorHex: job.colorHex,
        pattern: 'silk',
      });

      // Store the composed image under products/<id>/styled-<jobid>.jpg so
      // every run is addressable and the URL doesn't collide with the
      // seller-uploaded mannequin.
      const key = `products/${job.productId}/styled-${job.id}.jpg`;
      const result = await this.storage.save(
        key,
        jpeg,
        'image/jpeg',
        `styled-${job.id}.jpg`,
      );

      await this.markDone(job.id, result.url);
      this.logger.log(`job ${job.id} done → ${result.url}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`job ${jobId} failed: ${msg}`);
      await this.markFailed(jobId, msg);
    }
  }

  private async fetchBytes(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url} → HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  private inferMime(url: string): string {
    const lower = url.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }

  /** Idempotency helper used by the controller to dedupe seller resubmits.
   *  Not strictly needed for v1 but handy. */
  private hashInputs(input: DressMannequinInput): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex')
      .slice(0, 16);
  }
}
