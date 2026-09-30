import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BodyParamsDto } from './dto';
import { ClothingSize, FaceTemplateStatus } from '@prisma/client';
import { MlFaceClient } from './ml-face.client';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlFace: MlFaceClient,
    private readonly config: ConfigService,
  ) {}

  async uploadFace(
    userId: string,
    files: {
      front: Express.Multer.File;
      left?: Express.Multer.File;
      right?: Express.Multer.File;
    },
  ) {
    const template = await this.mlFace.extractTemplate(files);

    const ttlDays = Number(this.config.get<string>('FACE_TEMPLATE_TTL_DAYS') ?? 30);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000);

    await this.prisma.$transaction([
      this.prisma.faceTemplate.upsert({
        where: { userId },
        create: {
          userId,
          version: template.version,
          status: FaceTemplateStatus.ready,
          landmarks: template.views as unknown as object,
          skinTone: template.skin_tone as unknown as object,
          proportions: template.proportions as unknown as object,
          expiresAt,
        },
        update: {
          version: template.version,
          status: FaceTemplateStatus.ready,
          landmarks: template.views as unknown as object,
          skinTone: template.skin_tone as unknown as object,
          proportions: template.proportions as unknown as object,
          lastUsedAt: new Date(),
          expiresAt,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { onboardingFaceDone: true },
      }),
    ]);

    return {
      status: 'ready' as const,
      warnings: template.warnings,
      views: template.views.map((v) => ({
        view: v.view,
        detected: v.detected,
        landmarks: v.landmarks_2d.length,
      })),
    };
  }

  async saveBodyParams(userId: string, dto: BodyParamsDto) {
    await this.prisma.$transaction([
      this.prisma.bodyParams.upsert({
        where: { userId },
        create: {
          userId,
          heightCm: dto.heightCm,
          weightKg: dto.weightKg,
          age: dto.age,
          preferredSize: dto.preferredSize as ClothingSize,
        },
        update: {
          heightCm: dto.heightCm,
          weightKg: dto.weightKg,
          age: dto.age,
          preferredSize: dto.preferredSize as ClothingSize,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { onboardingBodyDone: true },
      }),
    ]);

    return { ok: true };
  }

  async getBodyParams(userId: string) {
    const params = await this.prisma.bodyParams.findUnique({ where: { userId } });
    if (!params) throw new NotFoundException('BODY_PARAMS_NOT_SET');
    return params;
  }

  async getFaceStatus(userId: string) {
    const template = await this.prisma.faceTemplate.findUnique({
      where: { userId },
      select: { status: true, createdAt: true, expiresAt: true },
    });

    if (!template) return { status: 'none' as const };

    return {
      status: template.status,
      createdAt: template.createdAt.toISOString(),
      expiresAt: template.expiresAt.toISOString(),
    };
  }

  async deleteFaceTemplate(userId: string) {
    await this.prisma.faceTemplate.deleteMany({ where: { userId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingFaceDone: false },
    });
    return { ok: true };
  }
}
