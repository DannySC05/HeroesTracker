import { getMemoryToken } from './storage';
import type {
  AuthUser,
  Hero,
  HeroImageCandidate,
  HeroPayload,
  Mission,
  MissionPayload,
} from './types';

const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL || 'https://heroes-tracker-api.onrender.com/api'
).replace(/\/$/, '');

interface Envelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
}

interface ErrorEnvelope {
  error?: { message?: string };
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const token = getMemoryToken();

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const text = await response.text();
    let body: unknown;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined;
      }
    }

    if (!response.ok) {
      const errorBody = body as ErrorEnvelope | undefined;
      throw new ApiRequestError(
        errorBody?.error?.message || `La API respondió con el estado ${response.status}.`,
        response.status,
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('No pudimos conectar con el servidor. Verifica tu conexión.');
  } finally {
    clearTimeout(timeout);
  }
}

function jsonBody(value: unknown): Pick<RequestInit, 'body'> {
  return { body: JSON.stringify(value) };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiRequestError ? error.message : fallback;
}

export async function login(email: string, password: string) {
  const response = await request<Envelope<{ token: string; expires_in: number; usuario: AuthUser }>>(
    '/auth/login',
    { method: 'POST', ...jsonBody({ email, password }) },
  );
  return response.data;
}

export async function getMe(): Promise<AuthUser> {
  return (await request<Envelope<AuthUser>>('/auth/me')).data;
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function listHeroes(nombre?: string): Promise<Hero[]> {
  const query = nombre ? `?nombre=${encodeURIComponent(nombre)}` : '';
  return (await request<ListEnvelope<Hero>>(`/heroes${query}`)).data;
}

export async function getHero(id: string): Promise<Hero> {
  return (await request<Envelope<Hero>>(`/heroes/${id}`)).data;
}

export async function createHero(payload: HeroPayload): Promise<Hero> {
  return (
    await request<Envelope<Hero>>('/heroes', { method: 'POST', ...jsonBody(payload) })
  ).data;
}

export async function updateHero(id: string, payload: HeroPayload): Promise<Hero> {
  return (
    await request<Envelope<Hero>>(`/heroes/${id}`, { method: 'PUT', ...jsonBody(payload) })
  ).data;
}

export async function deleteHero(id: string): Promise<void> {
  await request(`/heroes/${id}`, { method: 'DELETE' });
}

export async function searchHeroImages(name: string): Promise<HeroImageCandidate[]> {
  return (
    await request<ListEnvelope<HeroImageCandidate>>(
      `/hero-images?name=${encodeURIComponent(name)}`,
    )
  ).data;
}

export async function listMissions(): Promise<Mission[]> {
  return (await request<ListEnvelope<Mission>>('/misiones')).data;
}

export async function getMission(id: string): Promise<Mission> {
  return (await request<Envelope<Mission>>(`/misiones/${id}`)).data;
}

export async function createMission(payload: MissionPayload): Promise<Mission> {
  return (
    await request<Envelope<Mission>>('/misiones', { method: 'POST', ...jsonBody(payload) })
  ).data;
}

export async function updateMission(id: string, payload: MissionPayload): Promise<Mission> {
  return (
    await request<Envelope<Mission>>(`/misiones/${id}`, { method: 'PUT', ...jsonBody(payload) })
  ).data;
}

export async function deleteMission(id: string): Promise<void> {
  await request(`/misiones/${id}`, { method: 'DELETE' });
}
