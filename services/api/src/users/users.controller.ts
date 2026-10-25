import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsEnum(['uz', 'ru', 'en', 'ar'])
  language?: 'uz' | 'ru' | 'en' | 'ar';
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: CurrentUserInfo) {
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      fullName: user.fullName,
      avatarUrl: row?.avatarUrl ?? null,
      role: user.role,
      language: user.language,
      onboarding: {
        faceCaptured: user.onboardingFaceDone,
        bodyProvided: user.onboardingBodyDone,
      },
    };
  }

  // Lets the mobile Settings → Profile details screen save the user's own
  // name and language. Username and phone stay immutable because they
  // double as the login identifier and are tied to the OTP flow.
  @Patch('me')
  async updateMe(@CurrentUser() user: CurrentUserInfo, @Body() dto: UpdateMeDto) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.language !== undefined && { language: dto.language }),
      },
    });
    return {
      id: updated.id,
      username: updated.username,
      phone: updated.phone,
      fullName: updated.fullName,
      avatarUrl: updated.avatarUrl,
      role: updated.role,
      language: updated.language,
      onboarding: {
        faceCaptured: updated.onboardingFaceDone,
        bodyProvided: updated.onboardingBodyDone,
      },
    };
  }

  // Avatar upload — accepts one image, saves it under avatars/, stores the
  // public URL on the user row and returns it. The old file is left behind
  // to keep this call idempotent on retries; a sweep job can prune later.
  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: MAX_AVATAR_BYTES } }))
  async uploadAvatar(
    @CurrentUser() user: CurrentUserInfo,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('NO_FILE');
    if (!/^image\//.test(file.mimetype)) throw new BadRequestException('NOT_IMAGE');
    const saved = await this.storage.save(
      `avatars/${user.id}`,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl: saved.url } });
    return { avatarUrl: saved.url };
  }

  @Patch('me/avatar/remove')
  async removeAvatar(@CurrentUser() user: CurrentUserInfo) {
    await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
    return { avatarUrl: null };
  }
}
