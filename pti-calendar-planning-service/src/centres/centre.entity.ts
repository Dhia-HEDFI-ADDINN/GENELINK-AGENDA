import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface Adresse {
  rue: string;
  complement?: string;
  code_postal: string;
  ville: string;
  pays: string;
}

export interface Contact {
  telephone: string;
  email: string;
  fax?: string;
  site_web?: string;
}

export interface PlageHoraire {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
  ferme: boolean;
}

export interface Horaires {
  lundi?: PlageHoraire;
  mardi?: PlageHoraire;
  mercredi?: PlageHoraire;
  jeudi?: PlageHoraire;
  vendredi?: PlageHoraire;
  samedi?: PlageHoraire;
  dimanche?: PlageHoraire;
}

export interface Coordonnees {
  latitude: number;
  longitude: number;
}

export type CentreStatus = 'active' | 'inactive' | 'maintenance' | 'closed';

@Entity('centres')
@Index(['tenant_id', 'code'], { unique: true })
export class Centre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  reseau_id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  nom: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: CentreStatus;

  @Column({ type: 'jsonb' })
  adresse: Adresse;

  @Column({ type: 'jsonb' })
  contact: Contact;

  @Column({ type: 'jsonb' })
  horaires: Horaires;

  @Column({ type: 'jsonb' })
  coordonnees: Coordonnees;

  @Column({ type: 'varchar', array: true, default: '{}' })
  agrements: string[];

  @Column({ type: 'int', default: 30 })
  capacite_journaliere: number;

  @Column({ type: 'int', default: 2 })
  nb_lignes: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Computed property for distance (set at query time)
  distance?: number;

  // Computed property for next availability
  prochaine_disponibilite?: string;

  // Helper method
  getFullAddress(): string {
    const { rue, complement, code_postal, ville } = this.adresse;
    return [rue, complement, `${code_postal} ${ville}`].filter(Boolean).join(', ');
  }

  isOpenOnDay(day: keyof Horaires): boolean {
    const horaire = this.horaires[day];
    return horaire ? !horaire.ferme : false;
  }

  getOpeningHours(day: keyof Horaires): { open: string; close: string } | null {
    const horaire = this.horaires[day];
    if (!horaire || horaire.ferme) return null;
    return { open: horaire.ouverture, close: horaire.fermeture };
  }
}
