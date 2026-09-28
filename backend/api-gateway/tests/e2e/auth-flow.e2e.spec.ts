// End-to-end auth flow over real HTTP: GraphQL + REST, global guards, cookies and JWTs.
// Only persistence is faked (in-memory users), so this runs without Postgres or Redis.
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';
import { AddressInfo } from 'net';
import { UserRole } from 'common';
import { AuthResolver } from '../../src/modules/auth/auth.resolve';
import { AuthService } from '../../src/modules/auth/auth.service';
import { GqlAuthGuard } from '../../src/modules/auth/auth.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { UserResolver } from '../../src/modules/user/user.resolver';
import { UserService } from '../../src/modules/user/user.service';
import { User } from '../../src/modules/user/user.entity';
import { CacheController } from '../../src/controllers/cache.controller';
import { CacheService } from '../../src/services/cache.service';

class InMemoryUserService {
  users = new Map<string, User>();

  async findOne(id: string) {
    return this.users.get(id);
  }
  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email);
  }
  async findAll() {
    return [...this.users.values()];
  }
  async create(input: { email: string; password: string; name: string }) {
    const user = {
      ...input,
      id: String(this.users.size + 1),
      role: UserRole.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, user);
    return user;
  }
  async updateRefreshToken(id: string, refreshToken: string | null) {
    const user = this.users.get(id);
    if (user) user.refreshToken = refreshToken;
  }
}

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const users = new InMemoryUserService();

  interface GqlResult {
    status: number;
    body: { data?: Record<string, any>; errors?: Array<{ message: string; extensions?: { code?: string } }> };
    setCookies: string[];
  }

  async function gql(query: string, opts: { token?: string; cookie?: string } = {}): Promise<GqlResult> {
    const res = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...(opts.cookie ? { Cookie: opts.cookie } : {}),
      },
      body: JSON.stringify({ query }),
    });
    return { status: res.status, body: await res.json(), setCookies: res.headers.getSetCookie() };
  }

  const errorCode = (r: GqlResult) => r.body.errors?.[0]?.extensions?.code;
  // "refresh_token=abc; Path=...; HttpOnly" -> "refresh_token=abc"
  const cookiePair = (setCookie: string) => setCookie.split(';')[0];

  async function login(email: string, password: string) {
    const r = await gql(
      `mutation { login(email: "${email}", password: "${password}") { access_token user { id role } } }`,
    );
    return { token: r.body.data!.login.access_token as string, cookie: cookiePair(r.setCookies[0]), result: r };
  }

  beforeAll(async () => {
    await users.create({ email: 'user@test.com', password: await bcrypt.hash('user-pass', 4), name: 'User' });
    const admin = await users.create({ email: 'admin@test.com', password: await bcrypt.hash('admin-pass', 4), name: 'Admin' });
    admin.role = UserRole.Admin;

    const moduleRef = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
        }),
        JwtModule.register({ secret: 'e2e-access-secret-at-least-32-characters', signOptions: { expiresIn: '15m' } }),
      ],
      controllers: [CacheController],
      providers: [
        AuthResolver,
        UserResolver,
        AuthService,
        { provide: UserService, useValue: users },
        { provide: CacheService, useValue: { getCacheStats: () => ({ redisConnected: false, memoryCacheSize: 0, memoryCacheKeys: [] }) } },
        { provide: APP_GUARD, useClass: GqlAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('login sets an httpOnly, SameSite=Strict refresh cookie and never exposes the token to JS', async () => {
    const { token, result } = await login('user@test.com', 'user-pass');

    expect(token).toEqual(expect.any(String));
    expect(result.setCookies).toHaveLength(1);
    expect(result.setCookies[0]).toMatch(/^refresh_token=[^;]+;/);
    expect(result.setCookies[0]).toMatch(/HttpOnly/);
    expect(result.setCookies[0]).toMatch(/SameSite=Strict/);
    expect(result.setCookies[0]).toMatch(/Path=\/api\/graphql/);

    const leak = await gql(`mutation { login(email: "user@test.com", password: "user-pass") { refresh_token } }`);
    expect(leak.body.errors?.[0]?.message).toMatch(/Cannot query field "refresh_token"/);
  });

  it('me requires a valid Bearer token', async () => {
    const { token } = await login('user@test.com', 'user-pass');

    expect((await gql('{ me { email } }', { token })).body.data?.me.email).toBe('user@test.com');
    expect(errorCode(await gql('{ me { email } }'))).toBe('UNAUTHENTICATED');
    expect(errorCode(await gql('{ me { email } }', { token: 'not-a-jwt' }))).toBe('UNAUTHENTICATED');
  });

  it('refreshToken rotates the cookie and rejects the rotated-out one', async () => {
    const { cookie: first } = await login('user@test.com', 'user-pass');

    const refreshed = await gql('mutation { refreshToken { access_token user { email } } }', { cookie: first });
    expect(refreshed.body.data?.refreshToken.user.email).toBe('user@test.com');
    const second = cookiePair(refreshed.setCookies[0]);
    expect(second).not.toBe(first);

    // The new access token works
    const me = await gql('{ me { email } }', { token: refreshed.body.data!.refreshToken.access_token });
    expect(me.body.data?.me.email).toBe('user@test.com');

    // Replaying the old cookie fails; the current one still works
    expect(errorCode(await gql('mutation { refreshToken { access_token } }', { cookie: first }))).toBe('UNAUTHENTICATED');
    expect((await gql('mutation { refreshToken { access_token } }', { cookie: second })).body.data).toBeTruthy();
  });

  it('refreshToken without a cookie is rejected', async () => {
    expect(errorCode(await gql('mutation { refreshToken { access_token } }'))).toBe('UNAUTHENTICATED');
  });

  it('logout revokes the refresh token of the caller and clears the cookie', async () => {
    const { token, cookie } = await login('user@test.com', 'user-pass');

    const out = await gql('mutation { logout }', { token });
    expect(out.body.data?.logout).toBe(true);
    expect(out.setCookies[0]).toMatch(/^refresh_token=;/);
    expect(out.setCookies[0]).toMatch(/Expires=Thu, 01 Jan 1970/);

    expect(errorCode(await gql('mutation { refreshToken { access_token } }', { cookie }))).toBe('UNAUTHENTICATED');
  });

  it('logout no longer accepts a client-supplied userId', async () => {
    const { token } = await login('user@test.com', 'user-pass');

    const r = await gql('mutation { logout(userId: "2") }', { token });
    expect(r.body.errors?.[0]?.message).toMatch(/Unknown argument "userId"/);
  });

  describe('user reads', () => {
    it('a regular user cannot list users', async () => {
      const { token } = await login('user@test.com', 'user-pass');
      expect(errorCode(await gql('{ users { id } }', { token }))).toBe('FORBIDDEN');
    });

    it('a regular user can read themselves but not others', async () => {
      const { token } = await login('user@test.com', 'user-pass');
      expect((await gql('{ user(id: "1") { email } }', { token })).body.data?.user.email).toBe('user@test.com');
      expect(errorCode(await gql('{ user(id: "2") { email } }', { token }))).toBe('FORBIDDEN');
    });

    it('an admin can list and read any user', async () => {
      const { token } = await login('admin@test.com', 'admin-pass');
      expect((await gql('{ users { id } }', { token })).body.data?.users).toHaveLength(2);
      expect((await gql('{ user(id: "1") { email } }', { token })).body.data?.user.email).toBe('user@test.com');
    });
  });

  describe('REST admin route (GET /cache/stats)', () => {
    const getStats = (token?: string) =>
      fetch(`${baseUrl}/cache/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

    it('returns 401 without a token', async () => {
      expect((await getStats()).status).toBe(401);
    });

    it('returns 403 for a regular user', async () => {
      const { token } = await login('user@test.com', 'user-pass');
      expect((await getStats(token)).status).toBe(403);
    });

    it('returns 200 for an admin', async () => {
      const { token } = await login('admin@test.com', 'admin-pass');
      const res = await getStats(token);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(expect.objectContaining({ redisConnected: false }));
    });
  });
});
