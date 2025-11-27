import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Planning, PlanningControleur } from '../domain/entities/planning.entity';
import { CreneauBloque, BlockMotif } from '../domain/entities/creneau-bloque.entity';

export interface CreatePlanningDto {
  centre_id: string;
  date: string;
  controleurs: PlanningControleur[];
  jour_ferie?: boolean;
  commentaire?: string;
}

export interface UpdatePlanningDto {
  controleurs?: PlanningControleur[];
  jour_ferie?: boolean;
  ferme?: boolean;
  commentaire?: string;
}

export interface BlockCreneauDto {
  centre_id: string;
  controleur_id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: BlockMotif;
  description?: string;
  recurrent?: boolean;
}

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(Planning)
    private readonly planningRepository: Repository<Planning>,
    @InjectRepository(CreneauBloque)
    private readonly creneauBloqueRepository: Repository<CreneauBloque>,
  ) {}

  async findByDate(centreId: string, date: string, tenantId: string): Promise<Planning | null> {
    return this.planningRepository.findOne({
      where: {
        centre_id: centreId,
        date,
        tenant_id: tenantId,
      },
      relations: ['creneaux_bloques'],
    });
  }

  async findByDateRange(
    centreId: string,
    startDate: string,
    endDate: string,
    tenantId: string,
  ): Promise<Planning[]> {
    return this.planningRepository.find({
      where: {
        centre_id: centreId,
        tenant_id: tenantId,
        date: Between(startDate, endDate),
      },
      relations: ['creneaux_bloques'],
      order: { date: 'ASC' },
    });
  }

  async create(dto: CreatePlanningDto, tenantId: string): Promise<Planning> {
    // Check if planning already exists for this date
    const existing = await this.findByDate(dto.centre_id, dto.date, tenantId);
    if (existing) {
      // Update instead
      return this.update(existing.id, dto, tenantId);
    }

    const planning = this.planningRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      centre_id: dto.centre_id,
      date: dto.date,
      controleurs: dto.controleurs,
      jour_ferie: dto.jour_ferie || false,
      commentaire: dto.commentaire,
    });

    return this.planningRepository.save(planning);
  }

  async update(id: string, dto: UpdatePlanningDto, tenantId: string): Promise<Planning> {
    const planning = await this.planningRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!planning) {
      throw new NotFoundException('Planning non trouvé');
    }

    if (dto.controleurs !== undefined) planning.controleurs = dto.controleurs;
    if (dto.jour_ferie !== undefined) planning.jour_ferie = dto.jour_ferie;
    if (dto.ferme !== undefined) planning.ferme = dto.ferme;
    if (dto.commentaire !== undefined) planning.commentaire = dto.commentaire;

    return this.planningRepository.save(planning);
  }

  async blockCreneau(dto: BlockCreneauDto, tenantId: string): Promise<CreneauBloque> {
    // Find or create planning for this date
    let planning = await this.findByDate(dto.centre_id, dto.date, tenantId);

    if (!planning) {
      planning = await this.create({
        centre_id: dto.centre_id,
        date: dto.date,
        controleurs: [],
      }, tenantId);
    }

    const creneau = this.creneauBloqueRepository.create({
      id: uuidv4(),
      tenant_id: tenantId,
      centre_id: dto.centre_id,
      controleur_id: dto.controleur_id,
      planning_id: planning.id,
      date: dto.date,
      heure_debut: dto.heure_debut,
      heure_fin: dto.heure_fin,
      motif: dto.motif,
      description: dto.description,
      recurrent: dto.recurrent || false,
    });

    return this.creneauBloqueRepository.save(creneau);
  }

  async unblockCreneau(creneauId: string, tenantId: string): Promise<void> {
    const creneau = await this.creneauBloqueRepository.findOne({
      where: { id: creneauId, tenant_id: tenantId },
    });

    if (!creneau) {
      throw new NotFoundException('Créneau bloqué non trouvé');
    }

    await this.creneauBloqueRepository.remove(creneau);
  }

  async getCreneauxBloques(
    centreId: string,
    date: string,
    tenantId: string,
    controleurId?: string,
  ): Promise<CreneauBloque[]> {
    const query: any = {
      centre_id: centreId,
      date,
      tenant_id: tenantId,
    };

    if (controleurId) {
      query.controleur_id = controleurId;
    }

    return this.creneauBloqueRepository.find({
      where: query,
      order: { heure_debut: 'ASC' },
    });
  }

  async duplicateWeek(
    centreId: string,
    sourceWeekStart: string,
    targetWeekStart: string,
    tenantId: string,
  ): Promise<Planning[]> {
    const sourceWeekEnd = this.addDays(sourceWeekStart, 6);
    const sourcePlannings = await this.findByDateRange(centreId, sourceWeekStart, sourceWeekEnd, tenantId);

    const createdPlannings: Planning[] = [];

    for (const source of sourcePlannings) {
      const dayOffset = this.getDaysDifference(sourceWeekStart, source.date);
      const targetDate = this.addDays(targetWeekStart, dayOffset);

      const newPlanning = await this.create({
        centre_id: centreId,
        date: targetDate,
        controleurs: source.controleurs,
        commentaire: source.commentaire,
      }, tenantId);

      createdPlannings.push(newPlanning);
    }

    return createdPlannings;
  }

  private addDays(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }
}
