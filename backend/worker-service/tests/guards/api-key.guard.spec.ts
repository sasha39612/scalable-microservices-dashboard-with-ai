import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard, IS_PUBLIC_KEY } from '../../src/guards/api-key.guard';

const ENV = 'WORKER_SERVICE_API_KEY';
const STRONG_KEY = 'k'.repeat(40);

function contextWith(headers: Record<string, string | string[]>, isPublic = false) {
  const reflector = { getAllAndOverride: jest.fn((key: string) => (key === IS_PUBLIC_KEY ? isPublic : undefined)) };
  const context = {
    getHandler: (): null => null,
    getClass: (): null => null,
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
  return { reflector: reflector as unknown as Reflector, context };
}

describe('ApiKeyGuard (WORKER_SERVICE_API_KEY)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects every non-public request when no key is configured (fail closed)', () => {
    delete process.env[ENV];
    process.env.NODE_ENV = 'development';
    const { reflector, context } = contextWith({});
    expect(() => new ApiKeyGuard(reflector).canActivate(context)).toThrow(UnauthorizedException);
    const { context: withHeader } = contextWith({ 'x-api-key': '' });
    expect(() => new ApiKeyGuard(reflector).canActivate(withHeader)).toThrow(UnauthorizedException);
  });

  it('allows public routes without a key', () => {
    delete process.env[ENV];
    const { reflector, context } = contextWith({}, true);
    expect(new ApiKeyGuard(reflector).canActivate(context)).toBe(true);
  });

  it('accepts the correct key and rejects wrong or missing ones', () => {
    process.env[ENV] = STRONG_KEY;
    const guard = new ApiKeyGuard(contextWith({}).reflector);
    expect(guard.canActivate(contextWith({ 'x-api-key': STRONG_KEY }).context)).toBe(true);
    expect(() => guard.canActivate(contextWith({ 'x-api-key': 'wrong' }).context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWith({ 'x-api-key': 'k'.repeat(41) }).context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWith({}).context)).toThrow(UnauthorizedException);
  });

  describe('production startup', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('fails when the key is missing', () => {
      delete process.env[ENV];
      expect(() => new ApiKeyGuard(contextWith({}).reflector)).toThrow(/must be set in production/);
    });

    it('fails when the key is too short or a placeholder', () => {
      process.env[ENV] = 'short';
      expect(() => new ApiKeyGuard(contextWith({}).reflector)).toThrow(/at least 32 characters/);
      process.env[ENV] = 'secret-key-change-in-production-padding-padding';
      expect(() => new ApiKeyGuard(contextWith({}).reflector)).toThrow(/real secret/);
    });

    it('starts with a strong key', () => {
      process.env[ENV] = STRONG_KEY;
      expect(() => new ApiKeyGuard(contextWith({}).reflector)).not.toThrow();
    });
  });
});
