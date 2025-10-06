import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiOkResponse } from '@nestjs/swagger';
import { SignInDto } from 'src/admin/admin.dto';
import { validateEmailOrThrow } from 'src/utils/email.utils';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Get('admin/signin')
  @ApiOkResponse()
  @ApiHeader({
    name: 'Authorization',
    description: 'Basic auth header with email and password',
  })
  @ApiBody({ description: 'Admin sign-in', type: SignInDto, required: true })
  async adminSignIn(
    @Body() signInData: SignInDto,
  ): Promise<{ access_token: string }> {
    const { email, passwordHash } = signInData;

    validateEmailOrThrow(email);
    if (!passwordHash) {
      throw new Error('Password is required');
    }

    const user = await this.authService.adminSignIn({
      email,
      passwordHash,
    });

    const payload = { sub: user?.clientId, user: user };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
