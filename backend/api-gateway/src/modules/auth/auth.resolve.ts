import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Resolver(() => User)
export class AuthResolver {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Mutation(() => AuthPayload, { description: 'User login with email and password' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.login(email, password);
  }

  @Public()
  @Mutation(() => AuthPayload, { description: 'User signup with email, password, and name' })
  async signup(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
  ): Promise<AuthPayload> {
    await this.authService.signup(email, password, name);
    const loginResult = await this.authService.login(email, password);
    return loginResult;
  }

  @Query(() => [User], { name: 'users' })
  getUsers() {
    return this.userService.findAll();
  }

  @Query(() => User, { name: 'user' })
  getUser(@Args('id') id: string) {
    return this.userService.findOne(id);
  }

  @Query(() => User, { name: 'me', description: 'Get current authenticated user' })
  async getCurrentUser(@Args('userId') userId: string): Promise<User | null> {
    const currentUser = await this.userService.findOne(userId);
    return currentUser || null;
  }
}

// GraphQL Object Type for Auth Response
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
