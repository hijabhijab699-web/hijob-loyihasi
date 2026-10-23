import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdsService } from './ads.service';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Public feed consumed by the mobile home-page carousel. */
@ApiTags('ads')
@Controller('ads')
export class AdsPublicController {
  constructor(private readonly ads: AdsService) {}

  @Get()
  list() {
    return this.ads.listActive();
  }
}

/** Admin surface for curating banners. */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Controller('admin/ads')
export class AdsAdminController {
  constructor(private readonly ads: AdsService) {}

  @Get()
  list() {
    return this.ads.listAll();
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  create(
    @UploadedFile() image: Express.Multer.File,
    @Body() body: { title?: string; linkUrl?: string; sortOrder?: string; active?: string },
  ) {
    if (!image) throw new BadRequestException('IMAGE_REQUIRED');
    return this.ads.create({
      image,
      title: body.title,
      linkUrl: body.linkUrl,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      active: body.active !== undefined ? body.active !== 'false' : undefined,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; linkUrl?: string; sortOrder?: number; active?: boolean },
  ) {
    return this.ads.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ads.remove(id);
  }
}
