import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { BannersService } from './banners.service';

class CreateTemplateDto {
  @IsString() bgUrl!: string;
  @IsOptional() @IsString() previewUrl?: string;
  @IsOptional() @IsString() @Length(0, 80) nameUz?: string;
  @IsOptional() @IsString() @Length(0, 80) nameRu?: string;
  @IsOptional() @IsIn(['light', 'dark']) textStyle?: 'light' | 'dark';
}

class UpsertBannerDto {
  @IsOptional() @IsUUID() templateId?: string | null;
  @IsOptional() @IsString() customImageUrl?: string | null;
  @IsOptional() @IsString() @Length(0, 80) title?: string | null;
  @IsOptional() @IsString() @Length(0, 160) subtitle?: string | null;
  @IsOptional() @IsUUID() productId?: string | null;
  @IsOptional() @IsString() @Length(0, 40) ctaLabelUz?: string | null;
  @IsOptional() @IsString() @Length(0, 40) ctaLabelRu?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('banners')
@ApiBearerAuth()
@Controller()
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  // Public templates list (seller UI picks from these; buyer client
  // reads nothing here).
  @Get('banner-templates')
  listTemplates() {
    return this.banners.listTemplates();
  }

  // Public home carousel
  @Get('catalog/active-banners')
  listActive() {
    return this.banners.listActivePublic();
  }

  // ─── Seller endpoints ─────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Get('seller/banners')
  listMine(@CurrentUser() user: CurrentUserInfo) {
    return this.banners.listMine(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Post('seller/banners')
  create(@CurrentUser() user: CurrentUserInfo, @Body() dto: UpsertBannerDto) {
    return this.banners.createMine(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Patch('seller/banners/:id')
  update(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertBannerDto,
  ) {
    return this.banners.updateMine(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Delete('seller/banners/:id')
  remove(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.banners.deleteMine(user.id, id);
  }

  // ─── Admin endpoints ──────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/banner-templates')
  adminCreateTemplate(@Body() dto: CreateTemplateDto) {
    return this.banners.createTemplate(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/banner-templates/:id')
  adminDeleteTemplate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.banners.deleteTemplate(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/banner-pending')
  adminListPending() {
    return this.banners.adminListPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/banners/:id/approve')
  adminApprove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { approve: boolean },
  ) {
    return this.banners.adminApprove(id, Boolean(body.approve));
  }
}
