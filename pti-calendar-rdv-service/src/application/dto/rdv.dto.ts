import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsEmail,
  Matches,
  Min,
  Max,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  RdvStatus,
  TypeControle,
  TypeVehicule,
  Carburant,
  CanalCreation,
  ScenarioRdv,
} from '../../domain/entities/rdv.entity';

export class CreateRdvDto {
  @ApiProperty({ description: 'ID du centre' })
  @IsUUID()
  centre_id: string;

  @ApiProperty({ description: 'Date du RDV (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Heure de début (HH:mm)' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format heure invalide (HH:mm)' })
  heure_debut: string;

  @ApiProperty({ enum: TypeControle })
  @IsEnum(TypeControle)
  type_controle: TypeControle;

  @ApiProperty({ enum: TypeVehicule })
  @IsEnum(TypeVehicule)
  type_vehicule: TypeVehicule;

  @ApiProperty({ enum: Carburant })
  @IsEnum(Carburant)
  carburant: Carburant;

  @ApiPropertyOptional({ enum: ScenarioRdv, default: ScenarioRdv.CENTRE })
  @IsOptional()
  @IsEnum(ScenarioRdv)
  scenario?: ScenarioRdv;

  // Informations véhicule
  @ApiProperty({ description: 'Immatriculation du véhicule' })
  @IsString()
  @Matches(/^[A-Z]{2}-\d{3}-[A-Z]{2}$|^\d{1,4}[A-Z]{1,3}\d{2}$/, {
    message: 'Format immatriculation invalide',
  })
  immatriculation: string;

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
  @IsDateString()
  date_premiere_immatriculation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  // Informations client
  @ApiPropertyOptional({ description: 'ID client existant' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({ description: 'Nom du client' })
  @IsString()
  client_nom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_prenom?: string;

  @ApiProperty({ description: 'Téléphone du client' })
  @IsString()
  @Matches(/^(\+33|0)[1-9]\d{8}$/, { message: 'Format téléphone invalide' })
  client_telephone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  client_email?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  client_professionnel?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_societe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{14}$/, { message: 'Format SIRET invalide (14 chiffres)' })
  client_siret?: string;

  // Adresse pour scénario domicile/dépôt
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse_intervention?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d{5}$/, { message: 'Format code postal invalide' })
  code_postal_intervention?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville_intervention?: string;

  // Contrôleur
  @ApiPropertyOptional({ description: 'ID du contrôleur assigné' })
  @IsOptional()
  @IsUUID()
  controleur_id?: string;

  // Tarification
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code_promo?: string;

  // Notes
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes_client?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes_internes?: string;

  @ApiPropertyOptional({ enum: CanalCreation })
  @IsOptional()
  @IsEnum(CanalCreation)
  canal_creation?: CanalCreation;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateRdvDto extends PartialType(CreateRdvDto) {
  @ApiPropertyOptional({ enum: RdvStatus })
  @IsOptional()
  @IsEnum(RdvStatus)
  status?: RdvStatus;
}

export class ReplanifierRdvDto {
  @ApiProperty({ description: 'Nouvelle date (YYYY-MM-DD)' })
  @IsDateString()
  nouvelle_date: string;

  @ApiProperty({ description: 'Nouvelle heure de début (HH:mm)' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  nouvelle_heure: string;

  @ApiPropertyOptional({ description: 'Nouveau centre (si changement)' })
  @IsOptional()
  @IsUUID()
  nouveau_centre_id?: string;

  @ApiPropertyOptional({ description: 'Nouveau contrôleur (si changement)' })
  @IsOptional()
  @IsUUID()
  nouveau_controleur_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;
}

export class AnnulerRdvDto {
  @ApiProperty({ description: 'Motif d\'annulation' })
  @IsString()
  motif: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  demande_remboursement?: boolean;
}

export class ConfirmerRdvDto {
  @ApiPropertyOptional({ description: 'ID du contrôleur assigné' })
  @IsOptional()
  @IsUUID()
  controleur_id?: string;

  @ApiPropertyOptional({ description: 'Numéro de ligne de contrôle' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  ligne_controle?: number;
}

export class EnregistrerResultatDto {
  @ApiProperty({ description: 'Résultat du contrôle', enum: ['A', 'S', 'R'] })
  @IsString()
  resultat: 'A' | 'S' | 'R'; // Accepté, Soumis à CV, Refusé

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numero_pv?: string;

  @ApiPropertyOptional({ description: 'Date limite de contre-visite' })
  @IsOptional()
  @IsDateString()
  date_limite_cv?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaires?: string;
}

export class SearchRdvDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  centre_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_fin?: string;

  @ApiPropertyOptional({ enum: RdvStatus })
  @IsOptional()
  @IsEnum(RdvStatus)
  status?: RdvStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  immatriculation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  client_nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  controleur_id?: string;

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

export class RdvResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  centre_id: string;

  @ApiProperty()
  centre_nom: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  heure_debut: string;

  @ApiProperty()
  heure_fin: string;

  @ApiProperty()
  duree_minutes: number;

  @ApiProperty({ enum: RdvStatus })
  status: RdvStatus;

  @ApiProperty({ enum: TypeControle })
  type_controle: TypeControle;

  @ApiProperty({ enum: TypeVehicule })
  type_vehicule: TypeVehicule;

  @ApiProperty({ enum: Carburant })
  carburant: Carburant;

  @ApiProperty({ enum: ScenarioRdv })
  scenario: ScenarioRdv;

  @ApiProperty()
  immatriculation: string;

  @ApiProperty()
  marque: string;

  @ApiProperty()
  modele: string;

  @ApiProperty()
  client_id: string;

  @ApiProperty()
  client_nom: string;

  @ApiProperty()
  client_prenom: string;

  @ApiProperty()
  client_telephone: string;

  @ApiProperty()
  client_email: string;

  @ApiProperty()
  controleur_id: string;

  @ApiProperty()
  controleur_nom: string;

  @ApiProperty()
  controleur_prenom: string;

  @ApiProperty()
  prix_ttc: number;

  @ApiProperty()
  paiement_effectue: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PaginatedRdvResponseDto {
  @ApiProperty({ type: [RdvResponseDto] })
  items: RdvResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}

export class RdvStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  par_status: Record<RdvStatus, number>;

  @ApiProperty()
  par_type_controle: Record<TypeControle, number>;

  @ApiProperty()
  taux_remplissage: number;

  @ApiProperty()
  ca_total: number;

  @ApiProperty()
  ca_encaisse: number;
}
