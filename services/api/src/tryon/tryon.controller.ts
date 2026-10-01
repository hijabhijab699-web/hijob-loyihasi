import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { TryOnService } from './tryon.service';
import { TryOnRequestDto } from './dto';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

@ApiTags('tryon')
@Controller('tryon')
export class TryOnController {
  constructor(private readonly tryon: TryOnService) {}

  @Post('preview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('face', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  preview(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: TryOnRequestDto,
    @UploadedFile() face: Express.Multer.File,
  ) {
    if (!face) throw new BadRequestException('FACE_IMAGE_REQUIRED');
    return this.tryon.createPreview(user.id, dto, face);
  }

  /**
   * Face-swap try-on against a seller-published styled mannequin photo.
   * The buyer picks a variant, we drop their face onto the mannequin, and
   * they see themselves wearing that hijab.
   */
  @Post('faceswap')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('face', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  faceswap(
    @CurrentUser() user: CurrentUserInfo,
    @Body() dto: { variantId: string },
    @UploadedFile() face: Express.Multer.File,
  ) {
    if (!face) throw new BadRequestException('FACE_IMAGE_REQUIRED');
    if (!dto?.variantId) throw new BadRequestException('VARIANT_ID_REQUIRED');
    return this.tryon.createFaceSwap(user.id, dto.variantId, face);
  }

  /**
   * Public image stream — anyone with the session id can view (short TTL, ephemeral).
   * The URL is only handed to the requesting client so it stays effectively private.
   */
  @Get('preview/:sessionId/image')
  async streamImage(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const bytes = this.tryon.getCachedImage(sessionId);
    if (!bytes) throw new NotFoundException('IMAGE_EXPIRED_OR_MISSING');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(bytes);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: CurrentUserInfo, @Query('limit') limit?: string) {
    return this.tryon.history(user.id, limit ? Number(limit) : 20);
  }
}
