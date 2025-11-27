'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'AGENT_CALLCENTER' | 'SUPERVISEUR_CALLCENTER';
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within Providers');
  return context;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, retry: 2 } },
  }));

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('pti_cc_token');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => setUser(res.data.user))
        .catch(() => Cookies.remove('pti_cc_token'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/callcenter/login`, { email, password });
    const { access_token, user: userData } = response.data;
    Cookies.set('pti_cc_token', access_token, { expires: 1 });
    setUser(userData);
    router.push('/');
  };

  const logout = () => {
    Cookies.remove('pti_cc_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
