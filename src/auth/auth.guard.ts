import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedRequestDto } from './auth.dto';

const JWT_SECRET = process.env.JWT_PUBLIC_KEY;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AuthenticatedRequestDto>(token, {
          publicKey: JWT_SECRET,
          algorithms: ['ES256'],
        });

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    if (!request.headers.cookie) {
      return undefined;
    }

    const userTokenCookie = request.headers.cookie
      .split('user_token=')[1]
      .split(';')[0];

    if (!userTokenCookie) {
      return undefined;
    }

    const userTokenFromCookie = userTokenCookie;

    return userTokenFromCookie;
  }
}
