import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey: string;

  constructor(private reflector: Reflector) {
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  AI_SERVICE_API_KEY not set. Service endpoints are unprotected!');
    } else {
      console.log('✅ AI_SERVICE_API_KEY is configured');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // If no API key is configured, allow access (development mode)
    if (!this.apiKey) {
      console.warn('⚠️  Request allowed without authentication - AI_SERVICE_API_KEY not configured');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      console.error('❌ Request rejected - No X-API-Key header provided');
      throw new UnauthorizedException('Invalid or missing API key');
    }

    if (apiKey !== this.apiKey) {
      console.error('❌ Request rejected - Invalid API key provided');
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
