// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_TENANT = 'ADMIN_TENANT',
  ADMIN_AGENCE = 'ADMIN_AGENCE',
  ADMIN_CT = 'ADMIN_CT',
  CONTROLEUR = 'CONTROLEUR',
  CALL_CENTER = 'CALL_CENTER',
  CLIENT = 'CLIENT',
  API_KEY = 'API_KEY'
}

// RDV Status
export enum RdvStatus {
  EN_ATTENTE = 'en_attente',
  EN_ATTENTE_PAIEMENT = 'en_attente_paiement',
  CONFIRME = 'confirme',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
  ABSENT = 'absent',
  REPORTE = 'reporte'
}

// Type Controle
export enum TypeControle {
  CTP = 'CTP',       // Contrôle Technique Périodique
  CVP = 'CVP',       // Contre-Visite Périodique
  CV = 'CV',         // Contre-Visite
  CTC = 'CTC',       // Contrôle Technique Complémentaire
  CVC = 'CVC',       // Contre-Visite Complémentaire
  CTL = 'CTL',       // Contrôle Technique pour véhicule lourd
  CVL = 'CVL'        // Contre-Visite Lourd
}

// Type Vehicule
export enum TypeVehicule {
  VP = 'VP',         // Véhicule Particulier
  VL = 'VL',         // Véhicule Léger
  VU = 'VU',         // Véhicule Utilitaire
  L = 'L',           // Deux-roues (Moto, Cyclo)
  PL = 'PL',         // Poids Lourd
  TC = 'TC',         // Transport en Commun
  QUAD = 'QUAD',     // Quad
  CAMPING_CAR = 'CAMPING_CAR'
}

// Carburant
export enum Carburant {
  ESSENCE = 'essence',
  DIESEL = 'diesel',
  GPL = 'gpl',
  GNV = 'gnv',
  HYBRIDE = 'hybride',
  ELECTRIQUE = 'electrique',
  HYDROGENE = 'hydrogene'
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

// Payment Method
export enum PaymentMethod {
  CARD = 'card',
  PAYZEN = 'payzen',
  LEMONWAY = 'lemonway',
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer'
}

// Notification Type
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

// Notification Channel
export enum NotificationChannel {
  BREVO = 'brevo',
  SMS_MODE = 'sms_mode',
  FCM = 'fcm'
}

// Tenant Status
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

// Centre Status
export enum CentreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed'
}

// Agrement Type
export enum AgrementType {
  VL = 'VL',         // Véhicules Légers
  L = 'L',           // Deux-roues
  PL = 'PL',         // Poids Lourds
  GAZ = 'GAZ',       // Véhicules GPL/GNV
  ELECTRIQUE = 'ELECTRIQUE'
}

// Creneau Block Type
export enum CreneauBlockType {
  PAUSE = 'pause',
  ABSENCE = 'absence',
  CONGES = 'conges',
  FORMATION = 'formation',
  MAINTENANCE = 'maintenance',
  FERMETURE = 'fermeture'
}

// Event Types for Kafka
export enum EventType {
  // RDV Events
  RDV_CREATED = 'rdv.created',
  RDV_UPDATED = 'rdv.updated',
  RDV_CANCELLED = 'rdv.cancelled',
  RDV_CONFIRMED = 'rdv.confirmed',
  RDV_STARTED = 'rdv.started',
  RDV_COMPLETED = 'rdv.completed',
  RDV_ABSENT = 'rdv.absent',

  // Planning Events
  PLANNING_UPDATED = 'planning.updated',
  CRENEAU_BLOCKED = 'creneau.blocked',
  CRENEAU_UNBLOCKED = 'creneau.unblocked',

  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Notification Events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_FAILED = 'notification.failed',

  // Tenant Events
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_SUSPENDED = 'tenant.suspended',
  TENANT_ACTIVATED = 'tenant.activated'
}

// Source RDV
export enum SourceRdv {
  WEB = 'web',
  MOBILE = 'mobile',
  CALL_CENTER = 'call_center',
  BACKOFFICE = 'backoffice',
  API = 'api',
  WALK_IN = 'walk_in'
}
