import { http } from '../api/http';
import type { AuthUser, LoginCredentials, LoginResult } from './auth.types';

interface ApiEnvelope<T> {
  data: T;
}

interface LoginResponse {
  token: string;
  expires_in: number;
  usuario: AuthUser;
}

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResult> {
  const response = await http.post<ApiEnvelope<LoginResponse>>('/auth/login', credentials);

  return {
    token: response.data.data.token,
    expiresIn: response.data.data.expires_in,
    user: response.data.data.usuario,
  };
}

export async function getCurrentUserRequest(): Promise<AuthUser> {
  const response = await http.get<ApiEnvelope<AuthUser>>('/auth/me');
  return response.data.data;
}

export async function logoutRequest(): Promise<void> {
  await http.post('/auth/logout');
}
