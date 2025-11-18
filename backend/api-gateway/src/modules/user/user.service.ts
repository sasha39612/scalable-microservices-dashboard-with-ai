import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    return this.userRepository.save(user);
  }
}
