import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserInput, UpdateUserInput } from 'common';

@Injectable()
export class UserService {
  private users: User[] = [];
  private idCounter = 1;

  async findAll(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  async findOne(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.id === id));
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.email === email));
  }

  async create(input: CreateUserInput): Promise<User> {
    const newUser: User = {
      id: String(this.idCounter++),
      email: input.email,
      password: input.password,
      name: input.name,
    };
    this.users.push(newUser);
    return Promise.resolve(newUser);
  }

  async update(input: UpdateUserInput): Promise<User | undefined> {
    const userIndex = this.users.findIndex((user) => user.id === input.id);
    
    if (userIndex === -1) {
      return undefined;
    }

    const user = this.users[userIndex];
    
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

    this.users[userIndex] = user;
    return Promise.resolve(user);
  }
}
