import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
    });
  }

  async validate(payload: any): Promise<any> {
    return {
      id: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id,
    };
  }
}
