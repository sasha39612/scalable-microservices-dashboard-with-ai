import { UnauthorizedException } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './refresh-cookie';
import { RateLimits } from '../../config/rate-limit.config';

interface GqlContext {
  req: Request;
  res: Response;
}

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
    @Context() { res }: GqlContext,
  ): Promise<AuthPayload> {
    const { accessToken, refreshToken, user } = await this.authService.login(email, password);
    setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Public()
  @Throttle(RateLimits.REGISTER)
  @Mutation(() => AuthPayload, { description: 'User signup with email, password, and name' })
  async signup(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
    @Context() ctx: GqlContext,
  ): Promise<AuthPayload> {
    await this.authService.signup(email, password, name);
    return this.login(email, password, ctx);
  }

  @Public()
  @Throttle(RateLimits.REGISTER)
  @Mutation(() => AuthPayload, { description: 'User registration with email, password, and name' })
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
    @Context() ctx: GqlContext,
  ): Promise<AuthPayload> {
    await this.authService.signup(email, password, name);
    return this.login(email, password, ctx);
  }

  @Query(() => User, { name: 'me', description: 'Get current authenticated user' })
  async getCurrentUser(@CurrentUser() user: { sub: string }): Promise<User | null> {
    const currentUser = await this.userService.findOne(user.sub);
    return currentUser || null;
  }

  @Public()
  @Throttle(RateLimits.AUTH)
  @Mutation(() => AuthPayload, {
    description: 'Issue a new access token using the httpOnly refresh token cookie',
  })
  async refreshToken(@Context() { req, res }: GqlContext): Promise<AuthPayload> {
    const token = readRefreshCookie(req);
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    // On failure the cookie is left alone: with several tabs open, a request that lost a
    // rotation race must not clear the fresh cookie another tab has just received.
    const { accessToken, refreshToken, user } = await this.authService.refreshTokens(token);
    setRefreshCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Mutation(() => Boolean, { description: 'Logout current user and invalidate refresh token' })
  async logout(
    @CurrentUser() user: { sub: string },
    @Context() { res }: GqlContext,
  ): Promise<boolean> {
    clearRefreshCookie(res);
    return this.authService.logout(user.sub);
  }
}

// GraphQL Object Type for Auth Response
import { ObjectType, Field } from '@nestjs/graphql';

// The refresh token is deliberately not a field: it only travels in the httpOnly cookie
@ObjectType()
export class AuthPayload {
  @Field({ name: 'access_token' })
  accessToken: string;

  @Field(() => User)
  user: User;
}
