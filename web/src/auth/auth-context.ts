import { createContext, useContext } from 'react';

import type { AuthStatus, AuthUser, LoginCredentials } from './auth.types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }

  return context;
}
