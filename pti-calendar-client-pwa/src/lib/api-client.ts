import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = Cookies.get('pti_access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant header if available
        const tenantId = Cookies.get('pti_tenant_id');
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - try to refresh
          const refreshToken = Cookies.get('pti_refresh_token');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refresh_token: refreshToken,
              });

              const { access_token, refresh_token } = response.data;
              Cookies.set('pti_access_token', access_token);
              Cookies.set('pti_refresh_token', refresh_token);

              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`;
                return this.instance.request(error.config);
              }
            } catch {
              // Refresh failed - logout
              this.logout();
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get<T = unknown>(url: string, config?: Parameters<typeof this.instance.get>[1]) {
    return this.instance.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof this.instance.post>[2]) {
    return this.instance.post<T>(url, data, config);
  }

  put<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof this.instance.put>[2]) {
    return this.instance.put<T>(url, data, config);
  }

  patch<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof this.instance.patch>[2]) {
    return this.instance.patch<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: Parameters<typeof this.instance.delete>[1]) {
    return this.instance.delete<T>(url, config);
  }

  setAuthToken(token: string, refreshToken?: string) {
    Cookies.set('pti_access_token', token, { expires: 1 }); // 1 day
    if (refreshToken) {
      Cookies.set('pti_refresh_token', refreshToken, { expires: 7 }); // 7 days
    }
  }

  setTenantId(tenantId: string) {
    Cookies.set('pti_tenant_id', tenantId, { expires: 30 });
  }

  logout() {
    Cookies.remove('pti_access_token');
    Cookies.remove('pti_refresh_token');
    Cookies.remove('pti_tenant_id');
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!Cookies.get('pti_access_token');
  }
}

export const apiClient = new ApiClient();

// Types for API responses
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Centre types
export interface Centre {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
  prochaine_disponibilite?: string;
  distance?: number;
}

// TimeSlot types
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

// Client types
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

// Vehicle types
export interface Vehicule {
  immatriculation: string;
  type_vehicule: 'VL' | 'VUL' | 'MOTO' | 'CARAVANE' | 'REMORQUE';
  type_carburant: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE' | 'GPL' | 'GNV';
  marque?: string;
  modele?: string;
}

// RDV types
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

// Create RDV types
export interface CreateRdvRequest {
  centre_id: string;
  type_controle: 'CTP' | 'CVP' | 'CV' | 'CTC';
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

// API Client wrapper with typed methods
export const api = {
  // Centres
  searchCentres: async (params: {
    search?: string;
    latitude?: number;
    longitude?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Centre>> => {
    const response = await apiClient.get<PaginatedResponse<Centre>>('/centres', { params });
    return response.data;
  },

  getCentre: async (id: string): Promise<Centre> => {
    const response = await apiClient.get<Centre>(`/centres/${id}`);
    return response.data;
  },

  getDisponibilites: async (
    centreId: string,
    params: {
      date: string;
      type_controle: string;
      type_vehicule?: string;
      type_carburant?: string;
    }
  ): Promise<Disponibilites> => {
    const response = await apiClient.get<Disponibilites>(`/centres/${centreId}/disponibilites`, {
      params,
    });
    return response.data;
  },

  getDatesDisponibles: async (
    centreId: string,
    params: {
      type_controle: string;
      date_debut: string;
      date_fin: string;
    }
  ): Promise<{ dates: string[] }> => {
    const response = await apiClient.get<{ dates: string[] }>(
      `/centres/${centreId}/dates-disponibles`,
      { params }
    );
    return response.data;
  },

  // RDV
  createRdvWithPayment: async (data: CreateRdvRequest): Promise<CreateRdvWithPaymentResponse> => {
    const response = await apiClient.post<CreateRdvWithPaymentResponse>('/rdv/create-with-payment', data);
    return response.data;
  },

  getRdv: async (id: string): Promise<Rdv> => {
    const response = await apiClient.get<Rdv>(`/rdv/${id}`);
    return response.data;
  },

  getRdvByReference: async (reference: string, email: string): Promise<Rdv[]> => {
    const response = await apiClient.get<{ data: Rdv[] }>('/rdv/mes-rdv', {
      params: { reference, email },
    });
    return response.data.data;
  },

  searchRdv: async (params: { email?: string; telephone?: string }): Promise<Rdv[]> => {
    const response = await apiClient.get<{ data: Rdv[] }>('/rdv/search', { params });
    return response.data.data;
  },

  cancelRdv: async (id: string, motif?: string): Promise<void> => {
    await apiClient.post(`/rdv/${id}/annuler`, { motif });
  },

  rescheduleRdv: async (
    id: string,
    data: {
      nouvelle_date: string;
      nouvelle_heure: string;
      nouveau_centre_id?: string;
    }
  ): Promise<Rdv> => {
    const response = await apiClient.post<Rdv>(`/rdv/${id}/replanifier`, data);
    return response.data;
  },

  // Promo codes
  checkPromoCode: async (
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
  }> => {
    const response = await apiClient.post('/paiements/check-promo', { code, ...params });
    return response.data;
  },
};

// Export both the raw client and the typed API wrapper
// Use apiClient for raw axios calls or api for typed methods
export { api };
