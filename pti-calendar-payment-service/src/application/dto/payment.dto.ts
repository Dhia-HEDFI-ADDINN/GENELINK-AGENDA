import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, PaymentType, PaymentStatus } from '../../domain/entities/payment.entity';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'ID du RDV' })
  @IsUUID()
  rdv_id: string;

  @ApiPropertyOptional({ description: 'ID du client' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({ description: 'Montant en centimes' })
  @IsNumber()
  @Min(100) // 1€ minimum
  amount: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'ID du PaymentIntent Stripe' })
  @IsString()
  payment_intent_id: string;

  @ApiPropertyOptional({ description: 'ID du PaymentMethod Stripe' })
  @IsOptional()
  @IsString()
  payment_method_id?: string;
}

export class RecordCashPaymentDto {
  @ApiProperty({ description: 'ID du RDV' })
  @IsUUID()
  rdv_id: string;

  @ApiProperty({ description: 'Montant en euros' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['CASH', 'CHECK', 'TRANSFER'] })
  @IsEnum(['CASH', 'CHECK', 'TRANSFER'])
  method: 'CASH' | 'CHECK' | 'TRANSFER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RefundPaymentDto {
  @ApiPropertyOptional({ description: 'Montant à rembourser (null = remboursement total)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ description: 'Raison du remboursement' })
  @IsString()
  reason: string;
}

export class ValidatePromoCodeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsUUID()
  centre_id: string;

  @ApiProperty()
  @IsString()
  type_controle: string;

  @ApiProperty()
  @IsNumber()
  montant_initial: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;
}

export class CreateTarifDto {
  @ApiPropertyOptional({ description: 'ID du centre (null = tarif réseau)' })
  @IsOptional()
  @IsUUID()
  centre_id?: string;

  @ApiProperty()
  @IsString()
  type_controle: string;

  @ApiProperty()
  @IsString()
  type_vehicule: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carburant?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  prix_ht: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taux_tva?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;
}

export class UpdateTarifDto extends PartialType(CreateTarifDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class CreatePromoCodeDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsString()
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @ApiProperty()
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_uses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_uses_per_client?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  applicable_centres?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  applicable_type_controle?: string[];
}

export class SearchPaymentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  centre_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  client_secret: string;

  @ApiProperty()
  payment_intent_id: string;

  @ApiProperty()
  payment_id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rdv_id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty()
  card_brand: string;

  @ApiProperty()
  card_last4: string;

  @ApiProperty()
  receipt_url: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  paid_at: Date;
}

export class TarifResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type_controle: string;

  @ApiProperty()
  type_vehicule: string;

  @ApiProperty()
  carburant: string;

  @ApiProperty()
  prix_ht: number;

  @ApiProperty()
  taux_tva: number;

  @ApiProperty()
  prix_ttc: number;

  @ApiProperty()
  actif: boolean;
}

export class PromoCodeValidationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  code: string;

  @ApiProperty()
  discount_type: string;

  @ApiProperty()
  discount_value: number;

  @ApiProperty()
  discount_amount: number;

  @ApiProperty()
  final_amount: number;

  @ApiPropertyOptional()
  error_message?: string;
}

export class PaymentStatsDto {
  @ApiProperty()
  total_payments: number;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  total_refunded: number;

  @ApiProperty()
  net_revenue: number;

  @ApiProperty()
  by_status: Record<PaymentStatus, number>;

  @ApiProperty()
  by_method: Record<PaymentMethod, number>;
}
