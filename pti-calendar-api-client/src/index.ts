import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

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

// Re-export audit client
export { AuditClient, getAuditClient } from './audit';
export type { AuditEvent, AuditContext } from './audit';

// Re-export React audit hook
export { useAudit } from './hooks/useAudit';
export type { UseAuditOptions, UseAuditResult } from './hooks/useAudit';
