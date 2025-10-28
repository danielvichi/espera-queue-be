import { IncomingHttpHeaders } from 'http';
import { COOKIE_MAX_AGE_IN_MS } from 'src/constants/config';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';

const baseUrlDomain = process.env.BASE_URL_DOMAIN ?? 'localhost';

const setCookieConfig = (cookie: Array<string>) => {
  cookie.push(`domain=${baseUrlDomain}`);
  // Setting to `/` to make sure the cookie is sent to all routes (https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#define_where_cookies_are_sent)
  cookie.push('path=/');
  // Setting HttpOnly to prevent any client-side JS access to cookie
  cookie.push('HttpOnly');
  // Setting `Secure` to prevent sending the cookie over HTTP (except for localhost)
  cookie.push('Secure');
};

const generateCookie =
  (data: { cookieName: string; maxAgeInMs: number }) =>
  (curriedFuncData: { headers: IncomingHttpHeaders; signedJwt: string }) => {
    const cookie = [`${data.cookieName}=${curriedFuncData.signedJwt}`];

    // Mutate cookie Array
    setCookieConfig(cookie);

    // For Safari, `max-age` to be all lowercase, that's why we don't use `res.cookie()` to set cookies
    cookie.push(`max-age=${Math.floor(data.maxAgeInMs / 1000)}`);

    return cookie.join(';');
  };

/** Generate session Cookies strings with our defaults */
export const generateUserTokenCookie = generateCookie({
  cookieName: 'user_token',
  maxAgeInMs: COOKIE_MAX_AGE_IN_MS,
});

export const generateExpiredUserTokenCookie = generateCookie({
  cookieName: 'user_token',
  maxAgeInMs: 0,
});

export function checkSignInRequirementsOrThrow(data: {
  email: string;
  passwordHash: string;
}) {
  if (!data) {
    throw new InvalidCredentialsException(
      defaultAuthExceptionMessage.INVALID_CREDENTIALS,
    );
  }

  if (
    !data.email ||
    typeof data.email !== 'string' ||
    data.email.trim() === ''
  ) {
    throw new InvalidCredentialsException(
      defaultAuthExceptionMessage.INVALID_CREDENTIALS,
    );
  }

  if (
    !data.passwordHash ||
    typeof data.passwordHash !== 'string' ||
    data.passwordHash.trim() === ''
  ) {
    throw new InvalidCredentialsException(
      defaultAuthExceptionMessage.INVALID_CREDENTIALS,
    );
  }
}
