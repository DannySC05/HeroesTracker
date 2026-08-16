import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getMe, login as loginRequest, logout as logoutRequest } from './api';
import { clearToken, hydrateToken, saveToken } from './storage';
import type { AuthUser } from './types';

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: AuthUser | null;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    hydrateToken()
      .then(async (token) => {
        if (!token) return null;
        return getMe();
      })
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setStatus(currentUser ? 'authenticated' : 'anonymous');
      })
      .catch(async () => {
        await clearToken();
        if (active) setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async login(email, password) {
        const result = await loginRequest(email.trim().toLowerCase(), password);
        await saveToken(result.token);
        setUser(result.usuario);
        setStatus('authenticated');
      },
      async logout() {
        try {
          await logoutRequest();
        } finally {
          await clearToken();
          setUser(null);
          setStatus('anonymous');
        }
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
