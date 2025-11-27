import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { AuditService } from './services/audit.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Entities
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { Permission } from '../domain/entities/permission.entity';
import { RefreshToken } from '../domain/entities/refresh-token.entity';
import { AuditLog } from '../domain/entities/audit-log.entity';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantIsolationGuard } from './guards/tenant-isolation.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, RefreshToken, AuditLog]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [AuthController],

  providers: [
    // Services
    AuthService,
    TokenService,
    AuditService,

    // Strategies
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,

    // Guards
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TenantIsolationGuard,
  ],

  exports: [
    AuthService,
    TokenService,
    AuditService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    TenantIsolationGuard,
  ],
})
export class AuthModule {}
