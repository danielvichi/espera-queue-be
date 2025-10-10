import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiOkResponse } from '@nestjs/swagger';
import { SignInDto } from 'src/admin/admin.dto';
import { validateEmailOrThrow } from 'src/utils/email.utils';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
  UserNotFoundException,
} from './auth.exceptions';
import { type Response } from 'express';
import { type AuthenticatedRequestDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login/admin')
  @ApiOkResponse({
    description:
      'Set an authenticated wrapped in a JWT cookie with the user_token.',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Basic auth header with email and password',
  })
  @ApiBody({ description: 'Admin sign-in', type: SignInDto, required: true })
  async adminSignIn(
    @Body() signInData: SignInDto,
    @Req() req: AuthenticatedRequestDto,
    @Res() res: Response,
  ): Promise<unknown> {
    if (!signInData || !signInData.email || !signInData.passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      );
    }

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

    if (!user) {
      throw new UserNotFoundException(
        defaultAuthExceptionMessage.USER_NOT_FOUNDED,
      );
    }

    const signedJwt = await this.authService.generateJwtForUser(user);
    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send();
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOkResponse({
    description: 'Remove the authenticated user JWT and adds an expired cookie',
  })
  logout(@Req() req, @Res() res: Response) {
    const cookie = this.authService.generateExpiredCookie(req);

    // Tells the client to expire the cookie
    res.setHeader('Set-Cookie', cookie);
    res.send();
  }
}
