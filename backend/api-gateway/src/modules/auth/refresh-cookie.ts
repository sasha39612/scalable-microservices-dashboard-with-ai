import { CookieOptions, Request, Response } from 'express';

export const REFRESH_COOKIE_NAME = 'refresh_token';

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const UNIT_MS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/**
 * Convert a JWT-style duration ("7d", "12h", "900s") to milliseconds
 */
function durationToMs(value: string | undefined): number {
  const match = value?.match(/^(\d+)([smhd])$/);
  return match ? Number(match[1]) * UNIT_MS[match[2]] : DEFAULT_MAX_AGE_MS;
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    // COOKIE_SECURE=false is only for serving over plain http (no domain / TLS yet)
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
    sameSite: 'strict',
    // The browser only talks to the Next.js proxy, which serves GraphQL at /api/graphql
    path: process.env.REFRESH_COOKIE_PATH || '/api/graphql',
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...cookieOptions(),
    maxAge: durationToMs(process.env.JWT_REFRESH_EXPIRATION),
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions());
}

export function readRefreshCookie(req: Request): string | undefined {
  return req.cookies?.[REFRESH_COOKIE_NAME];
}
