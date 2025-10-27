import { Module } from '@nestjs/common';
import { QueueUserService } from './queue-user.service';
import { QueueUserController } from './queue-user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [QueueUserService],
  controllers: [QueueUserController],
})
export class QueueUserModule {}
