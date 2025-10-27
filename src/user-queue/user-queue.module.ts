import { Module } from '@nestjs/common';
import { UserQueueService } from './user-queue.service';
import { UserQueueController } from './user-queue.controller';

@Module({
  providers: [UserQueueService],
  controllers: [UserQueueController],
})
export class UserQueueModule {}
