import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UnityModule } from './unity/unity.module';

@Module({
  imports: [PrismaModule, ClientModule, AdminModule, AuthModule, UnityModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
