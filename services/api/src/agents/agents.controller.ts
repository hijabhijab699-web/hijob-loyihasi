import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { AgentsService } from './agents.service';

class OnboardShopDto {
  @IsString() @Length(2, 120) ownerFullName!: string;
  @IsString() @Length(3, 32) ownerUsername!: string;
  @IsString() @Matches(/^\+?\d{9,15}$/) ownerPhone!: string;
  @IsString() @Length(6, 100) ownerPassword!: string;
  @IsOptional() @IsEnum(['uz', 'ru', 'en', 'ar']) ownerLanguage?: 'uz' | 'ru' | 'en' | 'ar';

  @IsString() @Length(1, 120) brandName!: string;
  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() @Length(0, 80) country?: string;
  @IsOptional() @IsString() @Length(0, 80) city?: string;
  @IsOptional() @IsString() @Length(0, 120) district?: string;
  @IsOptional() @IsString() @Length(0, 300) addressLine?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
}

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('agent', 'admin')
@Controller('agent')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post('shops')
  onboard(@CurrentUser() user: CurrentUserInfo, @Body() dto: OnboardShopDto) {
    return this.agents.onboardShop(user.id, dto);
  }

  @Get('shops')
  myShops(@CurrentUser() user: CurrentUserInfo) {
    return this.agents.listMyShops(user.id);
  }

  @Get('stats')
  stats(@CurrentUser() user: CurrentUserInfo) {
    return this.agents.stats(user.id);
  }
}
