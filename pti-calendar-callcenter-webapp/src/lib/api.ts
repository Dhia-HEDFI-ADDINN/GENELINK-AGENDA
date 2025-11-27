import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('pti_cc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('pti_cc_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    Cookies.set('pti_cc_token', token, { expires: 7 });
    return user;
  },
  logout: () => {
    Cookies.remove('pti_cc_token');
    window.location.href = '/login';
  },
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Clients
export const clientsApi = {
  search: async (params: { telephone?: string; nom?: string; email?: string; immat?: string }) => {
    const response = await api.get('/callcenter/clients/search', { params });
    return response.data.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/callcenter/clients/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/callcenter/clients/${id}`, data);
    return response.data;
  },
  addNote: async (clientId: string, contenu: string) => {
    const response = await api.post(`/callcenter/clients/${clientId}/notes`, { contenu });
    return response.data;
  },
};

// RDV
export const rdvApi = {
  create: async (data: {
    client_id?: string;
    client: any;
    centre_id: string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    type_controle: string;
    vehicule: any;
  }) => {
    const response = await api.post('/callcenter/rdv', data);
    return response.data;
  },
  getByClient: async (clientId: string) => {
    const response = await api.get('/callcenter/rdv', { params: { client_id: clientId } });
    return response.data.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/callcenter/rdv/${id}`);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/callcenter/rdv/${id}`, data);
    return response.data;
  },
  cancel: async (id: string, motif: string) => {
    const response = await api.post(`/callcenter/rdv/${id}/annuler`, { motif });
    return response.data;
  },
  confirm: async (id: string) => {
    const response = await api.post(`/callcenter/rdv/${id}/confirmer`);
    return response.data;
  },
};

// Centres
export const centresApi = {
  search: async (search: string) => {
    const response = await api.get('/centres', { params: { search, limit: 10 } });
    return response.data.data;
  },
  getDisponibilites: async (centreId: string, date: string, typeControle: string) => {
    const response = await api.get(`/centres/${centreId}/disponibilites`, {
      params: { date, type_controle: typeControle },
    });
    return response.data;
  },
};

// Rappels
export const rappelsApi = {
  getAll: async (params: { statut?: string; date?: string }) => {
    const response = await api.get('/callcenter/rappels', { params });
    return response.data.data;
  },
  create: async (data: {
    client_id: string;
    date: string;
    heure: string;
    motif: string;
    priorite: string;
  }) => {
    const response = await api.post('/callcenter/rappels', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/callcenter/rappels/${id}`, data);
    return response.data;
  },
};

// Scripts & FAQ
export const scriptsApi = {
  getAll: async (categorie?: string) => {
    const response = await api.get('/callcenter/scripts', { params: { categorie } });
    return response.data.data;
  },
  getFaq: async (search?: string) => {
    const response = await api.get('/callcenter/faq', { params: { search } });
    return response.data.data;
  },
};

// Stats
export const statsApi = {
  getDashboard: async () => {
    const response = await api.get('/callcenter/stats');
    return response.data;
  },
  getAgent: async (periode: string) => {
    const response = await api.get('/callcenter/stats/agent', { params: { periode } });
    return response.data;
  },
};

export default api;
