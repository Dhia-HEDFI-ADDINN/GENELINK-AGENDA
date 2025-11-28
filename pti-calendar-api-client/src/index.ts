import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { AuditEvent, AuditContext, AuditClient, getAuditClient } from './audit';

// Types
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefresh?: (accessToken: string, refreshToken: string) => void;
  onAuthError?: () => void;
  tenantId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Centre {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  latitude: number;
  longitude: number;
  actif: boolean;
  prochaine_disponibilite?: string;
  distance?: number;
}

export interface TimeSlot {
  id?: string;
  heure_debut: string;
  heure_fin: string;
  controleur_id?: string;
  controleur_nom?: string;
  disponible: boolean;
}

export interface Disponibilites {
  date: string;
  creneaux: TimeSlot[];
}

export interface Client {
  id?: string;
  civilite: 'M' | 'MME';
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
}

export interface Vehicule {
  immatriculation: string;
  type_vehicule: 'VL' | 'VUL' | 'MOTO' | 'CARAVANE' | 'REMORQUE';
  type_carburant: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE' | 'GPL' | 'GNV';
  marque?: string;
  modele?: string;
}

export interface Rdv {
  id: string;
  reference: string;
  statut: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  type_controle: string;
  centre: Centre;
  client: Client;
  vehicule: Vehicule;
  controleur?: {
    id: string;
    nom: string;
    prenom: string;
    initiales: string;
  };
  prix_total: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRdvRequest {
  centre_id: string;
  type_controle: 'PERIODIQUE' | 'CONTRE_VISITE' | 'COMPLEMENTAIRE';
  date: string;
  heure_debut: string;
  heure_fin: string;
  controleur_id?: string;
  client: Client;
  vehicule: Vehicule;
  code_promo?: string;
}

export interface CreateRdvWithPaymentResponse {
  rdv_id: string;
  client_secret: string;
  payment_intent_id: string;
  prix_base: number;
  prix_total: number;
  reduction: number;
}

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  permissions: string[];
  centre_id?: string;
  centre_nom?: string;
  reseau_id?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// API Client Class
export class PtiCalendarApiClient {
  private instance: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use((config) => {
      const token = this.config.getAccessToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (this.config.tenantId) {
        config.headers['X-Tenant-ID'] = this.config.tenantId;
      }

      return config;
    });

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          const refreshToken = this.config.getRefreshToken?.();
          if (refreshToken) {
            try {
              const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token } = response.data;
              this.config.onTokenRefresh?.(access_token, refresh_token);

              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.instance.request(error.config);
              }
            } catch {
              this.config.onAuthError?.();
            }
          } else {
            this.config.onAuthError?.();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setTenantId(tenantId: string) {
    this.config.tenantId = tenantId;
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.instance.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.instance.get<{ user: User }>('/auth/me');
    return response.data.user;
  }

  // Centres
  async searchCentres(params: {
    search?: string;
    latitude?: number;
    longitude?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Centre>> {
    const response = await this.instance.get<PaginatedResponse<Centre>>('/centres', { params });
    return response.data;
  }

  async getCentre(id: string): Promise<Centre> {
    const response = await this.instance.get<Centre>(`/centres/${id}`);
    return response.data;
  }

  async getDisponibilites(
    centreId: string,
    params: {
      date: string;
      type_controle: string;
      type_vehicule?: string;
      type_carburant?: string;
    }
  ): Promise<Disponibilites> {
    const response = await this.instance.get<Disponibilites>(
      `/centres/${centreId}/disponibilites`,
      { params }
    );
    return response.data;
  }

  async getDatesDisponibles(
    centreId: string,
    params: {
      type_controle: string;
      date_debut: string;
      date_fin: string;
    }
  ): Promise<{ dates: string[] }> {
    const response = await this.instance.get<{ dates: string[] }>(
      `/centres/${centreId}/dates-disponibles`,
      { params }
    );
    return response.data;
  }

  // RDV
  async createRdvWithPayment(data: CreateRdvRequest): Promise<CreateRdvWithPaymentResponse> {
    const response = await this.instance.post<CreateRdvWithPaymentResponse>(
      '/rdv/create-with-payment',
      data
    );
    return response.data;
  }

  async getRdv(id: string): Promise<Rdv> {
    const response = await this.instance.get<Rdv>(`/rdv/${id}`);
    return response.data;
  }

  async getRdvByReference(reference: string, email: string): Promise<Rdv[]> {
    const response = await this.instance.get<{ data: Rdv[] }>('/rdv/mes-rdv', {
      params: { reference, email },
    });
    return response.data.data;
  }

  async cancelRdv(id: string): Promise<void> {
    await this.instance.post(`/rdv/${id}/annuler`);
  }

  async checkinRdv(id: string): Promise<void> {
    await this.instance.post(`/rdv/${id}/checkin`);
  }

  async startRdv(id: string): Promise<void> {
    await this.instance.post(`/rdv/${id}/demarrer`);
  }

  async completeRdv(id: string, resultat: { statut: string; defauts?: string[]; observations?: string }): Promise<void> {
    await this.instance.post(`/rdv/${id}/terminer`, resultat);
  }

  async markNoShow(id: string): Promise<void> {
    await this.instance.post(`/rdv/${id}/no-show`);
  }

  // Promo codes
  async checkPromoCode(
    code: string,
    params: {
      centre_id: string;
      type_controle: string;
      type_vehicule?: string;
    }
  ): Promise<{
    valid: boolean;
    type_reduction: 'POURCENTAGE' | 'MONTANT_FIXE';
    valeur: number;
    nouveau_prix: number;
  }> {
    const response = await this.instance.post('/paiements/check-promo', {
      code,
      ...params,
    });
    return response.data;
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

// Factory function
export function createApiClient(config: ApiClientConfig): PtiCalendarApiClient {
  return new PtiCalendarApiClient(config);
}

// Default export
export default PtiCalendarApiClient;

// Re-export audit client (already imported at top)
export { AuditClient, getAuditClient, AuditEvent, AuditContext };

// Re-export React audit hook
export { useAudit } from './hooks/useAudit';
export type { UseAuditOptions, UseAuditResult } from './hooks/useAudit';

// ============================================
// Extended Types for Pro/Admin/CallCenter
// ============================================

export interface DashboardStats {
  rdv_aujourd_hui: number;
  rdv_en_attente: number;
  rdv_termines: number;
  rdv_annules: number;
  taux_occupation: number;
  no_shows: number;
  prochains_rdv: Rdv[];
}

export interface Controleur {
  id: string;
  user_id: string;
  centre_id: string;
  nom: string;
  prenom: string;
  initiales: string;
  email: string;
  telephone: string;
  agrements: string[];
  actif: boolean;
  created_at: string;
}

export interface Planning {
  id: string;
  centre_id: string;
  date: string;
  ferme: boolean;
  motif_fermeture?: string;
  controleurs: PlanningControleur[];
}

export interface PlanningControleur {
  controleur_id: string;
  controleur_nom: string;
  controleur_prenom: string;
  initiales: string;
  agrements?: string[];
  plages: PlageHoraire[];
}

export interface PlageHoraire {
  ouverture: string;
  fermeture: string;
  pause_debut?: string;
  pause_fin?: string;
}

export interface Reseau {
  id: string;
  code: string;
  nom: string;
  tenant_id: string;
  nb_centres: number;
  actif: boolean;
}

export interface Tarif {
  id: string;
  centre_id: string;
  type_controle: string;
  type_vehicule: string;
  prix_ht: number;
  prix_ttc: number;
  tva: number;
  actif: boolean;
}

export interface CodePromo {
  id: string;
  code: string;
  type_reduction: 'POURCENTAGE' | 'MONTANT_FIXE';
  valeur: number;
  date_debut: string;
  date_fin: string;
  utilisations_max: number;
  utilisations_actuelles: number;
  actif: boolean;
}

export interface UserAdmin {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  centre_id?: string;
  centre_nom?: string;
  reseau_id?: string;
  reseau_nom?: string;
  actif: boolean;
  last_login?: string;
  created_at: string;
}

export interface CallCenterStats {
  today: {
    appels_total: number;
    rdv_crees: number;
    rdv_modifies: number;
    rdv_annules: number;
    temps_moyen_appel: number;
    taux_conversion: number;
  };
  rappels_en_attente: number;
  rdv_a_confirmer: number;
  rdv_proches: RdvProche[];
  historique_appels: HistoriqueAppel[];
  performance: Performance;
}

export interface RdvProche {
  id: string;
  client_nom: string;
  client_telephone: string;
  centre_nom: string;
  date: string;
  heure: string;
  statut: string;
}

export interface HistoriqueAppel {
  date: string;
  appels: number;
  rdv_crees: number;
}

export interface Performance {
  rang: number;
  total_agents: number;
  rdv_semaine: number;
  objectif_semaine: number;
}

export interface Rappel {
  id: string;
  client_id: string;
  client_nom: string;
  client_telephone: string;
  client_email: string;
  motif: string;
  date_rappel: string;
  heure_rappel: string;
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE';
  statut: 'EN_ATTENTE' | 'EFFECTUE' | 'ANNULE';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface Script {
  id: string;
  titre: string;
  type: 'ACCUEIL' | 'RDV' | 'CONFIRMATION' | 'ANNULATION' | 'RECLAMATION';
  contenu: string;
  variables: string[];
  actif: boolean;
}

// ============================================
// Extended API Methods
// ============================================

// Pro WebApp Methods
export const proApi = {
  // Dashboard
  getDashboardStats: async (client: PtiCalendarApiClient, date: string) => {
    return client.get<DashboardStats>('/dashboard/stats', { params: { date } });
  },

  // RDV Management
  getRdvList: async (
    client: PtiCalendarApiClient,
    params: {
      date?: string;
      statut?: string;
      controleur_id?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    return client.get<PaginatedResponse<Rdv>>('/rdv', { params });
  },

  getRdvById: async (client: PtiCalendarApiClient, id: string) => {
    return client.get<Rdv>(`/rdv/${id}`);
  },

  createRdv: async (client: PtiCalendarApiClient, data: CreateRdvRequest) => {
    return client.post<Rdv>('/rdv', data);
  },

  updateRdv: async (client: PtiCalendarApiClient, id: string, data: Partial<CreateRdvRequest>) => {
    return client.put<Rdv>(`/rdv/${id}`, data);
  },

  checkinRdv: async (client: PtiCalendarApiClient, id: string) => {
    return client.post<Rdv>(`/rdv/${id}/checkin`);
  },

  startRdv: async (client: PtiCalendarApiClient, id: string) => {
    return client.post<Rdv>(`/rdv/${id}/demarrer`);
  },

  completeRdv: async (
    client: PtiCalendarApiClient,
    id: string,
    data: { resultat: 'A' | 'S' | 'R'; defauts?: string[]; observations?: string }
  ) => {
    return client.post<Rdv>(`/rdv/${id}/terminer`, data);
  },

  markNoShow: async (client: PtiCalendarApiClient, id: string) => {
    return client.post<Rdv>(`/rdv/${id}/no-show`);
  },

  cancelRdv: async (client: PtiCalendarApiClient, id: string, motif: string) => {
    return client.post<Rdv>(`/rdv/${id}/annuler`, { motif });
  },

  // Planning
  getPlanning: async (client: PtiCalendarApiClient, centreId: string, date: string) => {
    return client.get<Planning>(`/planning/${centreId}/${date}`);
  },

  updatePlanning: async (client: PtiCalendarApiClient, centreId: string, date: string, data: Partial<Planning>) => {
    return client.put<Planning>(`/planning/${centreId}/${date}`, data);
  },

  // Controleurs
  getControleurs: async (client: PtiCalendarApiClient, centreId: string) => {
    return client.get<Controleur[]>(`/centres/${centreId}/controleurs`);
  },
};

// Admin WebApp Methods
export const adminApi = {
  // Centres
  getCentres: async (
    client: PtiCalendarApiClient,
    params?: { search?: string; reseau_id?: string; actif?: boolean }
  ) => {
    return client.get<PaginatedResponse<Centre>>('/admin/centres', { params });
  },

  getCentre: async (client: PtiCalendarApiClient, id: string) => {
    return client.get<Centre>(`/admin/centres/${id}`);
  },

  createCentre: async (client: PtiCalendarApiClient, data: Partial<Centre>) => {
    return client.post<Centre>('/admin/centres', data);
  },

  updateCentre: async (client: PtiCalendarApiClient, id: string, data: Partial<Centre>) => {
    return client.put<Centre>(`/admin/centres/${id}`, data);
  },

  deleteCentre: async (client: PtiCalendarApiClient, id: string) => {
    return client.delete(`/admin/centres/${id}`);
  },

  // Reseaux
  getReseaux: async (client: PtiCalendarApiClient) => {
    return client.get<PaginatedResponse<Reseau>>('/admin/reseaux');
  },

  createReseau: async (client: PtiCalendarApiClient, data: Partial<Reseau>) => {
    return client.post<Reseau>('/admin/reseaux', data);
  },

  updateReseau: async (client: PtiCalendarApiClient, id: string, data: Partial<Reseau>) => {
    return client.put<Reseau>(`/admin/reseaux/${id}`, data);
  },

  // Users
  getUsers: async (
    client: PtiCalendarApiClient,
    params?: { search?: string; role?: string; centre_id?: string; actif?: boolean }
  ) => {
    return client.get<PaginatedResponse<UserAdmin>>('/admin/users', { params });
  },

  getUser: async (client: PtiCalendarApiClient, id: string) => {
    return client.get<UserAdmin>(`/admin/users/${id}`);
  },

  createUser: async (client: PtiCalendarApiClient, data: Partial<UserAdmin> & { password: string }) => {
    return client.post<UserAdmin>('/admin/users', data);
  },

  updateUser: async (client: PtiCalendarApiClient, id: string, data: Partial<UserAdmin>) => {
    return client.put<UserAdmin>(`/admin/users/${id}`, data);
  },

  deleteUser: async (client: PtiCalendarApiClient, id: string) => {
    return client.delete(`/admin/users/${id}`);
  },

  resetUserPassword: async (client: PtiCalendarApiClient, id: string) => {
    return client.post<{ temporary_password: string }>(`/admin/users/${id}/reset-password`);
  },

  // Tarifs
  getTarifs: async (client: PtiCalendarApiClient, centreId: string) => {
    return client.get<Tarif[]>(`/admin/centres/${centreId}/tarifs`);
  },

  updateTarifs: async (client: PtiCalendarApiClient, centreId: string, tarifs: Partial<Tarif>[]) => {
    return client.put<Tarif[]>(`/admin/centres/${centreId}/tarifs`, { tarifs });
  },

  // Codes Promo
  getCodesPromo: async (client: PtiCalendarApiClient) => {
    return client.get<CodePromo[]>('/admin/codes-promo');
  },

  createCodePromo: async (client: PtiCalendarApiClient, data: Partial<CodePromo>) => {
    return client.post<CodePromo>('/admin/codes-promo', data);
  },

  updateCodePromo: async (client: PtiCalendarApiClient, id: string, data: Partial<CodePromo>) => {
    return client.put<CodePromo>(`/admin/codes-promo/${id}`, data);
  },

  deleteCodePromo: async (client: PtiCalendarApiClient, id: string) => {
    return client.delete(`/admin/codes-promo/${id}`);
  },

  // Audit
  getAuditLogs: async (
    client: PtiCalendarApiClient,
    params: { date_debut: string; date_fin: string; action?: string; user_id?: string }
  ) => {
    return client.get<PaginatedResponse<AuditEvent>>('/admin/audit', { params });
  },

  // Reports
  getReport: async (
    client: PtiCalendarApiClient,
    type: 'rdv' | 'ca' | 'performance',
    params: { date_debut: string; date_fin: string; centre_id?: string }
  ) => {
    return client.get(`/admin/reports/${type}`, { params });
  },
};

// CallCenter WebApp Methods
export const callcenterApi = {
  // Stats
  getStats: async (client: PtiCalendarApiClient) => {
    return client.get<CallCenterStats>('/callcenter/stats');
  },

  // Client Search
  searchClients: async (
    client: PtiCalendarApiClient,
    params: { telephone?: string; email?: string; nom?: string; immatriculation?: string }
  ) => {
    return client.get<PaginatedResponse<Client>>('/callcenter/clients', { params });
  },

  getClientHistory: async (client: PtiCalendarApiClient, clientId: string) => {
    return client.get<Rdv[]>(`/callcenter/clients/${clientId}/historique`);
  },

  // Rappels
  getRappels: async (client: PtiCalendarApiClient, params?: { date?: string; statut?: string }) => {
    return client.get<Rappel[]>('/callcenter/rappels', { params });
  },

  createRappel: async (client: PtiCalendarApiClient, data: Partial<Rappel>) => {
    return client.post<Rappel>('/callcenter/rappels', data);
  },

  updateRappel: async (client: PtiCalendarApiClient, id: string, data: Partial<Rappel>) => {
    return client.put<Rappel>(`/callcenter/rappels/${id}`, data);
  },

  completeRappel: async (client: PtiCalendarApiClient, id: string, notes?: string) => {
    return client.post<Rappel>(`/callcenter/rappels/${id}/complete`, { notes });
  },

  // Confirmations
  getRdvAConfirmer: async (client: PtiCalendarApiClient, date: string) => {
    return client.get<Rdv[]>('/callcenter/confirmations', { params: { date } });
  },

  confirmerRdv: async (client: PtiCalendarApiClient, rdvId: string) => {
    return client.post<Rdv>(`/callcenter/confirmations/${rdvId}/confirmer`);
  },

  // Scripts
  getScripts: async (client: PtiCalendarApiClient, type?: string) => {
    return client.get<Script[]>('/callcenter/scripts', { params: { type } });
  },

  // RDV Creation (simplified for phone)
  createRdvByPhone: async (
    client: PtiCalendarApiClient,
    data: CreateRdvRequest & { source: 'CALLCENTER' }
  ) => {
    return client.post<Rdv>('/callcenter/rdv', data);
  },

  // Log call
  logCall: async (
    client: PtiCalendarApiClient,
    data: {
      client_telephone: string;
      duree_secondes: number;
      type: 'ENTRANT' | 'SORTANT';
      resultat: 'RDV_CREE' | 'RDV_MODIFIE' | 'RDV_ANNULE' | 'INFO' | 'RAPPEL' | 'ABSENT';
      rdv_id?: string;
      notes?: string;
    }
  ) => {
    return client.post('/callcenter/appels', data);
  },
};
