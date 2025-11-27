import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.instance.interceptors.request.use((config) => {
      const token = Cookies.get('pti_admin_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          Cookies.remove('pti_admin_token');
          Cookies.remove('pti_admin_refresh');
          window.location.href = '/login';
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

  put<T = unknown>(url: string, data?: unknown) {
    return this.instance.put<T>(url, data);
  }

  patch<T = unknown>(url: string, data?: unknown) {
    return this.instance.patch<T>(url, data);
  }

  delete<T = unknown>(url: string) {
    return this.instance.delete<T>(url);
  }
}

export const apiClient = new ApiClient();
