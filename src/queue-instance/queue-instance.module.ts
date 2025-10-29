import { Module } from '@nestjs/common';
import { QueueInstanceController } from './queue-instance.controller';
import { QueueInstanceService } from './queue-instance.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QueueInstanceController],
  providers: [QueueInstanceService],
})
export class QueueInstanceModule {}
