import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiOkResponse } from '@nestjs/swagger';
import { SignInDto } from 'src/admin/admin.dto';
import { validateEmailOrThrow } from 'src/utils/email.utils';
import { JwtService } from '@nestjs/jwt';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';

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

    try {
      validateEmailOrThrow(email);
    } catch (err) {
      if (err instanceof Error) {
        throw new InvalidCredentialsException(
          defaultAuthExceptionMessage.INVALID_CREDENTIALS,
        );
      }
    }

    if (!passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.PASSWORD_REQUIRED,
      );
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
