import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CreneauBloque } from './creneau-bloque.entity';

@Entity('plannings')
@Index(['tenant_id', 'centre_id', 'date'], { unique: true })
export class Planning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  @Index()
  centre_id: string;

  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'jsonb', default: '[]' })
  controleurs: PlanningControleur[];

  @Column({ type: 'boolean', default: false })
  jour_ferie: boolean;

  @Column({ type: 'boolean', default: false })
  ferme: boolean;

  @Column({ type: 'text', nullable: true })
  commentaire: string;

  @OneToMany(() => CreneauBloque, (creneau) => creneau.planning)
  creneaux_bloques: CreneauBloque[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export interface PlanningControleur {
  controleur_id: string;
  controleur_nom?: string;
  controleur_prenom?: string;
  initiales?: string;
  plages: PlageHoraire[];
  agrements?: string[];
}

export interface PlageHoraire {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
}
