import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsEmail,
  Matches,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

export class SendSmsDto {
  @ApiProperty()
  @IsString()
  @Matches(/^(\+33|0)[1-9]\d{8}$/)
  phone: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rdv_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ description: 'Date/heure d\'envoi planifié' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendEmailDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html_content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipient_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rdv_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendPushDto {
  @ApiProperty()
  @IsUUID()
  client_id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rdv_id?: string;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SendTemplatedNotificationDto {
  @ApiProperty()
  @IsString()
  template_code: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({ description: 'Variables pour le template' })
  template_data: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rdv_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  centre_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ enum: NotificationCategory })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_template?: string;

  @ApiProperty()
  @IsString()
  content_template: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  html_template?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  available_variables?: string[];

  @ApiPropertyOptional({ default: 'fr' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class RegisterPushSubscriptionDto {
  @ApiProperty()
  @IsString()
  endpoint: string;

  @ApiProperty()
  @IsString()
  p256dh: string;

  @ApiProperty()
  @IsString()
  auth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  device_type?: string;
}

export class SearchNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rdv_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

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

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationCategory })
  category: NotificationCategory;

  @ApiProperty({ enum: NotificationStatus })
  status: NotificationStatus;

  @ApiProperty()
  recipient_phone: string;

  @ApiProperty()
  recipient_email: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  sent_at: Date;

  @ApiProperty()
  delivered_at: Date;

  @ApiProperty()
  created_at: Date;
}

export class NotificationStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  by_type: Record<NotificationType, number>;

  @ApiProperty()
  by_status: Record<NotificationStatus, number>;

  @ApiProperty()
  by_category: Record<NotificationCategory, number>;

  @ApiProperty()
  delivery_rate: number;

  @ApiProperty()
  total_cost: number;
}
