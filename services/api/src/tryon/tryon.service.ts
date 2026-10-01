import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MlCompositorClient } from './ml-compositor.client';
import { StorageService } from '../storage/storage.service';
import { TryOnRequestDto } from './dto';

type TyingStyle = 'classical' | 'loose' | 'double';

const IMAGE_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedImage {
  bytes: Buffer;
  expiresAt: number;
}

@Injectable()
export class TryOnService {
  private readonly logger = new Logger(TryOnService.name);
  private readonly imageCache = new Map<string, CachedImage>();
  private readonly publicBase: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly compositor: MlCompositorClient,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    this.publicBase = config.get<string>('API_URL') ?? 'http://localhost:4000';
  }

  getCachedImage(sessionId: string): Buffer | null {
    const entry = this.imageCache.get(sessionId);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.imageCache.delete(sessionId);
      return null;
    }
    return entry.bytes;
  }

  /**
   * Compose a scarf onto a fresh selfie. Returns the composited JPEG as a data URL
   * plus a persisted session id so the mobile client can re-open the same look.
   */
  async createPreview(
    userId: string,
    dto: TryOnRequestDto,
    faceImage: Express.Multer.File,
  ) {
    const started = Date.now();

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: {
        product: {
          select: {
            id: true,
            categoryId: true,
            titleRu: true,
            coverUrl: true,
            attributes: true,
          },
        },
        garmentTemplate: true,
      },
    });
    if (!variant) throw new NotFoundException('VARIANT_NOT_FOUND');
    const category = variant.product.categoryId;
    if (category !== 'scarves' && category !== 'dresses') {
      throw new BadRequestException('CATEGORY_NOT_SUPPORTED_YET');
    }

    const tyingStyle: TyingStyle = dto.tyingStyle ?? 'classical';
    const spec = {
      tyingStyle,
      colorHex: variant.colorHex || '#8A8D5B',
      pattern: this.inferPattern(variant.product.attributes),
    };

    let jpeg: Buffer;
    let mode: 'scarf-template' | 'scarf-procedural' | 'dress-template' = 'scarf-procedural';
    const template = variant.garmentTemplate;

    if (category === 'dresses') {
      // Dresses only work with a real template (no procedural fallback for full-body).
      if (!template || !template.canonicalImageKey) {
        throw new BadRequestException('DRESS_TEMPLATE_MISSING');
      }
      const canonical = await this.storage.read(template.canonicalImageKey);
      jpeg = await this.compositor.composeDressWithTemplate(faceImage, spec, {
        canonical,
        mimetype: 'image/png',
        landmarks: template.landmarks as Record<string, unknown>,
      });
      mode = 'dress-template';
    } else if (template && template.canonicalImageKey) {
      try {
        const canonical = await this.storage.read(template.canonicalImageKey);
        jpeg = await this.compositor.composeScarfWithTemplate(faceImage, spec, {
          canonical,
          mimetype: 'image/png',
          landmarks: template.landmarks as Record<string, unknown>,
        });
        mode = 'scarf-template';
      } catch (err) {
        this.logger.warn(
          `template compose failed for variant ${variant.id}; falling back: ${(err as Error).message}`,
        );
        jpeg = await this.compositor.composeScarf(faceImage, spec);
      }
    } else {
      jpeg = await this.compositor.composeScarf(faceImage, spec);
    }

    const session = await this.prisma.tryOnSession.create({
      data: {
        userId,
        variantId: variant.id,
        tyingStyle,
        latencyMs: Date.now() - started,
      },
    });

    // Cache the JPEG so /tryon/preview/:sessionId/image can stream it back to the client
    // without holding a big base64 payload in the JSON response.
    this.imageCache.set(session.id, {
      bytes: jpeg,
      expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
    });

    const resultUrl = `${this.publicBase}/api/v1/tryon/preview/${session.id}/image`;

    // Persist URL on the session for history lookups.
    await this.prisma.tryOnSession.update({
      where: { id: session.id },
      data: { resultUrl },
    });

    this.logger.log(
      `try-on session ${session.id} composed [${mode}] in ${session.latencyMs}ms (${(jpeg.length / 1024).toFixed(1)} KB)`,
    );

    return {
      sessionId: session.id,
      resultUrl,
      cacheKey: `tryon:${session.id}`,
      latencyMs: session.latencyMs ?? 0,
      expiresAt: new Date(Date.now() + IMAGE_CACHE_TTL_MS).toISOString(),
    };
  }

  async history(userId: string, limit = 20) {
    const sessions = await this.prisma.tryOnSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        variant: {
          include: { product: { select: { titleRu: true, coverUrl: true } } },
        },
      },
    });
    return sessions.map((s) => ({
      sessionId: s.id,
      variantId: s.variantId,
      productTitle: s.variant.product.titleRu,
      productImage: s.variant.product.coverUrl,
      tyingStyle: s.tyingStyle,
      resultUrl: s.resultUrl,
      addedToCart: s.addedToCart,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  private inferPattern(attributes: unknown): 'solid' | 'silk' | 'chiffon' {
    if (attributes && typeof attributes === 'object') {
      const fabric = (attributes as Record<string, unknown>).fabric;
      if (fabric === 'silk' || fabric === 'chiffon') return fabric;
    }
    return 'silk';
  }
}
