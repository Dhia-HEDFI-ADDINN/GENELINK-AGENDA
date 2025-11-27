'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'CONTROLEUR' | 'CHEF_DE_CENTRE' | 'RESPONSABLE_RESEAU' | 'ADMIN_SGS' | 'SUPER_ADMIN';
  centre_id?: string;
  centre_nom?: string;
  reseau_id?: string;
  permissions: string[];
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('pti_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      Cookies.remove('pti_access_token');
      Cookies.remove('pti_refresh_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<{
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/auth/login', { email, password });

    const { access_token, refresh_token, user: userData } = response.data;

    Cookies.set('pti_access_token', access_token, { expires: 1 });
    Cookies.set('pti_refresh_token', refresh_token, { expires: 7 });

    if (userData.centre_id) {
      Cookies.set('pti_tenant_id', userData.centre_id, { expires: 30 });
    }

    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    Cookies.remove('pti_access_token');
    Cookies.remove('pti_refresh_token');
    Cookies.remove('pti_tenant_id');
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('*');
  };

  const hasRole = (roles: User['role'][]) => {
    if (!user) return false;
    return roles.includes(user.role);
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
        hasRole,
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
