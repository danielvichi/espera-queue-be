import { Body, Controller, Get, HttpCode, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SignInDto } from 'src/admin/admin.dto';
import { validateEmailOrThrow } from 'src/utils/email.utils';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
  UserNotFoundException,
} from './auth.exceptions';
import { type Response } from 'express';
import { type AuthenticatedRequestDto } from './auth.dto';
import { ClientService } from 'src/client/client.service';
import { ClientDto } from 'src/client/client.dto';
import { checkSignInRequirementsOrThrow } from './auth.utils';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private clientService: ClientService,
  ) {}

  @Get('login/admin')
  @ApiOkResponse({
    description:
      'Set an authenticated wrapped in a JWT cookie with the user_token for Admin users',
    type: undefined,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Basic auth header with email and password',
  })
  @ApiBody({ description: 'Admin sign-in', type: SignInDto, required: true })
  async checkAdminCredentials(
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

    const user = await this.authService.checkAdminCredentials({
      email,
      passwordHash,
    });

    if (!user) {
      throw new UserNotFoundException(
        defaultAuthExceptionMessage.USER_NOT_FOUNDED,
      );
    }

    let client: ClientDto | null = null;

    client = await this.clientService.getClientById(user.clientId);

    if (client === null) {
      throw new Error('No Client entity admin found');
    }

    const signedJwt = await this.authService.generateJwtForUser({
      ...user,
      client,
    });
    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send();
  }

  @Get('login/queue-user')
  @ApiOkResponse({
    description:
      'Set an authenticated wrapped in a JWT cookie with the user_token, for Queue Users.',
    type: undefined,
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Basic auth header with email and password',
  })
  @ApiBody({
    description: 'Queue User sign-in',
    type: SignInDto,
    required: true,
  })
  async checkQueueUserCredentials(
    @Body() signInData: SignInDto,
    @Req() req: AuthenticatedRequestDto,
    @Res() res: Response,
  ): Promise<unknown> {
    checkSignInRequirementsOrThrow(signInData);

    try {
      validateEmailOrThrow(signInData.email);
    } catch (err) {
      if (err instanceof Error) {
        throw new InvalidCredentialsException(
          defaultAuthExceptionMessage.INVALID_CREDENTIALS,
        );
      }
    }

    if (!signInData.passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.PASSWORD_REQUIRED,
      );
    }

    const user = await this.authService.checkQueueUserCredentials({
      email: signInData.email,
      passwordHash: signInData.passwordHash,
    });

    if (!user) {
      throw new UserNotFoundException(
        defaultAuthExceptionMessage.USER_NOT_FOUNDED,
      );
    }

    const signedJwt = await this.authService.generateJwtForUser({
      ...user,
    });
    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send();
  }

  @Get('logout')
  @HttpCode(204)
  @ApiOkResponse({
    description: 'Remove the authenticated user JWT and adds an expired cookie',
    type: undefined,
  })
  logout(@Req() req, @Res() res: Response) {
    const cookie = this.authService.generateExpiredCookie(req);

    // Tells the client to expire the cookie
    res.setHeader('Set-Cookie', cookie);
    res.send();
  }
}
