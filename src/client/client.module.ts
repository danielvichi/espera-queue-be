import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientController } from './client.controller';
import { AuthService } from 'src/auth/auth.service';
import { AdminService } from 'src/admin/admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [ClientService, AuthService, AdminService],
  exports: [ClientService],
})
export class ClientModule {}
