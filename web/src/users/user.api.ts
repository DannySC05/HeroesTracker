import { http } from '../api/http';
import type {
  ConsultationUser,
  CreateConsultationUserPayload,
  UpdateConsultationUserPayload,
} from './user.types';

interface ItemEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { total: number };
}

export async function listConsultationUsers(): Promise<ConsultationUser[]> {
  return (await http.get<ListEnvelope<ConsultationUser>>('/usuarios')).data.data;
}

export async function createConsultationUser(
  payload: CreateConsultationUserPayload,
): Promise<ConsultationUser> {
  return (await http.post<ItemEnvelope<ConsultationUser>>('/usuarios', payload)).data.data;
}

export async function updateConsultationUser(
  id: string,
  payload: UpdateConsultationUserPayload,
): Promise<ConsultationUser> {
  return (await http.put<ItemEnvelope<ConsultationUser>>(`/usuarios/${id}`, payload)).data.data;
}
