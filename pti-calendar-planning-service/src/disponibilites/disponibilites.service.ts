import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planning, PlanningControleur, PlageHoraire } from '../domain/entities/planning.entity';
import { CreneauBloque } from '../domain/entities/creneau-bloque.entity';

export interface DisponibilitesQuery {
  centre_id: string;
  date: string;
  type_controle: string;
  type_vehicule: string;
  carburant: string;
}

export interface Creneau {
  id?: string;
  controleur_id?: string;
  controleur_nom?: string;
  controleur_prenom?: string;
  initiales?: string;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  duree_minutes: number;
  type: 'standard' | 'depot_vehicule';
  disponible: boolean;
  charge_prevue?: 'faible' | 'moyenne' | 'forte';
}

export interface DisponibilitesResponse {
  centre_id: string;
  date: string;
  type_controle: string;
  duree_controle: number;
  nb_creneaux: number;
  creneaux: Creneau[];
}

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
};

@Injectable()
export class DisponibilitesService {
  constructor(
    @InjectRepository(Planning)
    private readonly planningRepository: Repository<Planning>,
    @InjectRepository(CreneauBloque)
    private readonly creneauBloqueRepository: Repository<CreneauBloque>,
  ) {}

  async calculerDisponibilites(
    query: DisponibilitesQuery,
    tenantId: string,
    rdvExistants: { controleur_id: string; heure_debut: string; heure_fin: string }[] = [],
  ): Promise<DisponibilitesResponse> {
    // 1. Récupérer le planning du jour
    const planning = await this.planningRepository.findOne({
      where: {
        centre_id: query.centre_id,
        date: query.date,
        tenant_id: tenantId,
      },
    });

    if (!planning || planning.ferme) {
      return {
        centre_id: query.centre_id,
        date: query.date,
        type_controle: query.type_controle,
        duree_controle: this.getDureeControle(query.type_controle, query.type_vehicule, query.carburant),
        nb_creneaux: 0,
        creneaux: [],
      };
    }

    // 2. Récupérer les créneaux bloqués
    const creneauxBloques = await this.creneauBloqueRepository.find({
      where: {
        centre_id: query.centre_id,
        date: query.date,
        tenant_id: tenantId,
      },
    });

    // 3. Calculer la durée du contrôle
    const dureeControle = this.getDureeControle(
      query.type_controle,
      query.type_vehicule,
      query.carburant,
    );

    // 4. Filtrer les contrôleurs habilités
    const controleursFiltres = this.filtrerControleursHabilites(
      planning.controleurs,
      query.type_vehicule,
      query.carburant,
    );

    // 5. Calculer les créneaux disponibles
    const creneaux: Creneau[] = [];
    const interval = 15; // Intervalle de 15 minutes

    for (const controleur of controleursFiltres) {
      // Pour chaque plage horaire du contrôleur
      for (const plage of controleur.plages) {
        const slots = this.generateTimeSlots(plage, dureeControle, interval);

        for (const slot of slots) {
          // Vérifier si le créneau n'est pas bloqué
          const isBlocked = this.isCreneauBlocked(
            slot.start,
            slot.end,
            controleur.controleur_id,
            creneauxBloques,
          );

          // Vérifier si le créneau n'est pas déjà pris par un RDV
          const isOccupied = this.isCreneauOccupied(
            slot.start,
            slot.end,
            controleur.controleur_id,
            rdvExistants,
          );

          if (!isBlocked && !isOccupied) {
            creneaux.push({
              controleur_id: controleur.controleur_id,
              controleur_nom: controleur.controleur_nom,
              controleur_prenom: controleur.controleur_prenom,
              initiales: controleur.initiales,
              date: query.date,
              heure_debut: slot.start,
              heure_fin: slot.end,
              duree_minutes: dureeControle,
              type: 'standard',
              disponible: true,
            });
          }
        }
      }
    }

    // Trier par heure puis par contrôleur
    creneaux.sort((a, b) => {
      if (a.heure_debut! < b.heure_debut!) return -1;
      if (a.heure_debut! > b.heure_debut!) return 1;
      return 0;
    });

    // Limiter à 50 créneaux
    const creneauxLimites = creneaux.slice(0, 50);

    return {
      centre_id: query.centre_id,
      date: query.date,
      type_controle: query.type_controle,
      duree_controle: dureeControle,
      nb_creneaux: creneauxLimites.length,
      creneaux: creneauxLimites,
    };
  }

  private getDureeControle(typeControle: string, typeVehicule: string, carburant: string): number {
    const type = typeControle.toUpperCase();
    const vehicule = typeVehicule.toUpperCase();
    const fuel = carburant.toLowerCase();

    return DUREES_CONTROLE[type]?.[vehicule]?.[fuel] || 45;
  }

  private filtrerControleursHabilites(
    controleurs: PlanningControleur[],
    typeVehicule: string,
    carburant: string,
  ): PlanningControleur[] {
    // Déterminer les agréments requis
    const agrementRequired: string[] = [];

    if (['VP', 'VL', 'VU'].includes(typeVehicule.toUpperCase())) {
      agrementRequired.push('VL');
    } else if (typeVehicule.toUpperCase() === 'L') {
      agrementRequired.push('L');
    } else if (['PL', 'TC'].includes(typeVehicule.toUpperCase())) {
      agrementRequired.push('PL');
    }

    if (['gpl', 'gnv'].includes(carburant.toLowerCase())) {
      agrementRequired.push('GAZ');
    }

    // Filtrer les contrôleurs qui ont tous les agréments requis
    return controleurs.filter((c) => {
      if (!c.agrements || c.agrements.length === 0) {
        // Si pas d'agréments définis, on considère qu'il a l'agrément VL par défaut
        return agrementRequired.every((a) => a === 'VL');
      }
      return agrementRequired.every((a) =>
        c.agrements!.map((ag) => ag.toUpperCase()).includes(a.toUpperCase()),
      );
    });
  }

  private generateTimeSlots(
    plage: PlageHoraire,
    dureeMinutes: number,
    intervalMinutes: number,
  ): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];

    let current = this.timeToMinutes(plage.ouverture);
    const end = this.timeToMinutes(plage.fermeture);
    const pauseDebut = plage.pause_debut ? this.timeToMinutes(plage.pause_debut) : null;
    const pauseFin = plage.pause_fin ? this.timeToMinutes(plage.pause_fin) : null;

    while (current + dureeMinutes <= end) {
      const slotEnd = current + dureeMinutes;

      // Vérifier si le créneau ne chevauche pas la pause
      const overlapsPause =
        pauseDebut !== null &&
        pauseFin !== null &&
        current < pauseFin &&
        slotEnd > pauseDebut;

      if (!overlapsPause) {
        slots.push({
          start: this.minutesToTime(current),
          end: this.minutesToTime(slotEnd),
        });
      }

      current += intervalMinutes;
    }

    return slots;
  }

  private isCreneauBlocked(
    start: string,
    end: string,
    controleurId: string,
    bloques: CreneauBloque[],
  ): boolean {
    return bloques.some((b) => {
      // Si le blocage concerne tous les contrôleurs ou ce contrôleur spécifique
      const appliesToControleur = !b.controleur_id || b.controleur_id === controleurId;
      if (!appliesToControleur) return false;

      // Vérifier le chevauchement
      return start < b.heure_fin && end > b.heure_debut;
    });
  }

  private isCreneauOccupied(
    start: string,
    end: string,
    controleurId: string,
    rdvs: { controleur_id: string; heure_debut: string; heure_fin: string }[],
  ): boolean {
    return rdvs.some((rdv) => {
      if (rdv.controleur_id !== controleurId) return false;
      return start < rdv.heure_fin && end > rdv.heure_debut;
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Public interface pour le controller
   */
  async getDisponibilites(params: {
    centre_id: string;
    tenant_id: string;
    date: string;
    type_controle: string;
    type_vehicule?: string;
    carburant?: string;
  }): Promise<DisponibilitesResponse> {
    return this.calculerDisponibilites(
      {
        centre_id: params.centre_id,
        date: params.date,
        type_controle: params.type_controle,
        type_vehicule: params.type_vehicule || 'VL',
        carburant: params.carburant || 'essence',
      },
      params.tenant_id,
    );
  }

  /**
   * Obtenir les dates avec au moins un créneau disponible
   */
  async getDatesDisponibles(params: {
    centre_id: string;
    tenant_id: string;
    date_debut: string;
    date_fin: string;
    type_controle: string;
    type_vehicule?: string;
    carburant?: string;
  }): Promise<string[]> {
    const dates: string[] = [];
    const startDate = new Date(params.date_debut);
    const endDate = new Date(params.date_fin);

    // Limiter à 60 jours max
    const maxDays = 60;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToCheck = Math.min(daysDiff, maxDays);

    for (let i = 0; i <= daysToCheck; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      try {
        const disponibilites = await this.calculerDisponibilites(
          {
            centre_id: params.centre_id,
            date: dateStr,
            type_controle: params.type_controle,
            type_vehicule: params.type_vehicule || 'VL',
            carburant: params.carburant || 'essence',
          },
          params.tenant_id,
        );

        if (disponibilites.nb_creneaux > 0) {
          dates.push(dateStr);
        }
      } catch {
        // Skip dates with errors
      }
    }

    return dates;
  }
}
