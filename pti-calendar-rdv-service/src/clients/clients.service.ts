import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Client, Vehicule } from '../domain/entities/client.entity';
import {
  CreateClientDto,
  UpdateClientDto,
  SearchClientDto,
  CreateVehiculeDto,
  UpdateVehiculeDto,
  PaginatedClientResponseDto,
} from '../application/dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Vehicule)
    private readonly vehiculeRepository: Repository<Vehicule>,
  ) {}

  async create(dto: CreateClientDto, tenantId: string): Promise<Client> {
    // Vérifier si le client existe déjà (par email ou téléphone)
    if (dto.email) {
      const existingByEmail = await this.clientRepository.findOne({
        where: { tenant_id: tenantId, email: dto.email, deleted_at: null as any },
      });
      if (existingByEmail) {
        throw new ConflictException('Un client avec cet email existe déjà');
      }
    }

    const existingByPhone = await this.clientRepository.findOne({
      where: { tenant_id: tenantId, telephone: dto.telephone, deleted_at: null as any },
    });
    if (existingByPhone) {
      throw new ConflictException('Un client avec ce téléphone existe déjà');
    }

    const client = this.clientRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    return this.clientRepository.save(client);
  }

  async findById(id: string, tenantId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: null as any },
      relations: ['vehicules'],
    });

    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    return client;
  }

  async findByPhone(telephone: string, tenantId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { tenant_id: tenantId, telephone, deleted_at: null as any },
    });
  }

  async findByEmail(email: string, tenantId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { tenant_id: tenantId, email, deleted_at: null as any },
    });
  }

  async search(query: SearchClientDto, tenantId: string): Promise<PaginatedClientResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.tenant_id = :tenantId', { tenantId })
      .andWhere('client.deleted_at IS NULL');

    if (query.q) {
      queryBuilder.andWhere(
        '(client.nom ILIKE :q OR client.prenom ILIKE :q OR client.email ILIKE :q OR client.telephone LIKE :q OR client.societe ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (query.nom) {
      queryBuilder.andWhere('client.nom ILIKE :nom', { nom: `%${query.nom}%` });
    }

    if (query.email) {
      queryBuilder.andWhere('client.email = :email', { email: query.email });
    }

    if (query.telephone) {
      queryBuilder.andWhere('client.telephone = :telephone', { telephone: query.telephone });
    }

    if (query.siret) {
      queryBuilder.andWhere('client.siret = :siret', { siret: query.siret });
    }

    if (query.professionnel !== undefined) {
      queryBuilder.andWhere('client.professionnel = :professionnel', {
        professionnel: query.professionnel,
      });
    }

    queryBuilder.orderBy('client.nom', 'ASC').addOrderBy('client.prenom', 'ASC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items: items as any,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateClientDto, tenantId: string): Promise<Client> {
    const client = await this.findById(id, tenantId);

    // Vérifier les conflits si email ou téléphone changent
    if (dto.email && dto.email !== client.email) {
      const existingByEmail = await this.clientRepository.findOne({
        where: { tenant_id: tenantId, email: dto.email, deleted_at: null as any },
      });
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException('Un client avec cet email existe déjà');
      }
    }

    if (dto.telephone && dto.telephone !== client.telephone) {
      const existingByPhone = await this.clientRepository.findOne({
        where: { tenant_id: tenantId, telephone: dto.telephone, deleted_at: null as any },
      });
      if (existingByPhone && existingByPhone.id !== id) {
        throw new ConflictException('Un client avec ce téléphone existe déjà');
      }
    }

    Object.assign(client, dto);
    return this.clientRepository.save(client);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const client = await this.findById(id, tenantId);
    client.deleted_at = new Date();
    await this.clientRepository.save(client);
  }

  async incrementRdvCount(clientId: string, tenantId: string): Promise<void> {
    await this.clientRepository
      .createQueryBuilder()
      .update(Client)
      .set({
        nb_rdv_total: () => 'nb_rdv_total + 1',
        dernier_rdv: new Date().toISOString().split('T')[0],
      })
      .where('id = :clientId AND tenant_id = :tenantId', { clientId, tenantId })
      .execute();
  }

  async incrementNoShowCount(clientId: string, tenantId: string): Promise<void> {
    await this.clientRepository
      .createQueryBuilder()
      .update(Client)
      .set({ nb_no_show: () => 'nb_no_show + 1' })
      .where('id = :clientId AND tenant_id = :tenantId', { clientId, tenantId })
      .execute();
  }

  // Véhicules
  async createVehicule(dto: CreateVehiculeDto, tenantId: string): Promise<Vehicule> {
    // Vérifier si le véhicule existe déjà
    const existingVehicule = await this.vehiculeRepository.findOne({
      where: {
        tenant_id: tenantId,
        immatriculation: dto.immatriculation.toUpperCase(),
        deleted_at: null as any,
      },
    });

    if (existingVehicule) {
      throw new ConflictException('Un véhicule avec cette immatriculation existe déjà');
    }

    const vehicule = this.vehiculeRepository.create({
      tenant_id: tenantId,
      ...dto,
      immatriculation: dto.immatriculation.toUpperCase(),
    });

    return this.vehiculeRepository.save(vehicule);
  }

  async findVehiculeById(id: string, tenantId: string): Promise<Vehicule> {
    const vehicule = await this.vehiculeRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: null as any },
    });

    if (!vehicule) {
      throw new NotFoundException(`Véhicule avec l'ID ${id} non trouvé`);
    }

    return vehicule;
  }

  async findVehiculeByImmatriculation(
    immatriculation: string,
    tenantId: string,
  ): Promise<Vehicule | null> {
    return this.vehiculeRepository.findOne({
      where: {
        tenant_id: tenantId,
        immatriculation: immatriculation.toUpperCase(),
        deleted_at: null as any,
      },
    });
  }

  async findVehiculesByClient(clientId: string, tenantId: string): Promise<Vehicule[]> {
    return this.vehiculeRepository.find({
      where: { tenant_id: tenantId, client_id: clientId, deleted_at: null as any },
      order: { created_at: 'DESC' },
    });
  }

  async updateVehicule(id: string, dto: UpdateVehiculeDto, tenantId: string): Promise<Vehicule> {
    const vehicule = await this.findVehiculeById(id, tenantId);

    if (dto.immatriculation && dto.immatriculation !== vehicule.immatriculation) {
      const existingVehicule = await this.findVehiculeByImmatriculation(dto.immatriculation, tenantId);
      if (existingVehicule && existingVehicule.id !== id) {
        throw new ConflictException('Un véhicule avec cette immatriculation existe déjà');
      }
      dto.immatriculation = dto.immatriculation.toUpperCase();
    }

    Object.assign(vehicule, dto);
    return this.vehiculeRepository.save(vehicule);
  }

  async updateVehiculeAfterControle(
    immatriculation: string,
    tenantId: string,
    resultat: string,
    dateControle: string,
    kilometrage?: number,
  ): Promise<void> {
    const vehicule = await this.findVehiculeByImmatriculation(immatriculation, tenantId);
    if (!vehicule) return;

    vehicule.date_dernier_ct = dateControle;
    vehicule.resultat_dernier_ct = resultat;
    if (kilometrage) {
      vehicule.kilometrage_dernier_ct = kilometrage;
    }

    // Calculer la prochaine date de CT (généralement 2 ans après)
    if (resultat === 'A') {
      const nextDate = new Date(dateControle);
      nextDate.setFullYear(nextDate.getFullYear() + 2);
      vehicule.date_prochain_ct = nextDate.toISOString().split('T')[0];
    }

    await this.vehiculeRepository.save(vehicule);
  }

  async deleteVehicule(id: string, tenantId: string): Promise<void> {
    const vehicule = await this.findVehiculeById(id, tenantId);
    vehicule.deleted_at = new Date();
    await this.vehiculeRepository.save(vehicule);
  }

  // Recherche avancée avec véhicules
  async findOrCreateClient(
    telephone: string,
    tenantId: string,
    clientData?: Partial<CreateClientDto>,
  ): Promise<Client> {
    let client = await this.findByPhone(telephone, tenantId);

    if (!client && clientData) {
      client = await this.create(
        {
          telephone,
          nom: clientData.nom || 'Client',
          ...clientData,
        } as CreateClientDto,
        tenantId,
      );
    }

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    return client;
  }

  async mergeClients(
    sourceId: string,
    targetId: string,
    tenantId: string,
  ): Promise<Client> {
    const source = await this.findById(sourceId, tenantId);
    const target = await this.findById(targetId, tenantId);

    // Transférer les véhicules
    await this.vehiculeRepository
      .createQueryBuilder()
      .update(Vehicule)
      .set({ client_id: targetId })
      .where('client_id = :sourceId AND tenant_id = :tenantId', { sourceId, tenantId })
      .execute();

    // Mettre à jour les statistiques
    target.nb_rdv_total += source.nb_rdv_total;
    target.nb_no_show += source.nb_no_show;
    if (source.points_fidelite) {
      target.points_fidelite += source.points_fidelite;
    }

    // Soft delete du client source
    source.deleted_at = new Date();
    await this.clientRepository.save(source);

    return this.clientRepository.save(target);
  }
}
