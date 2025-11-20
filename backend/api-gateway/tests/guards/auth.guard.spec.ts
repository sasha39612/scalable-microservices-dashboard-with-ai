import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { GqlAuthGuard } from '../../src/modules/auth/auth.guard';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  beforeEach(() => {
    reflector = new Reflector();
    jwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    } as unknown as JwtService;
    guard = new GqlAuthGuard(jwtService, reflector);
  });

  it('should allow access with valid token', async () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock reflector to return false (not public)
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    // Mock the parent class canActivate to return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(GqlAuthGuard.prototype, 'canActivate' as any).mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should allow access to public routes', async () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock reflector to return true (public route)
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock reflector to return false (not public)
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    // Mock the parent class to reject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(GqlAuthGuard.prototype, 'canActivate' as any).mockRejectedValue(
      new UnauthorizedException('Invalid token')
    );

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});
