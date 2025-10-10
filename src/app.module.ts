import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './client/client.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [PrismaModule, ClientModule, QueueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
