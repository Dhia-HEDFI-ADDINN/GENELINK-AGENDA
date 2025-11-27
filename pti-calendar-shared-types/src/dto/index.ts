import { TypeControle, TypeVehicule, Carburant, RdvStatus, PaymentMethod, UserRole, TenantStatus, CreneauBlockType, AgrementType } from '../enums';

// =============================================
// Auth DTOs
// =============================================

export interface LoginDto {
  email: string;
  password: string;
  tenant_id?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  tenant_id: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  new_password: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export interface AuthResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: UserRole[];
  permissions: string[];
  tenant_id: string;
  centre_ids: string[];
}

// =============================================
// RDV DTOs
// =============================================

export interface CreateRdvDto {
  centre_id: string;
  date_rdv: string;
  heure_debut: string;
  type_controle: TypeControle;
  client: CreateClientDto | { client_id: string };
  vehicule: CreateVehiculeDto | { vehicule_id: string };
  controleur_id?: string;
  notes?: string;
  source?: string;
}

export interface UpdateRdvDto {
  date_rdv?: string;
  heure_debut?: string;
  controleur_id?: string;
  notes?: string;
  status?: RdvStatus;
}

export interface RdvResponseDto {
  id: string;
  reference: string;
  centre_id: string;
  centre_nom: string;
  date_rdv: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  type_controle: TypeControle;
  status: RdvStatus;
  montant_ttc: number;
  client: ClientResponseDto;
  vehicule: VehiculeResponseDto;
  controleur?: ControleurResponseDto;
  qr_code?: string;
  created_at: string;
}

export interface SearchRdvDto {
  centre_id?: string;
  date_debut?: string;
  date_fin?: string;
  status?: RdvStatus;
  client_id?: string;
  controleur_id?: string;
  immatriculation?: string;
  reference?: string;
  page?: number;
  limit?: number;
}

// =============================================
// Client DTOs
// =============================================

export interface CreateClientDto {
  type: 'particulier' | 'professionnel';
  civilite?: string;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  siret?: string;
  email?: string;
  telephone: string;
  adresse?: AddressDto;
}

export interface UpdateClientDto {
  civilite?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: AddressDto;
}

export interface ClientResponseDto {
  id: string;
  type: string;
  civilite?: string;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  email?: string;
  telephone: string;
}

export interface AddressDto {
  rue: string;
  complement?: string;
  code_postal: string;
  ville: string;
  pays?: string;
}

// =============================================
// Vehicule DTOs
// =============================================

export interface CreateVehiculeDto {
  immatriculation: string;
  type: TypeVehicule;
  marque: string;
  modele?: string;
  carburant: Carburant;
  date_premiere_immatriculation?: string;
}

export interface UpdateVehiculeDto {
  marque?: string;
  modele?: string;
  carburant?: Carburant;
}

export interface VehiculeResponseDto {
  id: string;
  immatriculation: string;
  type: TypeVehicule;
  marque: string;
  modele?: string;
  carburant: Carburant;
}

// =============================================
// Planning DTOs
// =============================================

export interface GetDisponibilitesDto {
  centre_id: string;
  date: string;
  type_controle: TypeControle;
  type_vehicule: TypeVehicule;
  carburant: Carburant;
}

export interface DisponibilitesResponseDto {
  centre: CentreInfoDto;
  date: string;
  type_controle: TypeControle;
  duree_controle: number;
  nb_creneaux: number;
  creneaux: CreneauResponseDto[];
  cache_info?: CacheInfoDto;
}

export interface CreneauResponseDto {
  id?: string;
  controleur?: ControleurResponseDto;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  duree_minutes: number;
  type: 'standard' | 'depot_vehicule';
  disponible: boolean;
  charge_prevue?: 'faible' | 'moyenne' | 'forte';
  temps_attente_estime?: number;
}

export interface CentreInfoDto {
  id: string;
  code: string;
  nom: string;
  adresse: AddressDto;
}

export interface CacheInfoDto {
  hit: boolean;
  ttl_remaining: number;
}

export interface CreatePlanningDto {
  centre_id: string;
  date: string;
  controleurs: PlanningControleurDto[];
}

export interface PlanningControleurDto {
  controleur_id: string;
  plages: PlageHoraireDto[];
}

export interface PlageHoraireDto {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
}

export interface BlockCreneauDto {
  centre_id: string;
  controleur_id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: CreneauBlockType;
  description?: string;
  recurrent?: boolean;
}

// =============================================
// Payment DTOs
// =============================================

export interface CreatePaymentDto {
  rdv_id: string;
  method: PaymentMethod;
  return_url?: string;
  cancel_url?: string;
}

export interface PaymentResponseDto {
  id: string;
  rdv_id: string;
  montant: number;
  devise: string;
  method: PaymentMethod;
  status: string;
  payment_url?: string;
  created_at: string;
}

export interface RefundPaymentDto {
  payment_id: string;
  amount?: number;
  reason: string;
}

// =============================================
// Notification DTOs
// =============================================

export interface SendNotificationDto {
  rdv_id?: string;
  client_id?: string;
  type: 'confirmation' | 'rappel' | 'modification' | 'annulation' | 'resultat';
  channels: ('email' | 'sms' | 'push')[];
  data?: Record<string, unknown>;
}

// =============================================
// Controleur DTOs
// =============================================

export interface CreateControleurDto {
  user_id: string;
  centre_id: string;
  matricule: string;
  agrements: AgrementType[];
  couleur?: string;
}

export interface ControleurResponseDto {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  initiales: string;
  agrements: AgrementType[];
  actif: boolean;
  couleur: string;
}

// =============================================
// Tenant DTOs
// =============================================

export interface CreateTenantDto {
  code: string;
  nom: string;
  reseau_id?: string;
  admin: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
  };
  centre: {
    code: string;
    nom: string;
    siret: string;
    adresse: AddressDto;
    telephone: string;
    email: string;
  };
  config?: Partial<TenantConfigDto>;
}

export interface TenantConfigDto {
  timezone: string;
  locale: string;
  surbooking_enabled: boolean;
  taux_surbooking: number;
  rappel_j1_enabled: boolean;
  paiement_en_ligne_enabled: boolean;
}

export interface TenantResponseDto {
  id: string;
  code: string;
  nom: string;
  status: TenantStatus;
  centres_count: number;
  users_count: number;
  created_at: string;
}

// =============================================
// Centre DTOs
// =============================================

export interface CreateCentreDto {
  code: string;
  nom: string;
  siret: string;
  adresse: AddressDto;
  contact: ContactDto;
  horaires?: HorairesDto;
  coordonnees?: CoordonneesDto;
  agrements: AgrementType[];
  capacite_journaliere?: number;
  nb_lignes?: number;
}

export interface ContactDto {
  telephone: string;
  email: string;
  fax?: string;
  site_web?: string;
}

export interface HorairesDto {
  lundi?: PlageHoraireDto & { ferme?: boolean };
  mardi?: PlageHoraireDto & { ferme?: boolean };
  mercredi?: PlageHoraireDto & { ferme?: boolean };
  jeudi?: PlageHoraireDto & { ferme?: boolean };
  vendredi?: PlageHoraireDto & { ferme?: boolean };
  samedi?: PlageHoraireDto & { ferme?: boolean };
  dimanche?: PlageHoraireDto & { ferme?: boolean };
}

export interface CoordonneesDto {
  latitude: number;
  longitude: number;
}

// =============================================
// Pagination DTOs
// =============================================

export interface PaginationDto {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =============================================
// Statistics DTOs
// =============================================

export interface DashboardStatsDto {
  date: string;
  rdv_total: number;
  rdv_confirmes: number;
  rdv_termines: number;
  rdv_annules: number;
  rdv_absents: number;
  taux_remplissage: number;
  chiffre_affaires: number;
  comparaison_veille?: {
    rdv_variation: number;
    ca_variation: number;
  };
}

export interface ControleurStatsDto {
  controleur_id: string;
  controleur_nom: string;
  rdv_total: number;
  rdv_termines: number;
  duree_moyenne: number;
  taux_remplissage: number;
}
