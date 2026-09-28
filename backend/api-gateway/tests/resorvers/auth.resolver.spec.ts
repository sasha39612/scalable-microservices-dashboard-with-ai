// api-gateway/tests/resolvers/auth.resolver.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { AuthResolver } from '../../src/modules/auth/auth.resolve';
import { UserService } from '../../src/modules/user/user.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { User } from '../../src/modules/user/user.entity';
import { UserRole } from '../../../common/src/types/common';
import { GqlAuthGuard } from '../../src/modules/auth/auth.guard';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let userService: jest.Mocked<UserService>;
  let authService: jest.Mocked<AuthService>;
  let res: jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;

  const mockUser: User = {
    id: '1',
    email: 'test1@test.com',
    name: 'John',
    password: 'password1',
    role: UserRole.User,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token', user: mockUser };

  const ctx = (cookies: Record<string, string> = {}) => ({
    req: { cookies } as unknown as Request,
    res: res as unknown as Response,
  });

  beforeEach(async () => {
    res = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(tokens),
            signup: jest.fn().mockResolvedValue(mockUser),
            refreshTokens: jest.fn().mockResolvedValue({ ...tokens, refreshToken: 'rotated-token' }),
            logout: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    })
      .overrideGuard(GqlAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get(AuthResolver);
    userService = module.get(UserService);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should set the refresh token as an httpOnly cookie and omit it from the payload', async () => {
      const result = await resolver.login('test1@test.com', 'password1', ctx());

      expect(result).toEqual({ accessToken: 'access-token', user: mockUser });
      expect(result).not.toHaveProperty('refreshToken');
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/api/graphql' }),
      );
    });
  });

  describe('register', () => {
    it('should create the user, then log in and set the cookie', async () => {
      const result = await resolver.register('test1@test.com', 'password1', 'John', ctx());

      expect(authService.signup).toHaveBeenCalledWith('test1@test.com', 'password1', 'John');
      expect(result.accessToken).toBe('access-token');
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.any(Object));
    });
  });

  describe('refreshToken', () => {
    it('should read the cookie, rotate it and return a new access token', async () => {
      const result = await resolver.refreshToken(ctx({ refresh_token: 'refresh-token' }));

      expect(authService.refreshTokens).toHaveBeenCalledWith('refresh-token');
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'rotated-token', expect.any(Object));
      expect(result).toEqual({ accessToken: 'access-token', user: mockUser });
    });

    it('should reject when the cookie is missing', async () => {
      await expect(resolver.refreshToken(ctx())).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshTokens).not.toHaveBeenCalled();
    });

    it('should not touch the cookie when the refresh token is rejected', async () => {
      authService.refreshTokens.mockRejectedValue(new UnauthorizedException());

      await expect(resolver.refreshToken(ctx({ refresh_token: 'stale' }))).rejects.toThrow(
        UnauthorizedException,
      );
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should log out the user from the JWT and clear the cookie', async () => {
      const result = await resolver.logout({ sub: '1' }, ctx());

      expect(result).toBe(true);
      expect(authService.logout).toHaveBeenCalledWith('1');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });
  });

  describe('me', () => {
    it('should return the user identified by the JWT', async () => {
      const result = await resolver.getCurrentUser({ sub: '1' });

      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith('1');
    });
  });
});
