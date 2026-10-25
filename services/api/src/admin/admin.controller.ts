import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

/**
 * All /admin endpoints require role=admin OR role=moderator. Attach the pair
 * of guards at the controller level so the role check sees the JWT user.
 */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'moderator')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  /* ─ sellers ─ */

  @Get('sellers')
  listSellers() {
    return this.admin.listSellers();
  }

  @Patch('sellers/:id/verify')
  verifySeller(@Param('id') id: string, @Body() body: { verified: boolean }) {
    return this.admin.setSellerVerified(id, Boolean(body.verified));
  }

  @Patch('sellers/:id/ban')
  banSeller(@Param('id') id: string, @Body() body: { banned: boolean }) {
    return this.admin.banSellerUser(id, Boolean(body.banned));
  }

  @Delete('sellers/:id')
  deleteSeller(@Param('id') id: string) {
    return this.admin.deleteSeller(id);
  }

  @Patch('sellers/:id/tier')
  setSellerTier(
    @Param('id') id: string,
    @Body() body: { isTop?: boolean; isPremium?: boolean },
  ) {
    return this.admin.setSellerTier(id, {
      isTop: body.isTop,
      isPremium: body.isPremium,
    });
  }

  /* ─ agents (TZ Phase 11) ─ */

  @Get('agents')
  listAgents() {
    return this.admin.listAgents();
  }

  /* ─ categories ─ */

  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: {
      nameUz?: string;
      nameRu?: string;
      nameEn?: string;
      iconUrl?: string | null;
      coverUrl?: string | null;
      order?: number;
    },
  ) {
    return this.admin.updateCategory(id, body);
  }

  /* ─ products ─ */

  @Get('products')
  listProducts(@Query('status') status?: string) {
    if (status && !isProductStatus(status)) {
      throw new BadRequestException('INVALID_STATUS');
    }
    return this.admin.listProducts(status as ProductStatus | undefined);
  }

  @Patch('products/:id/status')
  setProductStatus(@Param('id') id: string, @Body() body: { status: string }) {
    if (!isProductStatus(body.status)) {
      throw new BadRequestException('INVALID_STATUS');
    }
    return this.admin.setProductStatus(id, body.status as ProductStatus);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  /* ─ users ─ */

  @Get('users')
  listUsers(@Query('role') role?: string) {
    const allowed = ['buyer', 'seller', 'admin', 'moderator'];
    if (role && !allowed.includes(role)) throw new BadRequestException('INVALID_ROLE');
    return this.admin.listUsers(role as 'buyer' | 'seller' | 'admin' | 'moderator' | undefined);
  }

  @Patch('users/:id/role')
  setUserRole(
    @Param('id') id: string,
    @Body() body: { role: 'buyer' | 'seller' | 'admin' | 'moderator' | 'agent' },
  ) {
    const allowed = ['buyer', 'seller', 'admin', 'moderator', 'agent'];
    if (!allowed.includes(body?.role)) {
      throw new BadRequestException('INVALID_ROLE');
    }
    return this.admin.setUserRole(id, body.role);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() body: { banned: boolean }) {
    return this.admin.banUser(id, Boolean(body.banned));
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.admin.deleteUser(id);
  }

  /* ─ orders ─ */

  @Get('orders')
  listOrders() {
    return this.admin.listOrders();
  }
}

function isProductStatus(v: string): v is ProductStatus {
  return ['draft', 'pending', 'published', 'archived', 'rejected'].includes(v);
}
