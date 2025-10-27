import { Module } from '@nestjs/common';
import { UserQueueService } from './user-queue.service';
import { UserQueueController } from './user-queue.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserQueueService],
  controllers: [UserQueueController],
})
export class UserQueueModule {}
