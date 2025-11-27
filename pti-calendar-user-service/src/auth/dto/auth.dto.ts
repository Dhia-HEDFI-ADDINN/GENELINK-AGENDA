import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(1, { message: 'Mot de passe requis' })
  password: string;

  @ApiPropertyOptional({ example: 'uuid-tenant-id' })
  @IsOptional()
  @IsUUID('4', { message: 'tenant_id doit être un UUID valide' })
  tenant_id?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' })
  @MaxLength(128, { message: 'Le mot de passe ne peut pas dépasser 128 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  password: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  @MinLength(1, { message: 'Nom requis' })
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  @MinLength(1, { message: 'Prénom requis' })
  @MaxLength(100)
  prenom: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  @Matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, {
    message: 'Numéro de téléphone français invalide',
  })
  telephone?: string;

  @ApiProperty({ example: 'uuid-tenant-id' })
  @IsUUID('4', { message: 'tenant_id doit être un UUID valide' })
  tenant_id: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Refresh token requis' })
  refresh_token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  token: string;

  @ApiProperty({ example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  new_password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Mot de passe actuel requis' })
  current_password: string;

  @ApiProperty()
  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères' })
  @Matches(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
  @Matches(/[a-z]/, { message: 'Le mot de passe doit contenir au moins une minuscule' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Le mot de passe doit contenir au moins un caractère spécial' })
  new_password: string;
}

// Response DTOs
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nom: string;

  @ApiProperty()
  prenom: string;

  @ApiProperty()
  roles: string[];

  @ApiProperty()
  permissions: string[];

  @ApiProperty()
  tenant_id: string;

  @ApiProperty()
  centre_ids: string[];
}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty()
  expires_in: number;

  @ApiProperty()
  token_type: string;

  @ApiProperty()
  user: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  success: boolean;
}
