import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Public home-page carousel feed. Only active ads, ordered by sortOrder. */
  listActive() {
    return this.prisma.advertisement.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, imageUrl: true, linkUrl: true, title: true },
    });
  }

  /** Admin feed. Includes drafts (active=false) and ordering metadata. */
  listAll() {
    return this.prisma.advertisement.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(input: {
    image: Express.Multer.File;
    title?: string;
    linkUrl?: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    if (!input.image) throw new BadRequestException('IMAGE_REQUIRED');
    const saved = await this.storage.save(
      'ads',
      input.image.buffer,
      input.image.mimetype || 'image/jpeg',
      input.image.originalname || 'ad.jpg',
    );
    return this.prisma.advertisement.create({
      data: {
        title: input.title?.trim() || null,
        imageUrl: saved.url,
        linkUrl: input.linkUrl?.trim() || null,
        sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
        active: input.active !== false,
      },
    });
  }

  async update(
    id: string,
    patch: { title?: string; linkUrl?: string; sortOrder?: number; active?: boolean },
  ) {
    const existing = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('AD_NOT_FOUND');
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        title: patch.title !== undefined ? (patch.title.trim() || null) : undefined,
        linkUrl: patch.linkUrl !== undefined ? (patch.linkUrl.trim() || null) : undefined,
        sortOrder: patch.sortOrder !== undefined ? Number(patch.sortOrder) : undefined,
        active: patch.active !== undefined ? Boolean(patch.active) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('AD_NOT_FOUND');
    await this.prisma.advertisement.delete({ where: { id } });
    return { id, deleted: true };
  }
}
