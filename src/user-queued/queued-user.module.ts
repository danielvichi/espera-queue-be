import { Module } from '@nestjs/common';
import { QueuedUserService } from './queued-user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { QueuedUserController } from './queued-user.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [QueuedUserService],
  controllers: [QueuedUserController],
})
export class QueuedUserModule {}
