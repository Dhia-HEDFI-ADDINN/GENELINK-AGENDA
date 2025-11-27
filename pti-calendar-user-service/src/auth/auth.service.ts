import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Entities
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { RefreshToken } from '../domain/entities/refresh-token.entity';

// Services
import { TokenService } from './services/token.service';
import { AuditService } from './services/audit.service';
import { AuditAction } from '../domain/entities/audit-log.entity';

// DTOs
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  UserResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string, tenantId?: string): Promise<User | null> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.email = :email', { email: email.toLowerCase() })
      .andWhere('user.actif = true');

    if (tenantId) {
      query.andWhere('user.tenant_id = :tenantId', { tenantId });
    }

    const user = await query.getOne();

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password, loginDto.tenant_id);

    if (!user) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        resource_type: 'auth',
        user_email: loginDto.email,
        tenant_id: loginDto.tenant_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: false,
        metadata: { reason: 'Invalid credentials' },
      });

      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Update last login
    await this.userRepository.update(user.id, { last_login_at: new Date() });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user, tokens.refreshToken, ipAddress, userAgent);

    // Audit log
    await this.auditService.log({
      action: AuditAction.LOGIN,
      resource_type: 'auth',
      resource_id: user.id,
      user_id: user.id,
      user_email: user.email,
      tenant_id: user.tenant_id,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: true,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      token_type: 'Bearer',
      user: this.mapUserToResponse(user),
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists in tenant
    const existingUser = await this.userRepository.findOne({
      where: {
        email: registerDto.email.toLowerCase(),
        tenant_id: registerDto.tenant_id,
      },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Get default CLIENT role
    const clientRole = await this.roleRepository.findOne({
      where: { name: 'CLIENT' },
    });

    if (!clientRole) {
      throw new BadRequestException('Configuration système incomplète');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, this.BCRYPT_ROUNDS);

    // Create user
    const user = this.userRepository.create({
      id: uuidv4(),
      email: registerDto.email.toLowerCase(),
      password_hash: passwordHash,
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      telephone: registerDto.telephone,
      tenant_id: registerDto.tenant_id,
      roles: [clientRole],
      actif: true,
      email_verified: false,
    });

    await this.userRepository.save(user);

    // Reload with relations
    const savedUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(savedUser!);

    // Audit log
    await this.auditService.log({
      action: AuditAction.USER_CREATE,
      resource_type: 'user',
      resource_id: user.id,
      tenant_id: user.tenant_id,
      new_values: { email: user.email, nom: user.nom, prenom: user.prenom },
      success: true,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      token_type: 'Bearer',
      user: this.mapUserToResponse(savedUser!),
    };
  }

  async refreshToken(refreshTokenValue: string, ipAddress?: string): Promise<AuthResponseDto> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenValue },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = refreshToken.user;

    if (!user.actif) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // Revoke old refresh token
    await this.refreshTokenRepository.update(refreshToken.id, {
      is_revoked: true,
      revoked_at: new Date(),
    });

    // Generate new tokens
    const tokens = await this.tokenService.generateTokens(user);

    // Save new refresh token
    await this.saveRefreshToken(user, tokens.refreshToken, ipAddress);

    // Audit
    await this.auditService.log({
      action: AuditAction.TOKEN_REFRESH,
      resource_type: 'auth',
      user_id: user.id,
      tenant_id: user.tenant_id,
      ip_address: ipAddress,
      success: true,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      token_type: 'Bearer',
      user: this.mapUserToResponse(user),
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Revoke all refresh tokens for user (or specific one)
    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { token: refreshToken },
        { is_revoked: true, revoked_at: new Date() },
      );
    } else {
      await this.refreshTokenRepository.update(
        { user_id: userId, is_revoked: false },
        { is_revoked: true, revoked_at: new Date() },
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    await this.auditService.log({
      action: AuditAction.LOGOUT,
      resource_type: 'auth',
      user_id: userId,
      tenant_id: user?.tenant_id,
      success: true,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return;
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Redis or database (here simplified in audit log)
    // In production, use Redis with TTL
    await this.auditService.log({
      action: AuditAction.PASSWORD_RESET_REQUEST,
      resource_type: 'auth',
      user_id: user.id,
      tenant_id: user.tenant_id,
      metadata: { reset_code_hash: await bcrypt.hash(resetCode, 10) },
      success: true,
    });

    // TODO: Send email via Notification Service (Kafka event)
    console.log(`[DEV] Reset code for ${dto.email}: ${resetCode}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    // Verify code (in production, check Redis)
    // Here simplified - should validate against stored hash

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.new_password, this.BCRYPT_ROUNDS);

    // Update password
    await this.userRepository.update(user.id, { password_hash: passwordHash });

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { user_id: user.id, is_revoked: false },
      { is_revoked: true, revoked_at: new Date() },
    );

    await this.auditService.log({
      action: AuditAction.PASSWORD_RESET,
      resource_type: 'auth',
      user_id: user.id,
      tenant_id: user.tenant_id,
      success: true,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.current_password, user.password_hash);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.new_password, this.BCRYPT_ROUNDS);

    await this.userRepository.update(userId, { password_hash: passwordHash });

    await this.auditService.log({
      action: AuditAction.PASSWORD_CHANGE,
      resource_type: 'auth',
      user_id: userId,
      tenant_id: user.tenant_id,
      success: true,
    });
  }

  // OAuth Login
  async oauthLogin(oauthUser: {
    email: string;
    nom: string;
    prenom: string;
    provider: string;
    providerId: string;
  }): Promise<AuthResponseDto> {
    let user = await this.userRepository.findOne({
      where: { email: oauthUser.email.toLowerCase() },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      // Create new user from OAuth
      const clientRole = await this.roleRepository.findOne({
        where: { name: 'CLIENT' },
      });

      user = this.userRepository.create({
        id: uuidv4(),
        email: oauthUser.email.toLowerCase(),
        nom: oauthUser.nom,
        prenom: oauthUser.prenom,
        password_hash: '', // No password for OAuth users
        oauth_provider: oauthUser.provider,
        oauth_id: oauthUser.providerId,
        roles: clientRole ? [clientRole] : [],
        actif: true,
        email_verified: true, // OAuth emails are verified
      });

      await this.userRepository.save(user);

      user = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['roles', 'roles.permissions'],
      });
    } else {
      // Link OAuth to existing user
      await this.userRepository.update(user.id, {
        oauth_provider: oauthUser.provider,
        oauth_id: oauthUser.providerId,
        email_verified: true,
      });
    }

    const tokens = await this.tokenService.generateTokens(user!);

    await this.auditService.log({
      action: AuditAction.OAUTH_LOGIN,
      resource_type: 'auth',
      user_id: user!.id,
      tenant_id: user!.tenant_id,
      metadata: { provider: oauthUser.provider },
      success: true,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: tokens.expiresIn,
      token_type: 'Bearer',
      user: this.mapUserToResponse(user!),
    };
  }

  private async saveRefreshToken(
    user: User,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const refreshToken = this.refreshTokenRepository.create({
      id: uuidv4(),
      user_id: user.id,
      tenant_id: user.tenant_id,
      token,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private mapUserToResponse(user: User): UserResponseDto {
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
