import { Module } from '@nestjs/common';
import { QueuedUserService } from './queued-user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QueuedUserController } from './queued-user.controller';

@Module({
  imports: [PrismaModule],
  providers: [QueuedUserService],
  controllers: [QueuedUserController],
})
export class QueuedUserModule {}
