import { Module } from '@nestjs/common';
import { UnityController } from './unity.controller';
import { UnityService } from './unity.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UnityController],
  providers: [UnityService],
})
export class UnityModule {}
