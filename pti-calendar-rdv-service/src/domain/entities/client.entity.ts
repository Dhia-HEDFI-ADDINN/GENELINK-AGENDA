import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

@Entity('clients')
@Index(['tenant_id', 'email'])
@Index(['tenant_id', 'telephone'])
@Index(['tenant_id', 'siret'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 10 })
  civilite: string; // M., Mme, Mlle

  @Column({ type: 'varchar', length: 100 })
  nom: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  prenom: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  telephone: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone_secondaire: string;

  @Column({ type: 'boolean', default: false })
  professionnel: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  societe: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  tva_intracommunautaire: string;

  // Adresse
  @Column({ type: 'text', nullable: true })
  adresse: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  complement_adresse: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code_postal: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville: string;

  @Column({ type: 'varchar', length: 2, default: 'FR' })
  pays: string;

  // Préférences
  @Column({ type: 'boolean', default: true })
  opt_in_email: boolean;

  @Column({ type: 'boolean', default: true })
  opt_in_sms: boolean;

  @Column({ type: 'varchar', length: 2, default: 'fr' })
  langue: string;

  @Column({ type: 'uuid', nullable: true })
  centre_favori_id: string;

  // Fidélité
  @Column({ type: 'int', default: 0 })
  nb_rdv_total: number;

  @Column({ type: 'int', default: 0 })
  nb_no_show: number;

  @Column({ type: 'date', nullable: true })
  dernier_rdv: string;

  @Column({ type: 'int', default: 0 })
  points_fidelite: number;

  // Compte utilisateur lié
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // WEB, IMPORT, API, etc.

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @OneToMany(() => Vehicule, (vehicule) => vehicule.client)
  vehicules: Vehicule[];
}

@Entity('vehicules')
@Index(['tenant_id', 'client_id'])
@Index(['tenant_id', 'immatriculation'])
@Index(['tenant_id', 'vin'])
export class Vehicule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'varchar', length: 20 })
  immatriculation: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vin: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modele: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  version: string;

  @Column({ type: 'varchar', length: 10 })
  type_vehicule: string; // VP, VL, VU, L, PL, TC

  @Column({ type: 'varchar', length: 20 })
  carburant: string;

  @Column({ type: 'date', nullable: true })
  date_premiere_immatriculation: string;

  @Column({ type: 'date', nullable: true })
  date_mise_circulation: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cnit: string; // Code National d'Identification du Type

  @Column({ type: 'varchar', length: 10, nullable: true })
  genre: string; // VP, CTTE, etc.

  @Column({ type: 'varchar', length: 10, nullable: true })
  carrosserie: string;

  @Column({ type: 'int', nullable: true })
  puissance_fiscale: number;

  @Column({ type: 'int', nullable: true })
  puissance_din: number;

  @Column({ type: 'int', nullable: true })
  nb_places: number;

  @Column({ type: 'int', nullable: true })
  ptac: number; // Poids Total Autorisé en Charge

  @Column({ type: 'int', nullable: true })
  ptra: number; // Poids Total Roulant Autorisé

  @Column({ type: 'varchar', length: 10, nullable: true })
  couleur: string;

  // Dernier contrôle technique
  @Column({ type: 'date', nullable: true })
  date_dernier_ct: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  resultat_dernier_ct: string;

  @Column({ type: 'date', nullable: true })
  date_prochain_ct: string;

  @Column({ type: 'int', nullable: true })
  kilometrage_dernier_ct: number;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  client: Client;
}
