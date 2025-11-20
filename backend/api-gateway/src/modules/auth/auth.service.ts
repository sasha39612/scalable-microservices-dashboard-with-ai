import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_REFRESH_EXPIRATION: string;

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {
    // Load refresh token configuration
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 
      'dev-refresh-secret-REPLACE-IN-PRODUCTION-minimum-32-characters-required-different-from-access';
    this.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
  }

  async signup(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({ email, password: hashedPassword, name });
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersService.updateRefreshToken(userId, null);
    return true;
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.JWT_REFRESH_SECRET,
      });

      // Get user and validate stored refresh token
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Compare the provided token with stored hashed token
      const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new token pair
      const tokens = await this.generateTokens(user);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return { ...tokens, user };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(userId: string): Promise<User | undefined> {
    return this.usersService.findOne(userId);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.JWT_REFRESH_SECRET,
        expiresIn: this.JWT_REFRESH_EXPIRATION as '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
