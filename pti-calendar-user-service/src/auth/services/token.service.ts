import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/entities/user.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: User): Promise<TokenPair> {
    // Build permissions from roles
    const permissions = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((p) => permissions.add(p.name));
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.getRoleNames(),
      permissions: [...permissions, ...user.permissions],
      tenant_id: user.tenant_id,
      centre_ids: user.centre_ids,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn') || '1h',
      }),
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, tenant_id: user.tenant_id },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '30d',
        },
      ),
    ]);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('jwt.expiresIn') || '1h',
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async verifyAccessToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 1);
  }
}
