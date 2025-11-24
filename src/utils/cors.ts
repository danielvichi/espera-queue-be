import { BadRequestException } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Request } from 'express';

export class NotAllowedByCorsException extends BadRequestException {
  constructor(origin: string | undefined) {
    super({
      error: 'NotAllowedByCorsException',
      message: `Not allowed by CORS - origin: ${origin}`,
    });
  }
}

const isOriginAllowed = (
  origin: string | undefined,
  allowList: string[],
): boolean => {
  const isOriginNotDefinedOrNull = !origin || origin === 'null';
  if (isOriginNotDefinedOrNull) {
    return true;
  }

  return allowList.some((allowedOrigin) => {
    try {
      // Parse origin URL
      const originUrl = new URL(origin);

      // Handle wildcard subdomains (*.example.com)
      if (allowedOrigin.startsWith('https://*.')) {
        const domain = allowedOrigin.split('https://*.')[1];
        return originUrl.hostname.endsWith(domain);
      }

      // Exact match
      return origin === allowedOrigin;
    } catch (error) {
      // If URL parsing fails, fall back to simple string comparison
      throw Error(error);
      return origin === allowedOrigin;
    }
  });
};

export const corsOptionsDelegate = (
  req: Request,
  callback: (error: Error | null, options?: CorsOptions) => void,
) => {
  const corsOptions: CorsOptions = {
    credentials: true,
  };

  const corsAllowList = process.env.CORS_ALLOW_LIST;

  if (!corsAllowList) {
    callback(new Error('CORS_ALLOW_LIST environment variable is not defined'));
    return;
  }

  const origin = req.header('Origin');
  const path = req.path || req.header(':path');
  const method = req.method || req.header(':method');

  let corsAllowlist: string[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    corsAllowlist = JSON.parse(corsAllowList);

    if (!Array.isArray(corsAllowlist)) {
      callback(new Error('CORS_ALLOW_LIST must be a valid JSON array'));
      return;
    }
  } catch (parseError) {
    console.error(parseError);
    callback(new Error('CORS_ALLOW_LIST must be a valid JSON array'));
    return;
  }

  // Check if the request is for metadata with the correct pattern and method
  const isMetadataRequest =
    path &&
    typeof path === 'string' &&
    path.match(/^\/metadata\/[a-zA-Z0-9-]+\/\d+$/) &&
    method === 'GET';

  if (isOriginAllowed(origin, corsAllowlist)) {
    corsOptions.origin = true; // reflect (enable) the requested origin
  } else if (isMetadataRequest) {
    corsOptions.origin = false; // disable CORS for metadata requests
  } else {
    callback(new NotAllowedByCorsException(origin), undefined);
    return;
  }

  callback(null, corsOptions);
};
