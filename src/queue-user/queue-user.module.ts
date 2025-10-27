import { Module } from '@nestjs/common';
import { QueueUserService } from './queue-user.service';
import { QueueUserController } from './queue-user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QueueUserService],
  controllers: [QueueUserController],
})
export class QueueUserModule {}
