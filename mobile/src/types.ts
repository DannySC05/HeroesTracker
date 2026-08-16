export type UserRole = 'ADMIN' | 'CONSULTA';
export type HeroState = 'ACTIVO' | 'INACTIVO';
export type MissionDangerLevel = 'BAJO' | 'MEDIO' | 'ALTO';
export type MissionState = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface Hero {
  id: string;
  nombre: string;
  nombre_real: string;
  poder_principal: string;
  nivel_poder: number;
  imagen_url: string | null;
  estado: HeroState;
  created_at: string;
  updated_at: string;
}

export type HeroPayload = Omit<Hero, 'id' | 'created_at' | 'updated_at'>;

export interface HeroImageCandidate {
  id: string;
  name: string;
  full_name: string | null;
  publisher: string | null;
  image_url: string;
}

export interface Mission {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: string;
  nivel_peligro: MissionDangerLevel;
  estado: MissionState;
  superheroe_id: string;
  superheroe: { id: string; nombre: string };
  created_at: string;
  updated_at: string;
}

export type MissionPayload = Omit<Mission, 'id' | 'superheroe' | 'created_at' | 'updated_at'>;
