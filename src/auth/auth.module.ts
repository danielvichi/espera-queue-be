import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminModule } from 'src/admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientModule } from 'src/client/client.module';

const jwtModule = JwtModule.register({
  global: true,
  privateKey: process.env.JWT_PRIVATE_KEY,
  publicKey: process.env.JWT_PUBLIC_KEY,
  signOptions: {
    expiresIn: '15m',
    algorithm: 'ES256',
  },
});

@Module({
  imports: [PrismaModule, AdminModule, ClientModule, jwtModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
