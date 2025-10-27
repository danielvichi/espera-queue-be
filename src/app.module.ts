import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UnityModule } from './unity/unity.module';
import { QueueModule } from './queue/queue.module';
import { QueueUserModule } from './queue-user/queue-user.module';

@Module({
  imports: [
    PrismaModule,
    ClientModule,
    AdminModule,
    AuthModule,
    UnityModule,
    QueueModule,
    QueueUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
