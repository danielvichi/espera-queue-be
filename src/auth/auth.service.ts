import { Injectable } from '@nestjs/common';
import { AdminResponseDto, AdminWithClientDto } from 'src/admin/admin.dto';
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
import { QueueUserDto } from 'src/queue-user/queue-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

interface SignInCredentials {
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Returns admin data for a Sign In session
   *
   * @param {SignInCredentials} data - Admin credentials for a Sign in session
   * @returns {Promise<AdminResponseDto>}
   */
  async checkAdminCredentials(
    data: SignInCredentials,
  ): Promise<AdminResponseDto | null> {
    const adminUser = await this.prismaService.admin.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!adminUser) {
      return null;
    }

    const { passwordHash, ...adminDataWithoutPassword } = adminUser;
    // If the password DOES NOT MATCH throw invalid credentials
    if (data.passwordHash !== passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      );
    }

    return adminDataWithoutPassword;
  }

  /**
   * Returns Queue User data for a Sign In session
   *
   * @param {SignInCredentials}data
   * @returns {Promise<QueueUserDto>}
   */
  async checkQueueUserCredentials(
    data: SignInCredentials,
  ): Promise<QueueUserDto | null> {
    const queueUser = await this.prismaService.queueUser.findFirst({
      where: {
        email: data.email,
      },
    });

    if (!queueUser) {
      return null;
    }

    const { passwordHash, ...queueUserWithoutPassword } = queueUser;
    if (data.passwordHash !== passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      );
    }

    return queueUserWithoutPassword;
  }

  // TODO - IMPROVE
  /**
   * Generates a JWT token with the provided payload and signing options
   *
   * This method uses the ES256 (ECDSA P-256) signing algorithm to create a secure JWT token.
   * The private key is automatically handled by the JWT service configuration.
   *
   * @param {Record<any, any>} payload - The data to be encoded in the token payload
   * @param {Omit<JwtSignOptions, 'privateKey'> = {}} options
   * @returns {Promise<string>} - JWT signing options excluding privateKey.
   */
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

  /**
   * Returns a signed JWT token for an admin user data
   *
   * @param {AdminWithClientDto} user
   * @returns {Promise<string>}
   */
  async generateJwtForUser(
    user: AdminWithClientDto | QueueUserDto,
  ): Promise<string> {
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

  /**
   * Generates an HTTP cookie containing a JWT token for authentication
   *
   * @param {AuthenticatedRequestDto} req - The authenticated request object containing headers
   * @param {string} payload - The signed JWT token string to be stored in the cookie.
   * @returns {string} A formatted HTTP Set-Cookie header value ready to be set in the response
   */
  generateJwtCookie(req: AuthenticatedRequestDto, payload: string): string {
    const userTokenCookie = generateUserTokenCookie({
      headers: req.headers,
      signedJwt: payload,
    });

    return userTokenCookie;
  }

  /**
   * Generates an expired authentication cookie to invalidate the user's session
   *
   * @param {AuthenticatedRequestDto} req
   * @returns {string}
   */
  generateExpiredCookie(req: AuthenticatedRequestDto): string {
    const userTokenCookie = generateExpiredUserTokenCookie({
      headers: req.headers,
      signedJwt: '',
    });

    return userTokenCookie;
  }
}
