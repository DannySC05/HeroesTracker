import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getCurrentUserRequest, loginRequest, logoutRequest } from './auth.api';
import { AuthContext } from './auth-context';
import { clearAuthToken, readAuthToken, saveAuthToken } from './auth.storage';
import type { AuthStatus, AuthUser, LoginCredentials } from './auth.types';

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const clearSession = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!readAuthToken()) {
        if (active) {
          setStatus('anonymous');
        }
        return;
      }

      try {
        const currentUser = await getCurrentUserRequest();

        if (active) {
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch {
        if (active) {
          clearSession();
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await loginRequest(credentials);
    saveAuthToken(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // La sesión local se elimina aunque el token haya expirado o la API no responda.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
