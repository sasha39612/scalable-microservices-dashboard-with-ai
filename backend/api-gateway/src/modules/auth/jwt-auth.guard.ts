import { Injectable, CanActivate } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(): boolean {
    // For now, always allow access - implement proper JWT validation later
    return true;
  }
}