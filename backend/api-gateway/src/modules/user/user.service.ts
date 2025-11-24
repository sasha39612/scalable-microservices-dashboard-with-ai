import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiGatewayAuditLogger, AuditAction } from 'common';
import { User } from './user.entity';
import { CreateUserInput, UpdateUserInput } from 'common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user || undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async create(input: CreateUserInput): Promise<User> {
    const newUser = this.userRepository.create({
      email: input.email,
      password: input.password,
      name: input.name,
    });
    return this.userRepository.save(newUser);
  }

  async update(input: UpdateUserInput): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id: input.id } });
    
    if (!user) {
      return undefined;
    }

    // Update only provided fields
    if (input.name !== undefined) {
      user.name = input.name;
    }
    if (input.email !== undefined) {
      user.email = input.email;
    }
    if (input.password !== undefined) {
      user.password = input.password;
    }

    const updatedUser = await this.userRepository.save(user);

    // Audit user update
    await apiGatewayAuditLogger.logSuccess(
      AuditAction.USER_UPDATE,
      user.id,
      {
        userEmail: user.email,
        userRole: user.role,
        resource: 'user',
        resourceId: user.id,
        metadata: {
          fields: Object.keys(input).filter(k => k !== 'id' && k !== 'password'),
        },
      }
    );

    return updatedUser;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, { 
      refreshToken: refreshToken || undefined 
    });
  }
}
