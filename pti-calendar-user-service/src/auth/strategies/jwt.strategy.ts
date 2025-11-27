import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenant_id: string;
  centre_ids: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, actif: true },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé ou désactivé');
    }

    // Build permissions from roles
    const permissions = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((p) => permissions.add(p.name));
    });

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      roles: user.getRoleNames(),
      permissions: [...permissions, ...user.permissions],
      tenant_id: user.tenant_id,
      centre_ids: user.centre_ids,
    };
  }
}
