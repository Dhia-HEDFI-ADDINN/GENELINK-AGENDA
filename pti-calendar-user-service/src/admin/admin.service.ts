import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { Permission } from '../domain/entities/permission.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // ========== STATS ==========
  async getGlobalStats(): Promise<any> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { actif: true } });
    
    // Generate mock data for dashboard
    const today = new Date();
    const rdvParJour = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      rdvParJour.push({
        date: date.toISOString().split('T')[0],
        total: Math.floor(Math.random() * 50) + 30,
      });
    }

    return {
      kpi: {
        total_rdv_jour: Math.floor(Math.random() * 100) + 50,
        total_rdv_mois: Math.floor(Math.random() * 2000) + 1000,
        ca_mois: Math.floor(Math.random() * 100000) + 50000,
        taux_occupation_global: Math.floor(Math.random() * 30) + 60,
        nb_centres_actifs: 12,
        nb_controleurs_actifs: activeUsers,
        evolution_rdv: Math.floor(Math.random() * 20) - 5,
        evolution_ca: Math.floor(Math.random() * 20) - 5,
      },
      alertes: [
        { id: '1', type: 'warning', message: 'Taux d\'occupation bas', centre: 'Centre Paris 15' },
        { id: '2', type: 'info', message: 'Nouvelle mise à jour disponible' },
        { id: '3', type: 'warning', message: 'Créneaux non confirmés', centre: 'Centre Lyon Est' },
      ],
      top_centres: [
        { id: '1', nom: 'Centre Paris 15', rdv_mois: 450, ca_mois: 22500, taux_occupation: 92 },
        { id: '2', nom: 'Centre Lyon Est', rdv_mois: 380, ca_mois: 19000, taux_occupation: 85 },
        { id: '3', nom: 'Centre Marseille Nord', rdv_mois: 320, ca_mois: 16000, taux_occupation: 78 },
        { id: '4', nom: 'Centre Bordeaux', rdv_mois: 290, ca_mois: 14500, taux_occupation: 75 },
        { id: '5', nom: 'Centre Toulouse', rdv_mois: 260, ca_mois: 13000, taux_occupation: 70 },
      ],
      rdv_par_jour: rdvParJour,
      ca_par_reseau: [
        { reseau: 'SGS France', ca: 85000 },
        { reseau: 'Securitest', ca: 65000 },
        { reseau: 'Autovision', ca: 45000 },
        { reseau: 'Dekra', ca: 35000 },
      ],
    };
  }

  // ========== USERS ==========
  async getUsers(filters: any): Promise<any> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (filters.search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.nom ILIKE :search OR user.prenom ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.role) {
      queryBuilder.andWhere('roles.name = :role', { role: filters.role });
    }

    if (filters.actif !== undefined && filters.actif !== '') {
      queryBuilder.andWhere('user.actif = :actif', { actif: filters.actif === 'true' });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .getManyAndCount();

    return {
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        actif: user.actif,
        roles: user.getRoleNames(),
        last_login_at: user.last_login_at,
        created_at: user.created_at,
      })),
      meta: {
        total,
        page: 1,
        limit: 50,
      },
    };
  }

  async createUser(data: any): Promise<any> {
    const user = this.userRepository.create({
      ...data,
      tenant_id: data.tenant_id || 'default-tenant',
    });
    await this.userRepository.save(user);
    return user;
  }

  async updateUser(id: string, data: any): Promise<any> {
    await this.userRepository.update(id, data);
    return this.userRepository.findOne({ where: { id } });
  }

  async toggleUserActif(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      user.actif = !user.actif;
      await this.userRepository.save(user);
    }
    return user;
  }

  // ========== ROLES ==========
  async getRoles(): Promise<any> {
    const roles = await this.roleRepository.find({
      relations: ['permissions'],
    });
    return {
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        is_system: role.is_system,
        hierarchy_level: role.hierarchy_level,
        permissions: role.getPermissionNames(),
        created_at: role.created_at,
      })),
    };
  }

  async createRole(data: any): Promise<any> {
    const role = this.roleRepository.create(data);
    await this.roleRepository.save(role);
    return role;
  }

  async updateRole(id: string, data: any): Promise<any> {
    await this.roleRepository.update(id, data);
    return this.roleRepository.findOne({ where: { id } });
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }

  // ========== PERMISSIONS ==========
  async getPermissions(): Promise<any> {
    const permissions = await this.permissionRepository.find();
    return {
      data: permissions.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        resource: p.resource,
        action: p.action,
      })),
    };
  }

  // ========== RESEAUX (Mock) ==========
  async getReseaux(): Promise<any> {
    // Mock data for réseaux
    return {
      data: [
        { id: '1', nom: 'SGS France', code: 'SGS', actif: true, nb_centres: 45 },
        { id: '2', nom: 'Securitest', code: 'SEC', actif: true, nb_centres: 32 },
        { id: '3', nom: 'Autovision', code: 'ATV', actif: true, nb_centres: 28 },
        { id: '4', nom: 'Dekra', code: 'DKR', actif: true, nb_centres: 22 },
      ],
    };
  }

  async createReseau(data: any): Promise<any> {
    return { id: Date.now().toString(), ...data };
  }

  async updateReseau(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  // ========== CENTRES (Mock) ==========
  async getCentres(filters: any): Promise<any> {
    const mockCentres = [
      { id: '1', nom: 'Centre Paris 15', code: 'PAR15', reseau_id: '1', reseau_nom: 'SGS France', adresse: '15 rue de Paris', code_postal: '75015', ville: 'Paris', telephone: '01 23 45 67 89', email: 'paris15@sgs.fr', actif: true, nb_controleurs: 5, nb_lignes: 3 },
      { id: '2', nom: 'Centre Lyon Est', code: 'LYE', reseau_id: '1', reseau_nom: 'SGS France', adresse: '25 avenue de Lyon', code_postal: '69003', ville: 'Lyon', telephone: '04 56 78 90 12', email: 'lyon@sgs.fr', actif: true, nb_controleurs: 4, nb_lignes: 2 },
      { id: '3', nom: 'Centre Marseille Nord', code: 'MRN', reseau_id: '2', reseau_nom: 'Securitest', adresse: '10 bd du Nord', code_postal: '13001', ville: 'Marseille', telephone: '04 91 00 00 00', email: 'marseille@securitest.fr', actif: true, nb_controleurs: 3, nb_lignes: 2 },
      { id: '4', nom: 'Centre Bordeaux', code: 'BDX', reseau_id: '2', reseau_nom: 'Securitest', adresse: '5 rue de Bordeaux', code_postal: '33000', ville: 'Bordeaux', telephone: '05 56 00 00 00', email: 'bordeaux@securitest.fr', actif: true, nb_controleurs: 2, nb_lignes: 1 },
      { id: '5', nom: 'Centre Toulouse', code: 'TLS', reseau_id: '3', reseau_nom: 'Autovision', adresse: '30 rue Rose', code_postal: '31000', ville: 'Toulouse', telephone: '05 61 00 00 00', email: 'toulouse@autovision.fr', actif: false, nb_controleurs: 3, nb_lignes: 2 },
    ];

    let data = mockCentres;
    if (filters.reseau_id) {
      data = data.filter(c => c.reseau_id === filters.reseau_id);
    }
    if (filters.actif !== undefined && filters.actif !== '') {
      const isActif = filters.actif === 'true';
      data = data.filter(c => c.actif === isActif);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(c => 
        c.nom.toLowerCase().includes(search) || 
        c.code.toLowerCase().includes(search) || 
        c.ville.toLowerCase().includes(search)
      );
    }

    return { data, meta: { total: data.length, page: 1, limit: 50 } };
  }

  async createCentre(data: any): Promise<any> {
    return { id: Date.now().toString(), ...data };
  }

  async updateCentre(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  // ========== REPORTS ==========
  async getReportStats(filters: any): Promise<any> {
    return {
      periode: {
        debut: filters.date_debut,
        fin: filters.date_fin,
      },
      kpi: {
        total_rdv: 2450,
        rdv_confirmes: 2100,
        rdv_annules: 250,
        rdv_absents: 100,
        ca_total: 122500,
        taux_confirmation: 85.7,
        taux_annulation: 10.2,
        taux_no_show: 4.1,
      },
      evolution_quotidienne: this.generateDailyStats(filters.date_debut, filters.date_fin),
      par_centre: [
        { centre: 'Centre Paris 15', rdv: 450, ca: 22500, taux_conf: 92 },
        { centre: 'Centre Lyon Est', rdv: 380, ca: 19000, taux_conf: 88 },
        { centre: 'Centre Marseille Nord', rdv: 320, ca: 16000, taux_conf: 85 },
      ],
    };
  }

  private generateDailyStats(startDate: string, endDate: string): any[] {
    const stats = [];
    const start = new Date(startDate || new Date());
    const end = new Date(endDate || new Date());
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= Math.min(days, 30); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      stats.push({
        date: date.toISOString().split('T')[0],
        rdv: Math.floor(Math.random() * 100) + 50,
        ca: Math.floor(Math.random() * 5000) + 2500,
      });
    }

    return stats;
  }
}
