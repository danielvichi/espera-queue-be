import { Injectable } from '@nestjs/common';
import { AdminResponseDto, AdminWithClientDto } from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  generateExpiredUserTokenCookie,
  generateUserTokenCookie,
} from './auth.utils';
import { AuthenticatedRequestDto } from './auth.dto';

interface AdminSignIn {
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  async adminSignIn(data: AdminSignIn): Promise<AdminResponseDto | null> {
    const adminUser = await this.adminService.findAdminByEmail(data.email);

    if (!adminUser) {
      return null;
    }

    const { passwordHash, ...adminDataWithoutPassword } = adminUser;
    if (data.passwordHash !== passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      );
    }

    return adminDataWithoutPassword;
  }

  async generateJwtToken(
    payload: Record<any, any>,
    options: Omit<JwtSignOptions, 'privateKey'> = {},
  ): Promise<string> {
    const token = await this.jwtService
      .signAsync(payload, {
        ...options,
        algorithm: 'ES256',
        // ...(paydload.iss ? {} : { issuer: this.issuer}),
      })
      .catch((err) => {
        throw new Error(err ?? 'generateJwtToken - unknown error');
      });

    return token;
  }

  async generateJwtForUser(user: AdminWithClientDto) {
    return this.generateJwtToken(
      {
        ...user,
      },
      {
        expiresIn: '1h',
        subject: user.id.toString(),
      },
    );
  }

  generateJwtCookie(req: AuthenticatedRequestDto, payload: string) {
    const userTokenCookie = generateUserTokenCookie({
      headers: req.headers,
      signedJwt: payload,
    });

    return userTokenCookie;
  }

  generateExpiredCookie(req: AuthenticatedRequestDto) {
    const userTokenCookie = generateExpiredUserTokenCookie({
      headers: req.headers,
      signedJwt: '',
    });

    return userTokenCookie;
  }
}
