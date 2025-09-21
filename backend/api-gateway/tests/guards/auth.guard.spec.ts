import { UnauthorizedException } from '@nestjs/common';
import { GqlAuthGuard } from '../../src/modules/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = { verify: jest.fn() } as unknown as JwtService;
    guard = new GqlAuthGuard(jwtService);
  });

  it('should allow access with valid token', () => {
    const req = { headers: { authorization: 'Bearer valid-token' }, user: null };
    (jwtService.verify as jest.Mock).mockReturnValue({ userId: '123' });
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ req }),
    });

    expect(guard.canActivate({} as any)).toBe(true);
    expect(req.user).toEqual({ userId: '123' });
  });

  it('should throw UnauthorizedException if no auth header', () => {
    const req = { headers: {}, user: null };
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ req }),
    });

    expect(() => guard.canActivate({} as any)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate({} as any)).toThrow('No authorization header');
  });

  it('should throw UnauthorizedException if token is invalid', () => {
    const req = { headers: { authorization: 'Bearer invalid-token' }, user: null };
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ req }),
    });

    expect(() => guard.canActivate({} as any)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate({} as any)).toThrow('Invalid or expired token');
  });
});
