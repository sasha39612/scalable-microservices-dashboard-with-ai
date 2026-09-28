import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

export const IS_PUBLIC_KEY = 'isPublic';

const MIN_PRODUCTION_KEY_LENGTH = 32;
const PLACEHOLDER_PATTERN = /change-in-production|replace|changeme/i;

/**
 * Guards internal service-to-service traffic with a shared API key.
 * Fails closed: without a configured key every non-public request is rejected,
 * and in production the service refuses to start without a strong key.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey: string;

  constructor(private reflector: Reflector) {
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';

    if (process.env.NODE_ENV === 'production') {
      if (!this.apiKey) {
        throw new Error('AI_SERVICE_API_KEY must be set in production');
      }
      if (this.apiKey.length < MIN_PRODUCTION_KEY_LENGTH || PLACEHOLDER_PATTERN.test(this.apiKey)) {
        throw new Error(
          `AI_SERVICE_API_KEY must be a real secret of at least ${MIN_PRODUCTION_KEY_LENGTH} characters in production`,
        );
      }
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const header = context.switchToHttp().getRequest<Request>().headers['x-api-key'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (!this.apiKey || !provided || !this.matches(provided)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  private matches(provided: string): boolean {
    const a = Buffer.from(provided);
    const b = Buffer.from(this.apiKey);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
