import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminModule } from 'src/admin/admin.module';
import { JwtModule } from '@nestjs/jwt';

const JWT_SECRET = process.env.JWT_PUBLIC_KEY;

const jwtModule = JwtModule.register({
  global: true,
  secret: JWT_SECRET,
  signOptions: {
    expiresIn: '15m',
  },
});

@Module({
  imports: [AdminModule, jwtModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
