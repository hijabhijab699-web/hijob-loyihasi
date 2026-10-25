import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [UsersController],
})
export class UsersModule {}
