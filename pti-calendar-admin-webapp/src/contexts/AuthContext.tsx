'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api-client';

export interface AdminUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'RESPONSABLE_RESEAU' | 'ADMIN_SGS' | 'SUPER_ADMIN';
  reseau_id?: string;
  reseau_nom?: string;
  permissions: string[];
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: boolean;
  isAdminSGS: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('pti_admin_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ user: AdminUser }>('/auth/me');
      const userData = response.data.user;

      // Only allow admin roles
      if (!['RESPONSABLE_RESEAU', 'ADMIN_SGS', 'SUPER_ADMIN'].includes(userData.role)) {
        throw new Error('Unauthorized role');
      }

      setUser(userData);
    } catch {
      Cookies.remove('pti_admin_token');
      Cookies.remove('pti_admin_refresh');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      user: AdminUser;
    }>('/auth/login', { email, password });

    const { access_token, refresh_token, user: userData } = response.data;

    Cookies.set('pti_admin_token', access_token, { expires: 1 });
    Cookies.set('pti_admin_refresh', refresh_token, { expires: 7 });

    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('pti_admin_token');
    Cookies.remove('pti_admin_refresh');
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isAdminSGS: user?.role === 'ADMIN_SGS' || user?.role === 'SUPER_ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
