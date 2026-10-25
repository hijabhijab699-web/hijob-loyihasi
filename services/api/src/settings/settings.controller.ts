import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserInfo } from '../auth/current-user.decorator';
import { SettingsService } from './settings.service';

class SetRateDto {
  @IsNumber()
  @Min(1)
  @Max(1_000_000)
  rate!: number;
}

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Public — mobile reads this once on launch so UZS prices stay accurate
  // even when the catalog returns USD alone.
  @Get('settings/rate')
  async getRate() {
    const rate = await this.settings.getRate();
    return { usdToUzsRate: rate };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/settings/rate')
  async setRate(@CurrentUser() user: CurrentUserInfo, @Body() dto: SetRateDto) {
    return this.settings.setRate(user.id, dto.rate);
  }
}
