import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RateLimits } from '../../config/rate-limit.config';

@Resolver(() => User)
export class AuthResolver {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Throttle(RateLimits.LOGIN)
  @Mutation(() => AuthPayload, { description: 'User login with email and password' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    return this.authService.login(email, password);
  }

  @Public()
  @Throttle(RateLimits.REGISTER)
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

  @Public()
  @Throttle(RateLimits.REGISTER)
  @Mutation(() => AuthPayload, { description: 'User registration with email, password, and name' })
  async register(
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

  @Public()
  @Throttle(RateLimits.AUTH)
  @Mutation(() => RefreshPayload, { description: 'Refresh access token using refresh token' })
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<RefreshPayload> {
    return this.authService.refreshTokens(refreshToken);
  }

  @Mutation(() => Boolean, { description: 'Logout user and invalidate refresh token' })
  async logout(@Args('userId') userId: string): Promise<boolean> {
    return this.authService.logout(userId);
  }
}

// GraphQL Object Type for Auth Response
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field({ name: 'access_token' })
  accessToken: string;

  @Field({ name: 'refresh_token' })
  refreshToken: string;

  @Field(() => User)
  user: User;
}

@ObjectType()
export class RefreshPayload {
  @Field({ name: 'access_token' })
  accessToken: string;

  @Field({ name: 'refresh_token' })
  refreshToken: string;

  @Field(() => User)
  user: User;
}
