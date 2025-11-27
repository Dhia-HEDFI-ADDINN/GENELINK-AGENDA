import { UserRole, TenantStatus, CentreStatus, AgrementType, RdvStatus, TypeControle, TypeVehicule, Carburant, PaymentStatus, PaymentMethod, SourceRdv, CreneauBlockType } from '../enums';

// Base Entity
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

// Tenant Entity
export interface Tenant extends BaseEntity {
  code: string;
  nom: string;
  status: TenantStatus;
  reseau_id?: string;
  config: TenantConfig;
  subscription: TenantSubscription;
}

export interface TenantConfig {
  timezone: string;
  locale: string;
  currency: string;
  surbooking_enabled: boolean;
  taux_surbooking: number;
  rappel_j1_enabled: boolean;
  rappel_h2_enabled: boolean;
  paiement_en_ligne_enabled: boolean;
  paiement_providers: string[];
  horaires_defaut: HorairesDefaut;
}

export interface TenantSubscription {
  plan: 'starter' | 'business' | 'enterprise';
  centres_max: number;
  users_max: number;
  expires_at: Date;
}

export interface HorairesDefaut {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
  jours_ouvres: number[];
}

// Reseau Entity (Groupe de centres)
export interface Reseau extends BaseEntity {
  code: string;
  nom: string;
  marque: string;
  logo_url?: string;
  config: ReseauConfig;
}

export interface ReseauConfig {
  couleur_primaire: string;
  couleur_secondaire: string;
  email_support: string;
  telephone_support: string;
}

// Centre Entity
export interface Centre extends BaseEntity {
  tenant_id: string;
  reseau_id?: string;
  code: string;
  nom: string;
  siret: string;
  status: CentreStatus;
  adresse: Adresse;
  contact: Contact;
  horaires: Horaires;
  coordonnees: Coordonnees;
  agrements: AgrementType[];
  capacite_journaliere: number;
  nb_lignes: number;
}

export interface Adresse {
  rue: string;
  complement?: string;
  code_postal: string;
  ville: string;
  pays: string;
}

export interface Contact {
  telephone: string;
  email: string;
  fax?: string;
  site_web?: string;
}

export interface Horaires {
  lundi?: PlageHoraire;
  mardi?: PlageHoraire;
  mercredi?: PlageHoraire;
  jeudi?: PlageHoraire;
  vendredi?: PlageHoraire;
  samedi?: PlageHoraire;
  dimanche?: PlageHoraire;
}

export interface PlageHoraire {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
  ferme: boolean;
}

export interface Coordonnees {
  latitude: number;
  longitude: number;
}

// User Entity
export interface User extends BaseEntity {
  tenant_id: string;
  email: string;
  password_hash?: string;
  nom: string;
  prenom: string;
  telephone?: string;
  roles: UserRole[];
  permissions: string[];
  centre_ids: string[];
  actif: boolean;
  email_verified: boolean;
  last_login_at?: Date;
  oauth_provider?: string;
  oauth_id?: string;
}

// Controleur Entity
export interface Controleur extends BaseEntity {
  tenant_id: string;
  user_id: string;
  centre_id: string;
  matricule: string;
  agrements: AgrementType[];
  actif: boolean;
  couleur: string;
  initiales: string;
  user?: User;
}

// Client Entity
export interface Client extends BaseEntity {
  tenant_id: string;
  type: 'particulier' | 'professionnel';
  civilite?: string;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  siret?: string;
  email?: string;
  telephone: string;
  telephone_secondaire?: string;
  adresse?: Adresse;
  preferences?: ClientPreferences;
  vehicules?: Vehicule[];
}

export interface ClientPreferences {
  rappel_sms: boolean;
  rappel_email: boolean;
  newsletter: boolean;
  centre_prefere_id?: string;
}

// Vehicule Entity
export interface Vehicule extends BaseEntity {
  tenant_id: string;
  client_id: string;
  immatriculation: string;
  type: TypeVehicule;
  marque: string;
  modele?: string;
  carburant: Carburant;
  date_premiere_immatriculation?: Date;
  date_derniere_visite?: Date;
  prochain_controle?: Date;
  vin?: string;
  puissance_fiscale?: number;
  ptac?: number;
}

// Planning Entity
export interface Planning extends BaseEntity {
  tenant_id: string;
  centre_id: string;
  date: string;
  controleurs: PlanningControleur[];
  jours_feries: boolean;
  commentaire?: string;
}

export interface PlanningControleur {
  controleur_id: string;
  plages: PlageHoraire[];
  capacite: number;
}

// Creneau Entity
export interface Creneau extends BaseEntity {
  tenant_id: string;
  centre_id: string;
  controleur_id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  type: 'standard' | 'depot_vehicule';
  disponible: boolean;
  rdv_id?: string;
}

// Creneau Bloque Entity
export interface CreneauBloque extends BaseEntity {
  tenant_id: string;
  centre_id: string;
  controleur_id?: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  motif: CreneauBlockType;
  description?: string;
  recurrent: boolean;
}

// RDV Entity
export interface Rdv extends BaseEntity {
  tenant_id: string;
  centre_id: string;
  client_id: string;
  vehicule_id: string;
  controleur_id?: string;
  date_rdv: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  type_controle: TypeControle;
  status: RdvStatus;
  source: SourceRdv;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  paiement_status: PaymentStatus;
  paiement_id?: string;
  reference: string;
  qr_code?: string;
  notes?: string;
  resultat_controle?: ResultatControle;
  client?: Client;
  vehicule?: Vehicule;
  centre?: Centre;
  controleur?: Controleur;
}

export interface ResultatControle {
  favorable: boolean;
  date_resultat: Date;
  defauts_majeurs: number;
  defauts_mineurs: number;
  date_limite_contre_visite?: Date;
  rapport_url?: string;
}

// Payment Entity
export interface Payment extends BaseEntity {
  tenant_id: string;
  rdv_id: string;
  montant: number;
  devise: string;
  method: PaymentMethod;
  provider: string;
  provider_transaction_id?: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  refund_amount?: number;
  refund_reason?: string;
  paid_at?: Date;
  refunded_at?: Date;
}

// Notification Entity
export interface Notification extends BaseEntity {
  tenant_id: string;
  rdv_id?: string;
  user_id?: string;
  client_id?: string;
  type: 'confirmation' | 'rappel' | 'modification' | 'annulation' | 'resultat';
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: Date;
  error_message?: string;
}

// Audit Log Entity
export interface AuditLog extends BaseEntity {
  tenant_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
