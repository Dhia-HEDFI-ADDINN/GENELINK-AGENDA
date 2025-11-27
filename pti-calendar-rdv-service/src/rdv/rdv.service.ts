import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Rdv, RdvStatus, RdvHistory } from '../domain/entities/rdv.entity';
import {
  CreateRdvDto,
  UpdateRdvDto,
  ReplanifierRdvDto,
  AnnulerRdvDto,
  ConfirmerRdvDto,
  EnregistrerResultatDto,
  SearchRdvDto,
  PaginatedRdvResponseDto,
  RdvStatsDto,
} from '../application/dto/rdv.dto';
import { KafkaProducerService } from '../infrastructure/kafka/kafka-producer.service';

// Matrices de durées de contrôle
const DUREES_CONTROLE: Record<string, Record<string, Record<string, number>>> = {
  CTP: {
    VP: { essence: 35, diesel: 40, gpl: 50, gnv: 50, hybride: 38, electrique: 32, hydrogene: 45 },
    VL: { essence: 35, diesel: 40, gpl: 50, gnv: 50, hybride: 38, electrique: 32, hydrogene: 45 },
    VU: { essence: 40, diesel: 45, gpl: 55, gnv: 55, hybride: 43, electrique: 37, hydrogene: 50 },
    L: { essence: 30, diesel: 32, gpl: 40, gnv: 40, hybride: 32, electrique: 28, hydrogene: 38 },
    PL: { essence: 60, diesel: 65, gpl: 75, gnv: 75, hybride: 65, electrique: 55, hydrogene: 70 },
  },
  CVP: {
    VP: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
    VL: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
    VU: { essence: 30, diesel: 30, gpl: 35, gnv: 35, hybride: 30, electrique: 25, hydrogene: 32 },
    L: { essence: 22, diesel: 22, gpl: 28, gnv: 28, hybride: 22, electrique: 20, hydrogene: 25 },
    PL: { essence: 40, diesel: 45, gpl: 50, gnv: 50, hybride: 45, electrique: 38, hydrogene: 48 },
  },
  CV: {
    VP: { essence: 20, diesel: 20, gpl: 25, gnv: 25, hybride: 20, electrique: 18, hydrogene: 22 },
    VL: { essence: 20, diesel: 20, gpl: 25, gnv: 25, hybride: 20, electrique: 18, hydrogene: 22 },
    VU: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
    L: { essence: 18, diesel: 18, gpl: 22, gnv: 22, hybride: 18, electrique: 15, hydrogene: 20 },
    PL: { essence: 35, diesel: 35, gpl: 40, gnv: 40, hybride: 35, electrique: 30, hydrogene: 38 },
  },
  CTC: {
    VP: { essence: 15, diesel: 15, gpl: 20, gnv: 20, hybride: 15, electrique: 12, hydrogene: 18 },
    VL: { essence: 15, diesel: 15, gpl: 20, gnv: 20, hybride: 15, electrique: 12, hydrogene: 18 },
    VU: { essence: 18, diesel: 18, gpl: 22, gnv: 22, hybride: 18, electrique: 15, hydrogene: 20 },
    L: { essence: 12, diesel: 12, gpl: 15, gnv: 15, hybride: 12, electrique: 10, hydrogene: 14 },
    PL: { essence: 25, diesel: 25, gpl: 30, gnv: 30, hybride: 25, electrique: 22, hydrogene: 28 },
  },
};

@Injectable()
export class RdvService {
  constructor(
    @InjectRepository(Rdv)
    private readonly rdvRepository: Repository<Rdv>,
    @InjectRepository(RdvHistory)
    private readonly historyRepository: Repository<RdvHistory>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(dto: CreateRdvDto, tenantId: string, userId?: string): Promise<Rdv> {
    // Calculer la durée du contrôle
    const dureeMinutes = this.calculateDuree(
      dto.type_controle,
      dto.type_vehicule,
      dto.carburant,
    );

    // Calculer l'heure de fin
    const heureFin = this.addMinutesToTime(dto.heure_debut, dureeMinutes);

    // Vérifier la disponibilité du créneau
    const isAvailable = await this.checkSlotAvailability(
      tenantId,
      dto.centre_id,
      dto.date,
      dto.heure_debut,
      heureFin,
      dto.controleur_id,
    );

    if (!isAvailable) {
      throw new ConflictException('Le créneau demandé n\'est plus disponible');
    }

    // Créer le RDV
    const rdv = this.rdvRepository.create({
      tenant_id: tenantId,
      ...dto,
      heure_fin: heureFin,
      duree_minutes: dureeMinutes,
      status: RdvStatus.CREE,
      cree_par: userId,
    });

    const savedRdv = await this.rdvRepository.save(rdv);

    // Enregistrer dans l'historique
    await this.createHistoryEntry(savedRdv, 'CREATION', null, RdvStatus.CREE, userId);

    // Invalider le cache des disponibilités
    await this.invalidateDisponibilitesCache(tenantId, dto.centre_id, dto.date);

    // Émettre l'événement Kafka
    await this.kafkaProducer.emit('rdv.created', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      centre_id: dto.centre_id,
      date: dto.date,
      heure_debut: dto.heure_debut,
      heure_fin: heureFin,
      client_telephone: dto.client_telephone,
      client_email: dto.client_email,
      type_controle: dto.type_controle,
      immatriculation: dto.immatriculation,
    });

    return savedRdv;
  }

  async findById(id: string, tenantId: string): Promise<Rdv> {
    const rdv = await this.rdvRepository.findOne({
      where: { id, tenant_id: tenantId, deleted_at: null as any },
    });

    if (!rdv) {
      throw new NotFoundException(`RDV avec l'ID ${id} non trouvé`);
    }

    return rdv;
  }

  async search(query: SearchRdvDto, tenantId: string): Promise<PaginatedRdvResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      tenant_id: tenantId,
      deleted_at: null as any,
    };

    if (query.centre_id) {
      whereClause.centre_id = query.centre_id;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.controleur_id) {
      whereClause.controleur_id = query.controleur_id;
    }

    if (query.date_debut && query.date_fin) {
      whereClause.date = Between(query.date_debut, query.date_fin);
    } else if (query.date_debut) {
      whereClause.date = query.date_debut;
    }

    if (query.immatriculation) {
      whereClause.immatriculation = Like(`%${query.immatriculation.toUpperCase()}%`);
    }

    if (query.client_telephone) {
      whereClause.client_telephone = Like(`%${query.client_telephone}%`);
    }

    if (query.client_nom) {
      whereClause.client_nom = Like(`%${query.client_nom}%`);
    }

    const [items, total] = await this.rdvRepository.findAndCount({
      where: whereClause,
      order: { date: 'ASC', heure_debut: 'ASC' },
      skip,
      take: limit,
    });

    return {
      items: items as any,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async update(id: string, dto: UpdateRdvDto, tenantId: string, userId?: string): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    // Vérifier que le RDV peut être modifié
    if ([RdvStatus.TERMINE, RdvStatus.ANNULE].includes(rdv.status)) {
      throw new BadRequestException('Ce RDV ne peut plus être modifié');
    }

    const ancienStatus = rdv.status;
    const modifications: Record<string, { ancien: any; nouveau: any }> = {};

    // Tracker les modifications
    for (const [key, value] of Object.entries(dto)) {
      if ((rdv as any)[key] !== value) {
        modifications[key] = { ancien: (rdv as any)[key], nouveau: value };
        (rdv as any)[key] = value;
      }
    }

    // Si changement de créneau, vérifier la disponibilité
    if (dto.date || dto.heure_debut) {
      const newDate = dto.date || rdv.date;
      const newHeure = dto.heure_debut || rdv.heure_debut;
      const heureFin = this.addMinutesToTime(newHeure, rdv.duree_minutes);

      const isAvailable = await this.checkSlotAvailability(
        tenantId,
        rdv.centre_id,
        newDate,
        newHeure,
        heureFin,
        rdv.controleur_id,
        id, // Exclure le RDV actuel
      );

      if (!isAvailable) {
        throw new ConflictException('Le nouveau créneau n\'est pas disponible');
      }

      rdv.heure_fin = heureFin;
    }

    const savedRdv = await this.rdvRepository.save(rdv);

    // Enregistrer dans l'historique
    if (Object.keys(modifications).length > 0) {
      await this.createHistoryEntry(
        savedRdv,
        'MODIFICATION',
        ancienStatus,
        savedRdv.status,
        userId,
        modifications,
      );
    }

    // Émettre l'événement Kafka
    await this.kafkaProducer.emit('rdv.updated', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      modifications,
    });

    return savedRdv;
  }

  async confirmer(id: string, dto: ConfirmerRdvDto, tenantId: string, userId?: string): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if (rdv.status !== RdvStatus.CREE) {
      throw new BadRequestException('Seuls les RDV en statut CREE peuvent être confirmés');
    }

    const ancienStatus = rdv.status;
    rdv.status = RdvStatus.CONFIRME;

    if (dto.controleur_id) {
      rdv.controleur_id = dto.controleur_id;
    }

    if (dto.ligne_controle) {
      rdv.ligne_controle = dto.ligne_controle;
    }

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(savedRdv, 'CONFIRMATION', ancienStatus, RdvStatus.CONFIRME, userId);

    // Émettre l'événement pour l'envoi de confirmation
    await this.kafkaProducer.emit('rdv.confirmed', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      client_telephone: rdv.client_telephone,
      client_email: rdv.client_email,
      date: rdv.date,
      heure_debut: rdv.heure_debut,
      centre_nom: rdv.centre_nom,
    });

    return savedRdv;
  }

  async replanifier(
    id: string,
    dto: ReplanifierRdvDto,
    tenantId: string,
    userId?: string,
  ): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if ([RdvStatus.TERMINE, RdvStatus.ANNULE, RdvStatus.EN_COURS].includes(rdv.status)) {
      throw new BadRequestException('Ce RDV ne peut pas être replanifié');
    }

    const newCentreId = dto.nouveau_centre_id || rdv.centre_id;
    const newControleurId = dto.nouveau_controleur_id || rdv.controleur_id;
    const heureFin = this.addMinutesToTime(dto.nouvelle_heure, rdv.duree_minutes);

    // Vérifier la disponibilité
    const isAvailable = await this.checkSlotAvailability(
      tenantId,
      newCentreId,
      dto.nouvelle_date,
      dto.nouvelle_heure,
      heureFin,
      newControleurId,
      id,
    );

    if (!isAvailable) {
      throw new ConflictException('Le nouveau créneau n\'est pas disponible');
    }

    const ancienneDate = rdv.date;
    const ancienneHeure = rdv.heure_debut;
    const ancienStatus = rdv.status;

    rdv.date = dto.nouvelle_date;
    rdv.heure_debut = dto.nouvelle_heure;
    rdv.heure_fin = heureFin;
    rdv.centre_id = newCentreId;
    rdv.controleur_id = newControleurId || null as any;
    rdv.status = RdvStatus.REPORTE;

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(
      savedRdv,
      'REPLANIFICATION',
      ancienStatus,
      RdvStatus.REPORTE,
      userId,
      {
        date: { ancien: ancienneDate, nouveau: dto.nouvelle_date },
        heure_debut: { ancien: ancienneHeure, nouveau: dto.nouvelle_heure },
      },
      dto.motif,
    );

    // Invalider les caches
    await this.invalidateDisponibilitesCache(tenantId, rdv.centre_id, ancienneDate);
    await this.invalidateDisponibilitesCache(tenantId, newCentreId, dto.nouvelle_date);

    // Émettre l'événement
    await this.kafkaProducer.emit('rdv.rescheduled', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      ancienne_date: ancienneDate,
      ancienne_heure: ancienneHeure,
      nouvelle_date: dto.nouvelle_date,
      nouvelle_heure: dto.nouvelle_heure,
      client_telephone: rdv.client_telephone,
      client_email: rdv.client_email,
    });

    return savedRdv;
  }

  async annuler(id: string, dto: AnnulerRdvDto, tenantId: string, userId?: string): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if ([RdvStatus.TERMINE, RdvStatus.ANNULE].includes(rdv.status)) {
      throw new BadRequestException('Ce RDV est déjà terminé ou annulé');
    }

    const ancienStatus = rdv.status;
    rdv.status = RdvStatus.ANNULE;

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(
      savedRdv,
      'ANNULATION',
      ancienStatus,
      RdvStatus.ANNULE,
      userId,
      undefined,
      dto.motif,
    );

    // Invalider le cache
    await this.invalidateDisponibilitesCache(tenantId, rdv.centre_id, rdv.date);

    // Émettre l'événement
    await this.kafkaProducer.emit('rdv.cancelled', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      motif: dto.motif,
      demande_remboursement: dto.demande_remboursement,
      paiement_effectue: rdv.paiement_effectue,
      paiement_id: rdv.paiement_id,
      client_telephone: rdv.client_telephone,
      client_email: rdv.client_email,
    });

    return savedRdv;
  }

  async demarrerControle(id: string, tenantId: string, userId?: string): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if (rdv.status !== RdvStatus.CONFIRME && rdv.status !== RdvStatus.RAPPELE) {
      throw new BadRequestException('Le RDV doit être confirmé pour démarrer le contrôle');
    }

    const ancienStatus = rdv.status;
    rdv.status = RdvStatus.EN_COURS;
    rdv.date_controle_effectif = new Date();

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(savedRdv, 'DEBUT_CONTROLE', ancienStatus, RdvStatus.EN_COURS, userId);

    await this.kafkaProducer.emit('rdv.control_started', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      controleur_id: rdv.controleur_id,
    });

    return savedRdv;
  }

  async enregistrerResultat(
    id: string,
    dto: EnregistrerResultatDto,
    tenantId: string,
    userId?: string,
  ): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if (rdv.status !== RdvStatus.EN_COURS) {
      throw new BadRequestException('Le contrôle doit être en cours pour enregistrer un résultat');
    }

    rdv.status = RdvStatus.TERMINE;
    rdv.resultat_controle = dto.resultat;
    rdv.numero_pv = dto.numero_pv || null as any;

    if (dto.resultat === 'S' || dto.resultat === 'R') {
      rdv.date_limite_cv = dto.date_limite_cv || null as any;
    }

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(
      savedRdv,
      'FIN_CONTROLE',
      RdvStatus.EN_COURS,
      RdvStatus.TERMINE,
      userId,
      { resultat: { ancien: null, nouveau: dto.resultat } },
      dto.commentaires,
    );

    await this.kafkaProducer.emit('rdv.completed', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      resultat: dto.resultat,
      numero_pv: dto.numero_pv,
      date_limite_cv: dto.date_limite_cv,
      client_id: rdv.client_id,
      immatriculation: rdv.immatriculation,
    });

    return savedRdv;
  }

  async marquerNoShow(id: string, tenantId: string, userId?: string): Promise<Rdv> {
    const rdv = await this.findById(id, tenantId);

    if (![RdvStatus.CONFIRME, RdvStatus.RAPPELE].includes(rdv.status)) {
      throw new BadRequestException('Statut invalide pour marquer comme no-show');
    }

    const ancienStatus = rdv.status;
    rdv.status = RdvStatus.NO_SHOW;

    const savedRdv = await this.rdvRepository.save(rdv);

    await this.createHistoryEntry(savedRdv, 'NO_SHOW', ancienStatus, RdvStatus.NO_SHOW, userId);

    await this.kafkaProducer.emit('rdv.no_show', {
      rdv_id: savedRdv.id,
      tenant_id: tenantId,
      client_id: rdv.client_id,
      client_telephone: rdv.client_telephone,
    });

    return savedRdv;
  }

  async getStatsByCentre(
    centreId: string,
    dateDebut: string,
    dateFin: string,
    tenantId: string,
  ): Promise<RdvStatsDto> {
    const rdvs = await this.rdvRepository.find({
      where: {
        tenant_id: tenantId,
        centre_id: centreId,
        date: Between(dateDebut, dateFin),
        deleted_at: null as any,
      },
    });

    const parStatus: Record<RdvStatus, number> = {
      [RdvStatus.CREE]: 0,
      [RdvStatus.CONFIRME]: 0,
      [RdvStatus.RAPPELE]: 0,
      [RdvStatus.EN_COURS]: 0,
      [RdvStatus.TERMINE]: 0,
      [RdvStatus.ANNULE]: 0,
      [RdvStatus.NO_SHOW]: 0,
      [RdvStatus.REPORTE]: 0,
    };

    const parTypeControle: Record<string, number> = {};
    let caTotal = 0;
    let caEncaisse = 0;

    for (const rdv of rdvs) {
      parStatus[rdv.status]++;
      parTypeControle[rdv.type_controle] = (parTypeControle[rdv.type_controle] || 0) + 1;

      if (rdv.prix_ttc) {
        caTotal += Number(rdv.prix_ttc);
        if (rdv.paiement_effectue) {
          caEncaisse += Number(rdv.prix_ttc);
        }
      }
    }

    // Calculer le taux de remplissage (simplifié)
    const totalRdv = rdvs.length;
    const rdvEffectifs = rdvs.filter(
      (r) => ![RdvStatus.ANNULE, RdvStatus.NO_SHOW].includes(r.status),
    ).length;
    const tauxRemplissage = totalRdv > 0 ? (rdvEffectifs / totalRdv) * 100 : 0;

    return {
      total: totalRdv,
      par_status: parStatus,
      par_type_controle: parTypeControle as any,
      taux_remplissage: Math.round(tauxRemplissage * 100) / 100,
      ca_total: caTotal,
      ca_encaisse: caEncaisse,
    };
  }

  async getRdvsByControleur(
    controleurId: string,
    date: string,
    tenantId: string,
  ): Promise<Rdv[]> {
    return this.rdvRepository.find({
      where: {
        tenant_id: tenantId,
        controleur_id: controleurId,
        date,
        status: In([RdvStatus.CONFIRME, RdvStatus.RAPPELE, RdvStatus.EN_COURS]),
        deleted_at: null as any,
      },
      order: { heure_debut: 'ASC' },
    });
  }

  async getHistory(rdvId: string, tenantId: string): Promise<RdvHistory[]> {
    return this.historyRepository.find({
      where: { rdv_id: rdvId, tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  // Méthodes privées
  private calculateDuree(typeControle: string, typeVehicule: string, carburant: string): number {
    const type = typeControle.toUpperCase();
    const vehicule = typeVehicule.toUpperCase();
    const fuel = carburant.toLowerCase();

    return DUREES_CONTROLE[type]?.[vehicule]?.[fuel] || 45;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  private async checkSlotAvailability(
    tenantId: string,
    centreId: string,
    date: string,
    heureDebut: string,
    heureFin: string,
    controleurId?: string,
    excludeRdvId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.rdvRepository
      .createQueryBuilder('rdv')
      .where('rdv.tenant_id = :tenantId', { tenantId })
      .andWhere('rdv.centre_id = :centreId', { centreId })
      .andWhere('rdv.date = :date', { date })
      .andWhere('rdv.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [RdvStatus.ANNULE, RdvStatus.NO_SHOW],
      })
      .andWhere('rdv.deleted_at IS NULL')
      .andWhere('rdv.heure_debut < :heureFin', { heureFin })
      .andWhere('rdv.heure_fin > :heureDebut', { heureDebut });

    if (controleurId) {
      queryBuilder.andWhere('rdv.controleur_id = :controleurId', { controleurId });
    }

    if (excludeRdvId) {
      queryBuilder.andWhere('rdv.id != :excludeRdvId', { excludeRdvId });
    }

    const conflictingRdv = await queryBuilder.getCount();
    return conflictingRdv === 0;
  }

  private async createHistoryEntry(
    rdv: Rdv,
    action: string,
    ancienStatus: RdvStatus | null,
    nouveauStatus: RdvStatus,
    userId?: string,
    modifications?: Record<string, { ancien: any; nouveau: any }>,
    commentaire?: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      tenant_id: rdv.tenant_id,
      rdv_id: rdv.id,
      action,
      ancien_status: ancienStatus,
      nouveau_status: nouveauStatus,
      modifications,
      utilisateur_id: userId,
      commentaire,
    });

    await this.historyRepository.save(history);
  }

  private async invalidateDisponibilitesCache(
    tenantId: string,
    centreId: string,
    date: string,
  ): Promise<void> {
    const cacheKey = `disponibilites:${tenantId}:${centreId}:${date}:*`;
    // Note: Redis pattern delete nécessite une implémentation spécifique
    // Pour l'instant, on invalide la clé spécifique
    await this.cacheManager.del(`disponibilites:${tenantId}:${centreId}:${date}`);
  }
}
