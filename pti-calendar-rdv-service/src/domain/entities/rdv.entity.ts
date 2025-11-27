import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum RdvStatus {
  CREE = 'CREE',
  CONFIRME = 'CONFIRME',
  RAPPELE = 'RAPPELE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  NO_SHOW = 'NO_SHOW',
  REPORTE = 'REPORTE',
}

export enum TypeControle {
  CTP = 'CTP', // Contrôle Technique Périodique
  CVP = 'CVP', // Contre-Visite Périodique
  CV = 'CV', // Contre-Visite
  CTC = 'CTC', // Contrôle Technique Complémentaire
  CTG = 'CTG', // Contrôle Technique GPL
  CVI = 'CVI', // Contrôle Volontaire Initial
  CVV = 'CVV', // Contre-Visite Volontaire
}

export enum TypeVehicule {
  VP = 'VP', // Véhicule Particulier
  VL = 'VL', // Véhicule Léger
  VU = 'VU', // Véhicule Utilitaire
  L = 'L', // Motocyclette/Quadricycle
  PL = 'PL', // Poids Lourd
  TC = 'TC', // Transport en Commun
  CARAVANE = 'CARAVANE',
  REMORQUE = 'REMORQUE',
}

export enum Carburant {
  ESSENCE = 'essence',
  DIESEL = 'diesel',
  GPL = 'gpl',
  GNV = 'gnv',
  HYBRIDE = 'hybride',
  ELECTRIQUE = 'electrique',
  HYDROGENE = 'hydrogene',
}

export enum CanalCreation {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  CALL_CENTER = 'CALL_CENTER',
  SUR_PLACE = 'SUR_PLACE',
  API = 'API',
  IMPORT = 'IMPORT',
}

export enum ScenarioRdv {
  CENTRE = 'CENTRE',
  DEPOT = 'DEPOT',
  DOMICILE = 'DOMICILE',
}

@Entity('rdv')
@Index(['tenant_id', 'centre_id', 'date'])
@Index(['tenant_id', 'client_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'immatriculation'])
@Index(['controleur_id', 'date'])
export class Rdv {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid' })
  centre_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  centre_nom: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  heure_debut: string;

  @Column({ type: 'time' })
  heure_fin: string;

  @Column({ type: 'int' })
  duree_minutes: number;

  @Column({ type: 'enum', enum: RdvStatus, default: RdvStatus.CREE })
  status: RdvStatus;

  @Column({ type: 'enum', enum: TypeControle })
  type_controle: TypeControle;

  @Column({ type: 'enum', enum: TypeVehicule })
  type_vehicule: TypeVehicule;

  @Column({ type: 'enum', enum: Carburant })
  carburant: Carburant;

  @Column({ type: 'enum', enum: ScenarioRdv, default: ScenarioRdv.CENTRE })
  scenario: ScenarioRdv;

  // Informations véhicule
  @Column({ type: 'varchar', length: 20 })
  immatriculation: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modele: string;

  @Column({ type: 'date', nullable: true })
  date_premiere_immatriculation: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vin: string;

  // Informations client
  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'varchar', length: 100 })
  client_nom: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_prenom: string;

  @Column({ type: 'varchar', length: 20 })
  client_telephone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_email: string;

  @Column({ type: 'boolean', default: false })
  client_professionnel: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  client_societe: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  client_siret: string;

  // Adresse pour scénario domicile/dépôt
  @Column({ type: 'text', nullable: true })
  adresse_intervention: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code_postal_intervention: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville_intervention: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Contrôleur assigné
  @Column({ type: 'uuid', nullable: true })
  controleur_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  controleur_nom: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  controleur_prenom: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  controleur_initiales: string;

  // Ligne de contrôle assignée
  @Column({ type: 'int', nullable: true })
  ligne_controle: number;

  // Tarification
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prix_ht: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20.0 })
  taux_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prix_ttc: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code_promo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remise: number;

  // Paiement
  @Column({ type: 'boolean', default: false })
  paiement_effectue: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paiement_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mode_paiement: string;

  @Column({ type: 'timestamp', nullable: true })
  date_paiement: Date;

  // Rappels
  @Column({ type: 'boolean', default: false })
  rappel_24h_envoye: boolean;

  @Column({ type: 'boolean', default: false })
  rappel_2h_envoye: boolean;

  @Column({ type: 'boolean', default: false })
  confirmation_envoyee: boolean;

  // Canal de création
  @Column({ type: 'enum', enum: CanalCreation, default: CanalCreation.WEB })
  canal_creation: CanalCreation;

  @Column({ type: 'uuid', nullable: true })
  cree_par: string;

  // Notes et commentaires
  @Column({ type: 'text', nullable: true })
  notes_client: string;

  @Column({ type: 'text', nullable: true })
  notes_internes: string;

  // Résultat du contrôle
  @Column({ type: 'varchar', length: 20, nullable: true })
  resultat_controle: string; // A, S, R (Accepté, Soumis à CV, Refusé)

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_pv: string;

  @Column({ type: 'timestamp', nullable: true })
  date_controle_effectif: Date;

  // Contre-visite liée
  @Column({ type: 'uuid', nullable: true })
  rdv_origine_id: string; // Pour les CV, référence au RDV initial

  @Column({ type: 'date', nullable: true })
  date_limite_cv: string; // Date limite pour la contre-visite

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @OneToMany(() => RdvHistory, (history) => history.rdv)
  historique: RdvHistory[];
}

@Entity('rdv_history')
@Index(['rdv_id'])
@Index(['tenant_id', 'created_at'])
export class RdvHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid' })
  rdv_id: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'enum', enum: RdvStatus, nullable: true })
  ancien_status: RdvStatus;

  @Column({ type: 'enum', enum: RdvStatus, nullable: true })
  nouveau_status: RdvStatus;

  @Column({ type: 'jsonb', nullable: true })
  modifications: Record<string, { ancien: any; nouveau: any }>;

  @Column({ type: 'uuid', nullable: true })
  utilisateur_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  utilisateur_nom: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  canal: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  commentaire: string;

  @CreateDateColumn()
  created_at: Date;

  rdv: Rdv;
}
