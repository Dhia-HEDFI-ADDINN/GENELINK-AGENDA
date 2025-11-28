import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Centre, CentreStatus } from './centre.entity';

export interface SearchCentresParams {
  search?: string;
  code_postal?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  rayon_km?: number;
  reseau_id?: string;
  status?: CentreStatus;
  agrements?: string[];
  page?: number;
  limit?: number;
}

export interface CentresSearchResult {
  data: Centre[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CentresService {
  constructor(
    @InjectRepository(Centre)
    private readonly centreRepository: Repository<Centre>,
  ) {}

  async findAll(tenantId: string, params: SearchCentresParams = {}): Promise<CentresSearchResult> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.centreRepository
      .createQueryBuilder('centre')
      .where('centre.tenant_id = :tenantId', { tenantId })
      .andWhere('centre.status = :status', { status: params.status || 'active' });

    // Search by name, code, or city
    if (params.search) {
      queryBuilder.andWhere(
        '(centre.nom ILIKE :search OR centre.code ILIKE :search OR centre.adresse->>\'ville\' ILIKE :search OR centre.adresse->>\'code_postal\' LIKE :searchStart)',
        { search: `%${params.search}%`, searchStart: `${params.search}%` },
      );
    }

    // Filter by code postal
    if (params.code_postal) {
      queryBuilder.andWhere('centre.adresse->>\'code_postal\' LIKE :cp', {
        cp: `${params.code_postal}%`,
      });
    }

    // Filter by ville
    if (params.ville) {
      queryBuilder.andWhere('centre.adresse->>\'ville\' ILIKE :ville', {
        ville: `%${params.ville}%`,
      });
    }

    // Filter by réseau
    if (params.reseau_id) {
      queryBuilder.andWhere('centre.reseau_id = :reseauId', { reseauId: params.reseau_id });
    }

    // Filter by agréments
    if (params.agrements && params.agrements.length > 0) {
      queryBuilder.andWhere('centre.agrements && :agrements', {
        agrements: params.agrements,
      });
    }

    // Geolocation search with Haversine formula
    if (params.latitude && params.longitude) {
      const rayon = params.rayon_km || 50;

      queryBuilder.addSelect(
        `(6371 * acos(
          cos(radians(:lat)) *
          cos(radians((centre.coordonnees->>'latitude')::float)) *
          cos(radians((centre.coordonnees->>'longitude')::float) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians((centre.coordonnees->>'latitude')::float))
        ))`,
        'distance',
      );

      queryBuilder.setParameters({
        lat: params.latitude,
        lng: params.longitude,
      });

      queryBuilder.andWhere(
        `(6371 * acos(
          cos(radians(:lat)) *
          cos(radians((centre.coordonnees->>'latitude')::float)) *
          cos(radians((centre.coordonnees->>'longitude')::float) - radians(:lng)) +
          sin(radians(:lat)) *
          sin(radians((centre.coordonnees->>'latitude')::float))
        )) <= :rayon`,
        { rayon },
      );

      queryBuilder.orderBy('distance', 'ASC');
    } else {
      queryBuilder.orderBy('centre.nom', 'ASC');
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get results
    const rawResults = await queryBuilder.getRawAndEntities();
    const centres = rawResults.entities;

    // Attach distance if computed
    if (params.latitude && params.longitude) {
      rawResults.raw.forEach((raw, index) => {
        if (centres[index]) {
          centres[index].distance = parseFloat(raw.distance) || 0;
        }
      });
    }

    return {
      data: centres,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<Centre> {
    const centre = await this.centreRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!centre) {
      throw new NotFoundException(`Centre avec l'ID ${id} non trouvé`);
    }

    return centre;
  }

  async findByCode(code: string, tenantId: string): Promise<Centre> {
    const centre = await this.centreRepository.findOne({
      where: { code, tenant_id: tenantId },
    });

    if (!centre) {
      throw new NotFoundException(`Centre avec le code ${code} non trouvé`);
    }

    return centre;
  }

  async findNearby(
    latitude: number,
    longitude: number,
    tenantId: string,
    rayonKm: number = 30,
    limit: number = 10,
  ): Promise<Centre[]> {
    const result = await this.findAll(tenantId, {
      latitude,
      longitude,
      rayon_km: rayonKm,
      limit,
    });

    return result.data;
  }

  async create(centreData: Partial<Centre>, tenantId: string): Promise<Centre> {
    const centre = this.centreRepository.create({
      ...centreData,
      tenant_id: tenantId,
    });

    return this.centreRepository.save(centre);
  }

  async update(id: string, centreData: Partial<Centre>, tenantId: string): Promise<Centre> {
    const centre = await this.findById(id, tenantId);

    Object.assign(centre, centreData);

    return this.centreRepository.save(centre);
  }

  async updateStatus(id: string, status: CentreStatus, tenantId: string): Promise<Centre> {
    const centre = await this.findById(id, tenantId);
    centre.status = status;
    return this.centreRepository.save(centre);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const centre = await this.findById(id, tenantId);
    await this.centreRepository.remove(centre);
  }

  async getControleurs(centreId: string, tenantId: string): Promise<any[]> {
    // This would typically query a separate controleurs table
    // For now, return empty array - would need to join with user service
    return [];
  }

  async getTarifs(centreId: string, tenantId: string): Promise<any[]> {
    // Would query tarifs table
    return [];
  }
}
