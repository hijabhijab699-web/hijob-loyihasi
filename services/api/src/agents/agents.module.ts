import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [PrismaModule],
  providers: [AgentsService],
  controllers: [AgentsController],
})
export class AgentsModule {}
