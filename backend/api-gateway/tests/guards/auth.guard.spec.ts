import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { GqlAuthGuard } from '../../src/modules/auth/auth.guard';

type MockRequest = { headers: Record<string, string>; user?: unknown };

/** Build an ExecutionContext for either a GraphQL resolver or a REST controller */
function createContext(req: MockRequest, type: 'graphql' | 'http'): ExecutionContext {
  // GraphQL: [root, args, context, info]; Express: [req, res, next]
  const args = type === 'graphql' ? [{}, {}, { req }, {}] : [req, {}, jest.fn()];
  return {
    getType: () => type,
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: () => args,
    getArgByIndex: (i: number) => args[i],
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let reflector: Reflector;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify'>>;

  const payload = { sub: 'user-1', email: 'a@b.com', role: 'user' };

  beforeEach(() => {
    reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jwtService = { verify: jest.fn().mockReturnValue(payload) };
    guard = new GqlAuthGuard(jwtService as unknown as JwtService, reflector);
  });

  it('should allow public routes without a token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const req: MockRequest = { headers: {} };

    expect(guard.canActivate(createContext(req, 'graphql'))).toBe(true);
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it.each(['graphql', 'http'] as const)(
    'should verify the Bearer token and attach the payload (%s context)',
    (type) => {
      const req: MockRequest = { headers: { authorization: 'Bearer good-token' } };

      expect(guard.canActivate(createContext(req, type))).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('good-token');
      expect(req.user).toEqual(payload);
    },
  );

  it('should reject a request without an authorization header', () => {
    const req: MockRequest = { headers: {} };

    expect(() => guard.canActivate(createContext(req, 'http'))).toThrow(UnauthorizedException);
  });

  it.each(['good-token', 'Basic good-token', 'Bearer'])(
    'should reject a malformed authorization header "%s"',
    (header) => {
      const req: MockRequest = { headers: { authorization: header } };

      expect(() => guard.canActivate(createContext(req, 'graphql'))).toThrow(UnauthorizedException);
      expect(jwtService.verify).not.toHaveBeenCalled();
    },
  );

  it('should reject an invalid or expired token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const req: MockRequest = { headers: { authorization: 'Bearer bad-token' } };

    expect(() => guard.canActivate(createContext(req, 'graphql'))).toThrow(UnauthorizedException);
    expect(req.user).toBeUndefined();
  });
});
