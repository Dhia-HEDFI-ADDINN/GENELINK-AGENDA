import { UserRole } from '../enums';

// =============================================
// Repository Interfaces
// =============================================

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filter?: Record<string, unknown>): Promise<number>;
}

export interface FindOptions {
  where?: Record<string, unknown>;
  order?: Record<string, 'ASC' | 'DESC'>;
  skip?: number;
  take?: number;
  relations?: string[];
}

// =============================================
// Service Interfaces
// =============================================

export interface IAuthService {
  login(email: string, password: string, tenantId?: string): Promise<AuthResult>;
  logout(userId: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  validateToken(token: string): Promise<TokenPayload>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, token: string, newPassword: string): Promise<void>;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    roles: UserRole[];
    tenantId: string;
  };
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
  tenant_id: string;
  iat: number;
  exp: number;
}

export interface IPlanningService {
  getDisponibilites(params: DisponibilitesParams): Promise<CreneauResult[]>;
  createPlanning(params: CreatePlanningParams): Promise<PlanningResult>;
  blockCreneau(params: BlockCreneauParams): Promise<void>;
  unblockCreneau(creneauId: string): Promise<void>;
}

export interface DisponibilitesParams {
  centreId: string;
  date: string;
  typeControle: string;
  typeVehicule: string;
  carburant: string;
}

export interface CreatePlanningParams {
  centreId: string;
  date: string;
  controleurs: { controleurId: string; plages: PlageParams[] }[];
}

export interface PlageParams {
  ouverture: string;
  fermeture: string;
  pauseDebut?: string;
  pauseFin?: string;
}

export interface BlockCreneauParams {
  centreId: string;
  controleurId?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  motif: string;
  description?: string;
}

export interface CreneauResult {
  id?: string;
  controleurId?: string;
  controleurNom?: string;
  date: string;
  heureDebut: string | null;
  heureFin: string | null;
  dureeMinutes: number;
  type: 'standard' | 'depot_vehicule';
  disponible: boolean;
  chargePrevue?: 'faible' | 'moyenne' | 'forte';
}

export interface PlanningResult {
  id: string;
  centreId: string;
  date: string;
  controleurs: ControleurPlanningResult[];
}

export interface ControleurPlanningResult {
  controleurId: string;
  plages: PlageResult[];
  capacite: number;
}

export interface PlageResult {
  ouverture: string;
  fermeture: string;
  pauseDebut?: string;
  pauseFin?: string;
}

export interface IRdvService {
  createRdv(params: CreateRdvParams): Promise<RdvResult>;
  updateRdv(rdvId: string, params: UpdateRdvParams): Promise<RdvResult>;
  cancelRdv(rdvId: string, reason?: string): Promise<void>;
  getRdv(rdvId: string): Promise<RdvResult>;
  searchRdv(params: SearchRdvParams): Promise<RdvResult[]>;
  startControle(rdvId: string): Promise<void>;
  completeControle(rdvId: string, result: ControleResult): Promise<void>;
  markAbsent(rdvId: string): Promise<void>;
}

export interface CreateRdvParams {
  centreId: string;
  dateRdv: string;
  heureDebut: string;
  typeControle: string;
  clientId?: string;
  client?: ClientParams;
  vehiculeId?: string;
  vehicule?: VehiculeParams;
  controleurId?: string;
  notes?: string;
}

export interface UpdateRdvParams {
  dateRdv?: string;
  heureDebut?: string;
  controleurId?: string;
  notes?: string;
}

export interface SearchRdvParams {
  centreId?: string;
  dateDebut?: string;
  dateFin?: string;
  status?: string;
  clientId?: string;
  controleurId?: string;
  immatriculation?: string;
  page?: number;
  limit?: number;
}

export interface ClientParams {
  type: 'particulier' | 'professionnel';
  nom: string;
  prenom?: string;
  email?: string;
  telephone: string;
}

export interface VehiculeParams {
  immatriculation: string;
  type: string;
  marque: string;
  carburant: string;
}

export interface ControleResult {
  favorable: boolean;
  defautsMajeurs: number;
  defautsMineurs: number;
  dateLimiteContreVisite?: string;
}

export interface RdvResult {
  id: string;
  reference: string;
  centreId: string;
  dateRdv: string;
  heureDebut: string;
  heureFin: string;
  typeControle: string;
  status: string;
  montantTtc: number;
  client: {
    id: string;
    nom: string;
    prenom?: string;
    telephone: string;
  };
  vehicule: {
    id: string;
    immatriculation: string;
    marque: string;
  };
  controleur?: {
    id: string;
    nom: string;
  };
}

export interface IPaymentService {
  createPayment(rdvId: string, method: string): Promise<PaymentResult>;
  processPayment(paymentId: string, data: Record<string, unknown>): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<void>;
  getPaymentStatus(paymentId: string): Promise<PaymentResult>;
}

export interface PaymentResult {
  id: string;
  rdvId: string;
  montant: number;
  devise: string;
  method: string;
  status: string;
  paymentUrl?: string;
}

export interface INotificationService {
  sendConfirmation(rdvId: string, channels: string[]): Promise<void>;
  sendReminder(rdvId: string, channels: string[]): Promise<void>;
  sendCancellation(rdvId: string, channels: string[]): Promise<void>;
  sendResult(rdvId: string, channels: string[]): Promise<void>;
}

// =============================================
// Event Interfaces
// =============================================

export interface BaseEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  service: string;
  version: string;
  correlationId?: string;
  tenantId: string;
}

export interface RdvCreatedEvent extends BaseEvent {
  type: 'rdv.created';
  data: {
    rdvId: string;
    centreId: string;
    clientId: string;
    dateRdv: string;
    heureDebut: string;
    typeControle: string;
    montantTtc: number;
  };
}

export interface RdvCancelledEvent extends BaseEvent {
  type: 'rdv.cancelled';
  data: {
    rdvId: string;
    centreId: string;
    clientId: string;
    reason?: string;
  };
}

export interface PaymentCompletedEvent extends BaseEvent {
  type: 'payment.completed';
  data: {
    paymentId: string;
    rdvId: string;
    montant: number;
    method: string;
  };
}

// =============================================
// Config Interfaces
// =============================================

export interface AppConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  apiPrefix: string;
  corsOrigins: string[];
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  poolSize: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

// =============================================
// API Response Interfaces
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
