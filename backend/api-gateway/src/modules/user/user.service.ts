import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserInput } from 'common';

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
}
