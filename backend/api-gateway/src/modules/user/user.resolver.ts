import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  getUsers() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  getUser(@Args('id') id: string) {
    return this.userService.findOne(id);
  }
}
