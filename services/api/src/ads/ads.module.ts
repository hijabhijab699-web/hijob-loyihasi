import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsAdminController, AdsPublicController } from './ads.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AdsPublicController, AdsAdminController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
