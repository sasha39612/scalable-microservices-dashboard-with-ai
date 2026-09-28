import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from '../../src/modules/user/user.resolver';
import { UserService } from '../../src/modules/user/user.service';
import { CreateUserInput } from '../../../common/src/dto/user.dto';
import { User } from '../../src/modules/user/user.entity';
import { UserRole } from '../../../common/src/types/common';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let service: jest.Mocked<UserService>;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    password: 'hashed-password',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    service = module.get(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const result = await resolver.getUsers();
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should let a user read their own record', async () => {
      const result = await resolver.getUser('1', { sub: '1', role: UserRole.User });
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });

    it("should forbid a user from reading someone else's record", () => {
      expect(() => resolver.getUser('2', { sub: '1', role: UserRole.User })).toThrow(
        ForbiddenException,
      );
      expect(service.findOne).not.toHaveBeenCalled();
    });

    it('should let an admin read any record', async () => {
      const result = await resolver.getUser('2', { sub: '1', role: UserRole.Admin });
      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('2');
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const input: CreateUserInput = {
        email: 'test@test.com',
        password: 'password',
        name: 'Test User',
      };

      const result = await resolver.createUser(input);
      expect(result).toEqual(mockUser);
      expect(service.create).toHaveBeenCalledWith(input);
    });
  });
});
