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
