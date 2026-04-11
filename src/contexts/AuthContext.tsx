'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiFetch } from '@/lib/api';
import { STORAGE_KEYS, ROUTES } from '@/lib/constants';
import type { LoginResponse, JwtPayload } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (passphrase: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.exp * 1000 > Date.now()) {
          setState({ isAuthenticated: true, isLoading: false });
          return;
        }
      } catch {
        // Invalid token
      }
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    setState({ isAuthenticated: false, isLoading: false });
  }, []);

  const login = useCallback(async (passphrase: string) => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ passphrase }),
      skipAuth: true,
    });
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    setState({ isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    setState({ isAuthenticated: false, isLoading: false });
    window.location.href = ROUTES.LOGIN;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
