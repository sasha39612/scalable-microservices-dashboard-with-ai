import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolve';
import { GqlAuthGuard } from './auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserModule } from '../user/user.module';

// Validate JWT secrets at startup
if (!process.env.JWT_ACCESS_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'JWT_ACCESS_SECRET is required in production. Generate one using: openssl rand -base64 64'
  );
}

if (!process.env.JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'JWT_REFRESH_SECRET is required in production. Generate one using: openssl rand -base64 64'
  );
}

// For development/test, use a secure fallback but log a warning
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || (() => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('⚠️  WARNING: Using default JWT_ACCESS_SECRET. This is insecure for production!');
  }
  return 'dev-access-secret-REPLACE-IN-PRODUCTION-minimum-32-characters-required';
})();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET. This is insecure for production!');
  }
  return 'dev-refresh-secret-REPLACE-IN-PRODUCTION-minimum-32-characters-required-different-from-access';
})();

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    JwtModule.register({
      secret: JWT_ACCESS_SECRET,
      signOptions: { 
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as '15m',
      },
    }),
  ],
  providers: [
    AuthService,
    AuthResolver,
    {
      provide: 'JWT_REFRESH_SECRET',
      useValue: JWT_REFRESH_SECRET,
    },
    {
      provide: APP_GUARD,
      useClass: GqlAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
