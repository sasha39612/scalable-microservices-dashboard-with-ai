// api-gateway/tests/resolvers/user.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from '../../src/modules/user/user.resolver';
import { UserService } from '../../src/modules/user/user.service';
import { User } from '../../src/modules/user/user.entity';

describe('UserResolver', () => {
  let resolver: UserResolver;
  let service: UserService;

  // TypeScript requires password field because it's part of User class
  const mockUsers: User[] = [
    { id: '1', email: 'test1@test.com', name: 'John', password: 'password1' },
    { id: '2', email: 'test2@test.com', name: 'Jane', password: 'password2' },
  ];

  const mockUser: User = { id: '1', email: 'test1@test.com', name: 'John', password: 'password1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockUsers),
            findOne: jest.fn().mockImplementation((id: string) =>
              Promise.resolve(mockUsers.find((u) => u.id === id)),
            ),
          },
        },
      ],
    }).compile();

    resolver = module.get<UserResolver>(UserResolver);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('getUsers should return all users', async () => {
    const result = await resolver.getUsers();
    expect(result).toEqual(mockUsers);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('getUser should return a user by id', async () => {
    const result = await resolver.getUser('1');
    expect(result).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('getUser should return undefined if user not found', async () => {
    const result = await resolver.getUser('999');
    expect(result).toBeUndefined();
    expect(service.findOne).toHaveBeenCalledWith('999');
  });
});
