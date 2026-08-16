export interface ConsultationUser {
  id: string;
  nombre: string;
  email: string;
  rol: 'CONSULTA';
  activo: boolean;
}

export interface CreateConsultationUserPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface UpdateConsultationUserPayload {
  nombre: string;
  email: string;
  password?: string;
  activo: boolean;
}
