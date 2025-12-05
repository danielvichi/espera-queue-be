import { Request } from 'express';

export default function extractTokenFromHeader(
  request: Request,
): string | undefined {
  if (!request.headers.cookie) {
    return undefined;
  }

  if (!request.headers.cookie.includes('user_token=')) {
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
