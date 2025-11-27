import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationCategory {
  RDV_CONFIRMATION = 'RDV_CONFIRMATION',
  RDV_RAPPEL_24H = 'RDV_RAPPEL_24H',
  RDV_RAPPEL_2H = 'RDV_RAPPEL_2H',
  RDV_ANNULATION = 'RDV_ANNULATION',
  RDV_MODIFICATION = 'RDV_MODIFICATION',
  CONTROLE_TERMINE = 'CONTROLE_TERMINE',
  CONTRE_VISITE_RAPPEL = 'CONTRE_VISITE_RAPPEL',
  PAIEMENT_CONFIRMATION = 'PAIEMENT_CONFIRMATION',
  PAIEMENT_ECHEC = 'PAIEMENT_ECHEC',
  CAMPAGNE_MARKETING = 'CAMPAGNE_MARKETING',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'category'])
@Index(['tenant_id', 'scheduled_at'])
@Index(['rdv_id'])
@Index(['recipient_phone'])
@Index(['recipient_email'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  rdv_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'uuid', nullable: true })
  centre_id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationCategory })
  category: NotificationCategory;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  // Destinataire
  @Column({ type: 'varchar', length: 20, nullable: true })
  recipient_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient_email: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  recipient_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  push_subscription_endpoint: string;

  // Contenu
  @Column({ type: 'varchar', length: 255, nullable: true })
  subject: string; // Pour les emails

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  html_content: string; // Pour les emails HTML

  @Column({ type: 'varchar', length: 50, nullable: true })
  template_id: string;

  @Column({ type: 'jsonb', nullable: true })
  template_data: Record<string, any>;

  // Planification
  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  // Provider info
  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string; // twilio, sendgrid, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_message_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost: number;

  // Erreurs
  @Column({ type: 'varchar', length: 50, nullable: true })
  error_code: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'int', default: 3 })
  max_retries: number;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('notification_templates')
@Index(['tenant_id', 'code'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationCategory })
  category: NotificationCategory;

  // Contenu du template (Handlebars)
  @Column({ type: 'varchar', length: 255, nullable: true })
  subject_template: string;

  @Column({ type: 'text' })
  content_template: string;

  @Column({ type: 'text', nullable: true })
  html_template: string;

  // Variables disponibles
  @Column({ type: 'simple-array', nullable: true })
  available_variables: string[];

  @Column({ type: 'varchar', length: 2, default: 'fr' })
  language: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('push_subscriptions')
@Index(['tenant_id', 'client_id'])
@Index(['tenant_id', 'user_id'])
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'varchar', length: 500 })
  p256dh: string;

  @Column({ type: 'varchar', length: 500 })
  auth: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  device_type: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date;
}
