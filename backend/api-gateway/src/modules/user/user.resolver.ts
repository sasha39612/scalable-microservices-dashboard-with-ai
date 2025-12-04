import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CacheInvalidate } from '../../decorators/cache.decorators';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserInput, UpdateUserInput } from 'common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'common';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // All users can view the list (authenticated by default via global guard)
  @Query(() => [User], { name: 'users' })
  getUsers() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  getUser(@Args('id') id: string) {
    return this.userService.findOne(id);
  }

  // Only admins can create users
  @Roles(UserRole.Admin)
  @Mutation(() => User)
  @CacheInvalidate({ patterns: ['user:*', 'gql:user:*', 'gql:users:*'] })
  async createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }

  // Only admins can update users
  @Roles(UserRole.Admin)
  @Mutation(() => User, { nullable: true })
  @CacheInvalidate({ 
    keys: ['user:{{input.id}}'], 
    patterns: ['user:*', 'gql:user:*', 'gql:users:*'] 
  })
  async updateUser(@Args('input') input: UpdateUserInput) {
    return this.userService.update(input);
  }
}
