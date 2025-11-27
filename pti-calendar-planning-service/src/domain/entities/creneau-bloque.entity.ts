import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Planning } from './planning.entity';

export enum BlockMotif {
  PAUSE = 'pause',
  ABSENCE = 'absence',
  CONGES = 'conges',
  FORMATION = 'formation',
  MAINTENANCE = 'maintenance',
  FERMETURE = 'fermeture',
  REUNION = 'reunion',
  AUTRE = 'autre',
}

@Entity('creneaux_bloques')
@Index(['tenant_id', 'centre_id', 'date'])
export class CreneauBloque {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  @Index()
  centre_id: string;

  @Column({ type: 'uuid', nullable: true })
  controleur_id: string;

  @Column({ type: 'uuid', nullable: true })
  planning_id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 5 })
  heure_debut: string;

  @Column({ type: 'varchar', length: 5 })
  heure_fin: string;

  @Column({
    type: 'enum',
    enum: BlockMotif,
    default: BlockMotif.AUTRE,
  })
  motif: BlockMotif;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  recurrent: boolean;

  @Column({ type: 'jsonb', nullable: true })
  recurrence_pattern: RecurrencePattern;

  @ManyToOne(() => Planning, (planning) => planning.creneaux_bloques)
  @JoinColumn({ name: 'planning_id' })
  planning: Planning;

  @CreateDateColumn()
  created_at: Date;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[]; // 0=Sunday, 6=Saturday
  end_date?: string;
}
