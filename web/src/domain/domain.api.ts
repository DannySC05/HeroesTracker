import { http } from '../api/http';
import type { Hero, HeroPayload, Mission, MissionPayload } from './domain.types';

interface ItemEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: {
    total: number;
  };
}

export async function listHeroes(nombre?: string): Promise<Hero[]> {
  const response = await http.get<ListEnvelope<Hero>>('/heroes', {
    params: nombre ? { nombre } : undefined,
  });
  return response.data.data;
}

export async function getHero(id: string): Promise<Hero> {
  const response = await http.get<ItemEnvelope<Hero>>(`/heroes/${id}`);
  return response.data.data;
}

export async function createHero(payload: HeroPayload): Promise<Hero> {
  const response = await http.post<ItemEnvelope<Hero>>('/heroes', payload);
  return response.data.data;
}

export async function updateHero(id: string, payload: HeroPayload): Promise<Hero> {
  const response = await http.put<ItemEnvelope<Hero>>(`/heroes/${id}`, payload);
  return response.data.data;
}

export async function deleteHero(id: string): Promise<void> {
  await http.delete(`/heroes/${id}`);
}

export async function listMissions(): Promise<Mission[]> {
  const response = await http.get<ListEnvelope<Mission>>('/misiones');
  return response.data.data;
}

export async function getMission(id: string): Promise<Mission> {
  const response = await http.get<ItemEnvelope<Mission>>(`/misiones/${id}`);
  return response.data.data;
}

export async function createMission(payload: MissionPayload): Promise<Mission> {
  const response = await http.post<ItemEnvelope<Mission>>('/misiones', payload);
  return response.data.data;
}

export async function updateMission(id: string, payload: MissionPayload): Promise<Mission> {
  const response = await http.put<ItemEnvelope<Mission>>(`/misiones/${id}`, payload);
  return response.data.data;
}

export async function deleteMission(id: string): Promise<void> {
  await http.delete(`/misiones/${id}`);
}
