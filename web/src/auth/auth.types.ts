export const USER_ROLES = ['ADMIN', 'CONSULTA'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
