import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  SEPA_DEBIT = 'SEPA_DEBIT',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  CASH = 'CASH',
  CHECK = 'CHECK',
  TRANSFER = 'TRANSFER',
}

export enum PaymentType {
  RDV = 'RDV',
  SUBSCRIPTION = 'SUBSCRIPTION',
  DEPOSIT = 'DEPOSIT',
  PENALTY = 'PENALTY',
}

@Entity('payments')
@Index(['tenant_id', 'rdv_id'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'created_at'])
@Index(['stripe_payment_intent_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  rdv_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string;

  @Column({ type: 'uuid' })
  centre_id: string;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.RDV })
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  method: PaymentMethod;

  // Montants
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'EUR' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount_refunded: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number; // Commission Stripe

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  net_amount: number; // Montant net après frais

  // TVA
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20.0 })
  taux_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant_ht: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montant_tva: number;

  // Stripe
  @Column({ type: 'varchar', length: 100, nullable: true })
  stripe_payment_intent_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripe_charge_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripe_customer_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stripe_payment_method_id: string;

  // Détails carte
  @Column({ type: 'varchar', length: 20, nullable: true })
  card_brand: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  card_last4: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  card_exp: string; // MM/YYYY

  // Facturation
  @Column({ type: 'varchar', length: 50, nullable: true })
  invoice_number: string;

  @Column({ type: 'boolean', default: false })
  invoice_generated: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  invoice_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receipt_url: string;

  // Remboursement
  @Column({ type: 'varchar', length: 100, nullable: true })
  stripe_refund_id: string;

  @Column({ type: 'text', nullable: true })
  refund_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date;

  // Erreurs
  @Column({ type: 'varchar', length: 50, nullable: true })
  error_code: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  // Métadonnées
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;
}

@Entity('tarifs')
@Index(['tenant_id', 'centre_id'])
@Index(['tenant_id', 'type_controle', 'type_vehicule'])
export class Tarif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  centre_id: string; // null = tarif par défaut du réseau

  @Column({ type: 'varchar', length: 10 })
  type_controle: string; // CTP, CVP, CV, etc.

  @Column({ type: 'varchar', length: 10 })
  type_vehicule: string; // VP, VL, VU, L, PL

  @Column({ type: 'varchar', length: 20, nullable: true })
  carburant: string; // null = tous carburants

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix_ht: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20.0 })
  taux_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix_ttc: number;

  @Column({ type: 'date', nullable: true })
  date_debut: string;

  @Column({ type: 'date', nullable: true })
  date_fin: string;

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('promo_codes')
@Index(['tenant_id', 'code'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // PERCENTAGE, FIXED_AMOUNT

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_discount: number;

  @Column({ type: 'date', nullable: true })
  valid_from: string;

  @Column({ type: 'date', nullable: true })
  valid_until: string;

  @Column({ type: 'int', nullable: true })
  max_uses: number;

  @Column({ type: 'int', default: 0 })
  current_uses: number;

  @Column({ type: 'int', nullable: true })
  max_uses_per_client: number;

  @Column({ type: 'simple-array', nullable: true })
  applicable_centres: string[];

  @Column({ type: 'simple-array', nullable: true })
  applicable_type_controle: string[];

  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
