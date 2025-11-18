// backend/api-gateway/tests/services/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../../src/modules/user/user.service';
import { User } from '../../src/modules/user/user.entity';
import { CreateUserInput } from '../../../common/src/dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input: CreateUserInput = { email: 'test@test.com', password: '123', name: 'John' };
      const mockUser = {
        id: '123',
        email: input.email,
        password: input.password,
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const user = await service.create(input);

      expect(repository.create).toHaveBeenCalledWith({
        email: input.email,
        password: input.password,
        name: input.name,
      });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(user).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'a@test.com',
          password: '123',
          name: 'Alice',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const users = await service.findAll();
      
      expect(repository.find).toHaveBeenCalled();
      expect(users).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '123',
        email: 'b@test.com',
        password: '123',
        name: 'Bob',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const found = await service.findOne('123');
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
      expect(found).toEqual(mockUser);
    });

    it('should return undefined if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const found = await service.findOne('non-existing-id');
      
      expect(found).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'c@test.com',
        password: '123',
        name: 'Carol',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const found = await service.findByEmail('c@test.com');
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'c@test.com' } });
      expect(found).toEqual(mockUser);
    });

    it('should return undefined if email not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const found = await service.findByEmail('nonexisting@test.com');
      
      expect(found).toBeUndefined();
    });
  });
});
