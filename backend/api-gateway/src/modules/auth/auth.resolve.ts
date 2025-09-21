import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { GqlAuthGuard } from './auth.guard';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [User], { name: 'users' })
  getUsers() {
    return this.userService.findAll();
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User, { name: 'user' })
  getUser(@Args('id') id: string) {
    return this.userService.findOne(id);
  }
}
