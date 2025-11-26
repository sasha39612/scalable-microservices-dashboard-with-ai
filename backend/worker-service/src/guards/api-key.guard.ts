import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey: string;

  constructor(private reflector: Reflector) {
    this.apiKey = process.env.WORKER_SERVICE_API_KEY || '';
    if (!this.apiKey) {
      // WORKER_SERVICE_API_KEY not set. Service endpoints are unprotected!
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

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || apiKey !== this.apiKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
