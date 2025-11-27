import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEmail,
  Matches,
  Min,
  Max,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateClientDto {
  @ApiPropertyOptional({ default: 'M.' })
  @IsOptional()
  @IsString()
  civilite?: string;

  @ApiProperty()
  @IsString()
  nom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(\+33|0)[1-9]\d{8}$/, { message: 'Format téléphone invalide' })
  telephone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^(\+33|0)[1-9]\d{8}$/, { message: 'Format téléphone invalide' })
  telephone_secondaire?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  professionnel?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  societe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'Format SIRET invalide' })
  siret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tva_intracommunautaire?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement_adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Format code postal invalide' })
  code_postal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ default: 'FR' })
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  opt_in_email?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  opt_in_sms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  centre_favori_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class SearchClientDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string; // Recherche full-text

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  professionnel?: boolean;

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

export class CreateVehiculeDto {
  @ApiProperty()
  @IsUUID()
  client_id: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$|^\d{1,4}[A-Z]{1,3}\d{2}$/, {
    message: 'Format immatriculation invalide',
  })
  immatriculation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marque?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modele?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ enum: ['VP', 'VL', 'VU', 'L', 'PL', 'TC', 'CARAVANE', 'REMORQUE'] })
  @IsString()
  type_vehicule: string;

  @ApiProperty({ enum: ['essence', 'diesel', 'gpl', 'gnv', 'hybride', 'electrique', 'hydrogene'] })
  @IsString()
  carburant: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_premiere_immatriculation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_mise_circulation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrosserie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  puissance_fiscale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  puissance_din?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nb_places?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ptac?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateVehiculeDto extends PartialType(CreateVehiculeDto) {}

export class ClientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  civilite: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  prenom: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  telephone: string;

  @ApiProperty()
  professionnel: boolean;

  @ApiProperty()
  societe: string;

  @ApiProperty()
  siret: string;

  @ApiProperty()
  adresse: string;

  @ApiProperty()
  code_postal: string;

  @ApiProperty()
  ville: string;

  @ApiProperty()
  nb_rdv_total: number;

  @ApiProperty()
  dernier_rdv: string;

  @ApiProperty()
  created_at: Date;
}

export class VehiculeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  client_id: string;

  @ApiProperty()
  immatriculation: string;

  @ApiProperty()
  vin: string;

  @ApiProperty()
  marque: string;

  @ApiProperty()
  modele: string;

  @ApiProperty()
  type_vehicule: string;

  @ApiProperty()
  carburant: string;

  @ApiProperty()
  date_premiere_immatriculation: string;

  @ApiProperty()
  date_dernier_ct: string;

  @ApiProperty()
  resultat_dernier_ct: string;

  @ApiProperty()
  date_prochain_ct: string;
}

export class PaginatedClientResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  items: ClientResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
