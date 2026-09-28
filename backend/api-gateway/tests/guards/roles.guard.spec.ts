import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'common';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';

type MockRequest = { user?: { role?: UserRole } };

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

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow any request when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext({}, 'graphql'))).toBe(true);
  });

  describe.each(['graphql', 'http'] as const)('admin-only route (%s context)', (type) => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.Admin]);
    });

    it('should allow an admin', () => {
      expect(guard.canActivate(createContext({ user: { role: UserRole.Admin } }, type))).toBe(true);
    });

    it('should deny a regular user', () => {
      expect(guard.canActivate(createContext({ user: { role: UserRole.User } }, type))).toBe(false);
    });

    it('should deny an unauthenticated request', () => {
      expect(guard.canActivate(createContext({}, type))).toBe(false);
    });
  });
});
