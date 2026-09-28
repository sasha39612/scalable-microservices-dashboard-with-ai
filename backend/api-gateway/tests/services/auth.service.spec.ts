import { AuthService } from '../../src/modules/auth/auth.service';
import { UserService } from '../../src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'; // this is now mocked
import { createHash } from 'crypto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (data: string | Buffer) => `hashed-${data}`),
  compare: jest.fn(async (data: string | Buffer, encrypted: string) => encrypted === `hashed-${data}`),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = { id: '1', email: 'test@test.com', password: 'hashed-password', name: 'Test User' };

  beforeEach(() => {
    userService = {
      create: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<UserService>;

  jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: '1', email: 'test@test.com', role: 'user' }),
  } as unknown as jest.Mocked<JwtService>;

  service = new AuthService(userService, jwtService);
});

  it('signup should hash password and create user', async () => {
    const result = await service.signup('test@test.com', 'password', 'Test User');
    expect(result.password).toBe('hashed-password'); // matches the mocked hash
    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@test.com',
      name: 'Test User',
      password: 'hashed-password',
    }));
  });

  it('login should return access token and user for valid credentials', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, password: 'hashed-password' });

    const result = await service.login('test@test.com', 'password');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.refreshToken).toBe('jwt-token');
    expect(result.user).toEqual(mockUser);
    expect(userService.updateRefreshToken).toHaveBeenCalled();
  });

  it('login should throw UnauthorizedException if password is invalid', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, password: 'hashed-password' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
  });

  it('login should throw UnauthorizedException if user not found', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue(undefined);
    await expect(service.login('notfound@test.com', 'password')).rejects.toThrow(UnauthorizedException);
  });

  describe('refresh tokens', () => {
    const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

    it('login should store a SHA-256 hash of the refresh token, not the token itself', async () => {
      (userService.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, password: 'hashed-password' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.login('test@test.com', 'password');

      expect(userService.updateRefreshToken).toHaveBeenCalledWith('1', sha256('jwt-token'));
    });

    it('refreshTokens should rotate when the presented token is the latest one', async () => {
      (userService.findOne as jest.Mock).mockResolvedValue({ ...mockUser, refreshToken: sha256('current-token') });
      jwtService.signAsync.mockResolvedValue('rotated-token');

      const result = await service.refreshTokens('current-token');

      expect(result.refreshToken).toBe('rotated-token');
      expect(userService.updateRefreshToken).toHaveBeenCalledWith('1', sha256('rotated-token'));
    });

    it('refreshTokens should reject a rotated-out token even if its signature is still valid', async () => {
      // Same 72-byte prefix as the current token: bcrypt would have accepted it
      const prefix = 'x'.repeat(72);
      (userService.findOne as jest.Mock).mockResolvedValue({ ...mockUser, refreshToken: sha256(`${prefix}-new`) });

      await expect(service.refreshTokens(`${prefix}-old`)).rejects.toThrow(UnauthorizedException);
      expect(userService.updateRefreshToken).not.toHaveBeenCalled();
    });

    it('refreshTokens should reject after logout cleared the stored hash', async () => {
      (userService.findOne as jest.Mock).mockResolvedValue({ ...mockUser, refreshToken: null });

      await expect(service.refreshTokens('current-token')).rejects.toThrow(UnauthorizedException);
    });

    it('logout should clear the stored hash', async () => {
      await service.logout('1');

      expect(userService.updateRefreshToken).toHaveBeenCalledWith('1', null);
    });
  });
});
