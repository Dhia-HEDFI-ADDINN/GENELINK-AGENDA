import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Tenant, Centre, Controleur, TenantStatus } from '../domain/entities/tenant.entity';
import {
  CreateTenantDto,
  UpdateTenantDto,
  CreateCentreDto,
  UpdateCentreDto,
  CreateControleurDto,
  UpdateControleurDto,
  SearchTenantsDto,
  SearchCentresDto,
} from '../application/dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Centre)
    private readonly centreRepository: Repository<Centre>,
    @InjectRepository(Controleur)
    private readonly controleurRepository: Repository<Controleur>,
  ) {}

  // ===== TENANTS =====

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    // Vérifier l'unicité du code
    const existing = await this.tenantRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Un tenant avec le code '${dto.code}' existe déjà`);
    }

    const tenant = this.tenantRepository.create({
      ...dto,
      status: TenantStatus.ACTIVE,
    });

    return this.tenantRepository.save(tenant);
  }

  async findTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id, deleted_at: null as any },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} non trouvé`);
    }
    return tenant;
  }

  async findTenantByCode(code: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { code, deleted_at: null as any },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant '${code}' non trouvé`);
    }
    return tenant;
  }

  async searchTenants(query: SearchTenantsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tenantRepository
      .createQueryBuilder('t')
      .where('t.deleted_at IS NULL');

    if (query.q) {
      queryBuilder.andWhere('(t.name ILIKE :q OR t.code ILIKE :q)', { q: `%${query.q}%` });
    }

    if (query.type) {
      queryBuilder.andWhere('t.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('t.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('t.name', 'ASC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findTenantById(id);

    if (dto.code && dto.code !== tenant.code) {
      const existing = await this.tenantRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException(`Un tenant avec le code '${dto.code}' existe déjà`);
      }
    }

    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.findTenantById(id);
    tenant.deleted_at = new Date();
    tenant.status = TenantStatus.INACTIVE;
    await this.tenantRepository.save(tenant);
  }

  async listChildTenants(parentId: string): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { parent_id: parentId, deleted_at: null as any },
      order: { name: 'ASC' },
    });
  }

  // ===== CENTRES =====

  async createCentre(dto: CreateCentreDto, tenantId: string): Promise<Centre> {
    // Vérifier l'unicité du code au sein du tenant
    const existing = await this.centreRepository.findOne({
      where: { tenant_id: tenantId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Un centre avec le code '${dto.code}' existe déjà`);
    }

    // Générer les initiales si non fournies
    const centre = this.centreRepository.create({
      tenant_id: tenantId,
      ...dto,
      status: 'ACTIVE',
    });

    return this.centreRepository.save(centre);
  }

  async findCentreById(id: string, tenantId: string): Promise<Centre> {
    const centre = await this.centreRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: null as any },
    });
    if (!centre) {
      throw new NotFoundException(`Centre ${id} non trouvé`);
    }
    return centre;
  }

  async searchCentres(query: SearchCentresDto, tenantId: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.centreRepository
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.deleted_at IS NULL');

    if (query.q) {
      queryBuilder.andWhere('(c.name ILIKE :q OR c.code ILIKE :q OR c.city ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.city) {
      queryBuilder.andWhere('c.city ILIKE :city', { city: `%${query.city}%` });
    }

    if (query.postal_code) {
      queryBuilder.andWhere('c.postal_code = :postalCode', { postalCode: query.postal_code });
    }

    if (query.status) {
      queryBuilder.andWhere('c.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('c.name', 'ASC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateCentre(id: string, dto: UpdateCentreDto, tenantId: string): Promise<Centre> {
    const centre = await this.findCentreById(id, tenantId);

    if (dto.code && dto.code !== centre.code) {
      const existing = await this.centreRepository.findOne({
        where: { tenant_id: tenantId, code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Un centre avec le code '${dto.code}' existe déjà`);
      }
    }

    Object.assign(centre, dto);
    return this.centreRepository.save(centre);
  }

  async deleteCentre(id: string, tenantId: string): Promise<void> {
    const centre = await this.findCentreById(id, tenantId);
    centre.deleted_at = new Date();
    centre.status = 'INACTIVE';
    await this.centreRepository.save(centre);
  }

  async listCentres(tenantId: string): Promise<Centre[]> {
    return this.centreRepository.find({
      where: { tenant_id: tenantId, deleted_at: null as any },
      order: { name: 'ASC' },
    });
  }

  async findCentresByPostalCode(postalCode: string, tenantId: string): Promise<Centre[]> {
    return this.centreRepository.find({
      where: { tenant_id: tenantId, postal_code: postalCode, status: 'ACTIVE', deleted_at: null as any },
    });
  }

  async findNearestCentres(lat: number, lng: number, tenantId: string, limit = 10): Promise<Centre[]> {
    // Requête avec calcul de distance (Haversine approximatif)
    const centres = await this.centreRepository
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('c.status = :status', { status: 'ACTIVE' })
      .andWhere('c.deleted_at IS NULL')
      .andWhere('c.latitude IS NOT NULL')
      .andWhere('c.longitude IS NOT NULL')
      .addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(c.latitude)) * cos(radians(c.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(c.latitude))))`,
        'distance',
      )
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .orderBy('distance', 'ASC')
      .take(limit)
      .getMany();

    return centres;
  }

  // ===== CONTROLEURS =====

  async createControleur(dto: CreateControleurDto, tenantId: string): Promise<Controleur> {
    // Vérifier que le centre appartient au tenant
    await this.findCentreById(dto.centre_id, tenantId);

    // Générer les initiales si non fournies
    const initiales = dto.initiales || this.generateInitiales(dto.prenom, dto.nom);

    const controleur = this.controleurRepository.create({
      tenant_id: tenantId,
      ...dto,
      initiales,
      status: 'ACTIVE',
    });

    // Incrémenter le compteur du centre
    await this.centreRepository
      .createQueryBuilder()
      .update(Centre)
      .set({ nb_controleurs: () => 'nb_controleurs + 1' })
      .where('id = :centreId', { centreId: dto.centre_id })
      .execute();

    return this.controleurRepository.save(controleur);
  }

  async findControleurById(id: string, tenantId: string): Promise<Controleur> {
    const controleur = await this.controleurRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: null as any },
    });
    if (!controleur) {
      throw new NotFoundException(`Contrôleur ${id} non trouvé`);
    }
    return controleur;
  }

  async listControleursByCentre(centreId: string, tenantId: string): Promise<Controleur[]> {
    return this.controleurRepository.find({
      where: { tenant_id: tenantId, centre_id: centreId, status: 'ACTIVE', deleted_at: null as any },
      order: { nom: 'ASC', prenom: 'ASC' },
    });
  }

  async updateControleur(id: string, dto: UpdateControleurDto, tenantId: string): Promise<Controleur> {
    const controleur = await this.findControleurById(id, tenantId);

    if (dto.centre_id && dto.centre_id !== controleur.centre_id) {
      // Vérifier le nouveau centre
      await this.findCentreById(dto.centre_id, tenantId);

      // Mettre à jour les compteurs
      await this.centreRepository
        .createQueryBuilder()
        .update(Centre)
        .set({ nb_controleurs: () => 'nb_controleurs - 1' })
        .where('id = :oldCentreId', { oldCentreId: controleur.centre_id })
        .execute();

      await this.centreRepository
        .createQueryBuilder()
        .update(Centre)
        .set({ nb_controleurs: () => 'nb_controleurs + 1' })
        .where('id = :newCentreId', { newCentreId: dto.centre_id })
        .execute();
    }

    Object.assign(controleur, dto);
    return this.controleurRepository.save(controleur);
  }

  async deleteControleur(id: string, tenantId: string): Promise<void> {
    const controleur = await this.findControleurById(id, tenantId);
    controleur.deleted_at = new Date();
    controleur.status = 'INACTIVE';
    await this.controleurRepository.save(controleur);

    // Décrémenter le compteur du centre
    await this.centreRepository
      .createQueryBuilder()
      .update(Centre)
      .set({ nb_controleurs: () => 'GREATEST(nb_controleurs - 1, 0)' })
      .where('id = :centreId', { centreId: controleur.centre_id })
      .execute();
  }

  // ===== STATS =====

  async getTenantStats(tenantId: string) {
    const [centresCount, controleursCount] = await Promise.all([
      this.centreRepository.count({
        where: { tenant_id: tenantId, status: 'ACTIVE', deleted_at: null as any },
      }),
      this.controleurRepository.count({
        where: { tenant_id: tenantId, status: 'ACTIVE', deleted_at: null as any },
      }),
    ]);

    return {
      centres_count: centresCount,
      controleurs_count: controleursCount,
    };
  }

  // ===== HELPERS =====

  private generateInitiales(prenom: string, nom: string): string {
    const p = prenom ? prenom.charAt(0).toUpperCase() : '';
    const n = nom ? nom.charAt(0).toUpperCase() : '';
    return p + n;
  }
}
