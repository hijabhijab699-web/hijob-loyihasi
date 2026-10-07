import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { TryOnModule } from '../tryon/tryon.module';
import { StyleJobsService } from './style-jobs.service';
import { StyleJobsController } from './style-jobs.controller';
import { StyleJobsWorker } from './style-jobs.worker';

@Module({
  imports: [PrismaModule, StorageModule, TryOnModule],
  controllers: [StyleJobsController],
  providers: [StyleJobsService, StyleJobsWorker],
  exports: [StyleJobsService],
})
export class StyleJobsModule {}
