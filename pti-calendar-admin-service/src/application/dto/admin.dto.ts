import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  Matches,
} from 'class-validator';
import { TenantType, TenantStatus } from '../../domain/entities/tenant.entity';

// ===== TENANT DTOs =====

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiProperty({ enum: TenantType })
  @IsEnum(TenantType)
  type: TenantType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{5}$/)
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{14}$/)
  siret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscription_plan?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

// ===== CENTRE DTOs =====

export class CreateCentreDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agrement_number?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_complement?: string;

  @ApiProperty()
  @Matches(/^\d{5}$/)
  postal_code: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  nb_lignes?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  types_vehicules?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  carburants_autorises?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  horaires_defaut?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{14}$/)
  siret?: string;
}

export class UpdateCentreDto extends PartialType(CreateCentreDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

// ===== CONTROLEUR DTOs =====

export class CreateControleurDto {
  @ApiProperty()
  @IsUUID()
  centre_id: string;

  @ApiProperty()
  @IsString()
  matricule: string;

  @ApiProperty()
  @IsString()
  nom: string;

  @ApiProperty()
  @IsString()
  prenom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  initiales?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty()
  @IsString()
  numero_agrement: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_agrement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_expiration_agrement?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  agrements?: string[];

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacite_journaliere?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  disponibilites?: Record<string, boolean>;
}

export class UpdateControleurDto extends PartialType(CreateControleurDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

// ===== SEARCH DTOs =====

export class SearchTenantsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: TenantType })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

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

export class SearchCentresDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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

// ===== RESPONSE DTOs =====

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TenantType })
  type: TenantType;

  @ApiProperty({ enum: TenantStatus })
  status: TenantStatus;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  centres_count: number;

  @ApiProperty()
  created_at: Date;
}

export class CentreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  postal_code: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  nb_lignes: number;

  @ApiProperty()
  nb_controleurs: number;

  @ApiProperty()
  created_at: Date;
}

export class ControleurResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matricule: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  prenom: string;

  @ApiProperty()
  initiales: string;

  @ApiProperty()
  numero_agrement: string;

  @ApiProperty({ type: [String] })
  agrements: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;
}
