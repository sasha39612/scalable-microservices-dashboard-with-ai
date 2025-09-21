// backend/api-gateway/tests/services/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/modules/user/user.service';
import { CreateUserInput } from '../../../common/src/dto/user.dto';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input: CreateUserInput = { email: 'test@test.com', password: '123', name: 'John' };
      const user = await service.create(input);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(input.email);
      expect(user.name).toBe(input.name);
      expect(user.password).toBe(input.password);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const input: CreateUserInput = { email: 'a@test.com', password: '123', name: 'Alice' };
      await service.create(input);

      const users = await service.findAll();
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const input: CreateUserInput = { email: 'b@test.com', password: '123', name: 'Bob' };
      const user = await service.create(input);

      const found = await service.findOne(user.id);
      expect(found).toEqual(user);
    });

    it('should return undefined if user not found', async () => {
      const found = await service.findOne('non-existing-id');
      expect(found).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const input: CreateUserInput = { email: 'c@test.com', password: '123', name: 'Carol' };
      const user = await service.create(input);

      const found = await service.findByEmail(user.email);
      expect(found).toEqual(user);
    });

    it('should return undefined if email not found', async () => {
      const found = await service.findByEmail('nonexisting@test.com');
      expect(found).toBeUndefined();
    });
  });
});
