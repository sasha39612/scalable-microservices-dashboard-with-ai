import { AuthService } from '../../src/modules/auth/auth.service';
import { UserService } from '../../src/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'; // this is now mocked

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
    } as unknown as jest.Mocked<UserService>;

  jwtService = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
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
    expect(result.user).toEqual(mockUser);
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
});
