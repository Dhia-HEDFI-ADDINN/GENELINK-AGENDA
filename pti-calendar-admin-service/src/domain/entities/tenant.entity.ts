import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum TenantType {
  RESEAU = 'RESEAU', // Réseau de centres (ex: Autovision, Dekra)
  INDEPENDANT = 'INDEPENDANT', // Centre indépendant
  GROUPE = 'GROUPE', // Groupe SGS France (niveau racine)
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

@Entity('tenants')
@Index(['code'], { unique: true })
@Index(['parent_id'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // Code unique du tenant (ex: 'autovision', 'dekra')

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legal_name: string; // Raison sociale

  @Column({ type: 'enum', enum: TenantType })
  type: TenantType;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  // Hiérarchie (SGS -> Réseau -> Agence optionnel)
  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  // Contact
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postal_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  // Identifiants légaux
  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  siren: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  tva_number: string;

  // Configuration
  @Column({ type: 'jsonb', nullable: true })
  config: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    default_timezone?: string;
    default_locale?: string;
    features_enabled?: string[];
    max_centres?: number;
    max_users?: number;
  };

  // Abonnement
  @Column({ type: 'varchar', length: 50, nullable: true })
  subscription_plan: string;

  @Column({ type: 'date', nullable: true })
  subscription_start: string;

  @Column({ type: 'date', nullable: true })
  subscription_end: string;

  @Column({ type: 'boolean', default: false })
  is_trial: boolean;

  @Column({ type: 'date', nullable: true })
  trial_end: string;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @OneToMany(() => Centre, (centre) => centre.tenant)
  centres: Centre[];
}

@Entity('centres')
@Index(['tenant_id', 'code'])
@Index(['tenant_id', 'status'])
@Index(['agrement_number'])
export class Centre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string; // Code interne

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legal_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  agrement_number: string; // Numéro d'agrément préfectoral

  @Column({ type: 'date', nullable: true })
  agrement_date: string;

  @Column({ type: 'date', nullable: true })
  agrement_expiry: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string; // ACTIVE, INACTIVE, PENDING, SUSPENDED

  // Adresse
  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address_complement: string;

  @Column({ type: 'varchar', length: 10 })
  postal_code: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Contact
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  // Capacité
  @Column({ type: 'int', default: 1 })
  nb_lignes: number;

  @Column({ type: 'int', default: 0 })
  nb_controleurs: number;

  @Column({ type: 'simple-array', nullable: true })
  types_vehicules: string[]; // ['VP', 'VL', 'PL', 'L']

  @Column({ type: 'simple-array', nullable: true })
  carburants_autorises: string[]; // ['essence', 'diesel', 'gpl', 'electrique']

  // Horaires par défaut (JSON)
  @Column({ type: 'jsonb', nullable: true })
  horaires_defaut: {
    lundi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    mardi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    mercredi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    jeudi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    vendredi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    samedi?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
    dimanche?: { ouverture: string; fermeture: string; pause_debut?: string; pause_fin?: string };
  };

  // Configuration spécifique
  @Column({ type: 'jsonb', nullable: true })
  config: {
    rdv_interval_minutes?: number;
    rdv_min_delay_hours?: number;
    rdv_max_advance_days?: number;
    accept_online_payment?: boolean;
    accept_cash_payment?: boolean;
    require_prepayment?: boolean;
    allow_depot_scenario?: boolean;
    allow_domicile_scenario?: boolean;
    notification_email?: string;
    notification_sms?: string;
  };

  // Identifiants légaux
  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  code_ape: string;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  tenant: Tenant;
}

@Entity('controleurs')
@Index(['tenant_id', 'centre_id'])
@Index(['numero_agrement'])
export class Controleur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  centre_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string; // Lien vers User Service

  @Column({ type: 'varchar', length: 10 })
  matricule: string;

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 100 })
  prenom: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  initiales: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone: string;

  @Column({ type: 'varchar', length: 20 })
  numero_agrement: string;

  @Column({ type: 'date', nullable: true })
  date_agrement: string;

  @Column({ type: 'date', nullable: true })
  date_expiration_agrement: string;

  @Column({ type: 'simple-array', nullable: true })
  agrements: string[]; // ['VL', 'PL', 'L', 'GAZ']

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string; // ACTIVE, INACTIVE, SUSPENDED

  @Column({ type: 'int', default: 100 })
  capacite_journaliere: number; // Nombre max de contrôles par jour

  @Column({ type: 'varchar', length: 50, nullable: true })
  couleur: string; // Pour l'affichage planning

  @Column({ type: 'jsonb', nullable: true })
  disponibilites: {
    lundi?: boolean;
    mardi?: boolean;
    mercredi?: boolean;
    jeudi?: boolean;
    vendredi?: boolean;
    samedi?: boolean;
    dimanche?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
