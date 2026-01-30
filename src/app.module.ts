import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UnityModule } from './unity/unity.module';
import { QueueModule } from './queue/queue.module';
import { UserModule } from './user/user.module';
import { QueuedUserController } from './user-queued/queued-user.controller';
import { QueuedUserModule } from './user-queued/queued-user.module';

@Module({
  imports: [
    PrismaModule,
    ClientModule,
    AdminModule,
    AuthModule,
    UnityModule,
    QueueModule,
    UserModule,
    QueuedUserModule,
  ],
  controllers: [AppController, QueuedUserController],
  providers: [AppService],
})
export class AppModule {}
