import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  tenant_id: string;
  centre_ids?: string[];
  role_names?: string[];
}

export interface UpdateUserDto {
  nom?: string;
  prenom?: string;
  telephone?: string;
  centre_ids?: string[];
  actif?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(tenantId: string, page = 1, limit = 50): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { tenant_id: tenantId },
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return { users, total };
  }

  async findById(id: string, tenantId?: string): Promise<User> {
    const query: any = { id };
    if (tenantId) {
      query.tenant_id = tenantId;
    }

    const user = await this.userRepository.findOne({
      where: query,
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const query: any = { email: email.toLowerCase() };
    if (tenantId) {
      query.tenant_id = tenantId;
    }

    return this.userRepository.findOne({
      where: query,
      relations: ['roles'],
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Check for existing user
    const existing = await this.findByEmail(dto.email, dto.tenant_id);
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Get roles
    const roles: Role[] = [];
    if (dto.role_names?.length) {
      for (const roleName of dto.role_names) {
        const role = await this.roleRepository.findOne({ where: { name: roleName } });
        if (role) {
          roles.push(role);
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      password_hash: passwordHash,
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      tenant_id: dto.tenant_id,
      centre_ids: dto.centre_ids || [],
      roles,
      actif: true,
    });

    return this.userRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto, tenantId?: string): Promise<User> {
    const user = await this.findById(id, tenantId);

    if (dto.nom) user.nom = dto.nom;
    if (dto.prenom) user.prenom = dto.prenom;
    if (dto.telephone !== undefined) user.telephone = dto.telephone;
    if (dto.centre_ids) user.centre_ids = dto.centre_ids;
    if (dto.actif !== undefined) user.actif = dto.actif;

    return this.userRepository.save(user);
  }

  async assignRoles(id: string, roleNames: string[], tenantId?: string): Promise<User> {
    const user = await this.findById(id, tenantId);

    const roles: Role[] = [];
    for (const roleName of roleNames) {
      const role = await this.roleRepository.findOne({ where: { name: roleName } });
      if (role) {
        roles.push(role);
      }
    }

    user.roles = roles;
    return this.userRepository.save(user);
  }

  async deactivate(id: string, tenantId?: string): Promise<void> {
    const user = await this.findById(id, tenantId);
    user.actif = false;
    await this.userRepository.save(user);
  }

  async activate(id: string, tenantId?: string): Promise<void> {
    const user = await this.findById(id, tenantId);
    user.actif = true;
    await this.userRepository.save(user);
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const user = await this.findById(id, tenantId);
    await this.userRepository.remove(user);
  }
}
