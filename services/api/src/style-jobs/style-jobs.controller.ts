import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { StyleJobsService, DressMannequinInput } from './style-jobs.service';
import { StyleJobStatus } from '@prisma/client';

@ApiTags('style-jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StyleJobsController {
  constructor(private readonly jobs: StyleJobsService) {}

  // Seller submits a "dress the mannequin" job for one of their products.
  @Post('seller/products/:id/dress-mannequin')
  submit(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id') productId: string,
    @Body() body: DressMannequinInput,
  ) {
    return this.jobs.submit(user.id, productId, body);
  }

  // Seller polls for the latest status chip.
  @Get('seller/products/:id/dress-mannequin')
  latest(
    @CurrentUser() user: CurrentUserInfo,
    @Param('id') productId: string,
  ) {
    return this.jobs.latestForProduct(user.id, productId);
  }

  // Admin / moderator sees everything in the queue.
  @Get('admin/style-jobs')
  @Roles('admin', 'moderator')
  listAll(
    @Query('status') status?: StyleJobStatus,
    @Query('limit') limit?: string,
  ) {
    return this.jobs.listAll(status, limit ? Number(limit) : 50);
  }
}
