import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

class StartPurchaseDto {
  @IsEnum(['monthly', 'halfyear', 'yearly'])
  plan!: SubscriptionPlan;
}

class ActivateDto {
  @IsOptional()
  @IsString()
  priceUzs?: string; // BigInt as string in JSON
}

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller()
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  // ─── Seller endpoints ──────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Get('seller/subscription')
  current(@CurrentUser() user: CurrentUserInfo) {
    return this.subs.currentForUser(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('seller', 'admin')
  @Post('seller/subscription/purchase')
  purchase(@CurrentUser() user: CurrentUserInfo, @Body() dto: StartPurchaseDto) {
    return this.subs.startPurchase(user.id, dto.plan);
  }

  // ─── Admin endpoints ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/subscriptions')
  listAll(@Query('status') status?: SubscriptionStatus) {
    return this.subs.listAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/subscriptions/:id/activate')
  activate(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ActivateDto,
  ) {
    const priceUzs = dto.priceUzs ? BigInt(dto.priceUzs) : undefined;
    return this.subs.activate(user.id, id, priceUzs);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/subscriptions/:id/cancel')
  cancel(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.subs.cancel(user.id, id);
  }
}
