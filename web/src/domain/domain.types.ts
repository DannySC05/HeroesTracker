export const HERO_STATES = ['ACTIVO', 'INACTIVO'] as const;
export const MISSION_DANGER_LEVELS = ['BAJO', 'MEDIO', 'ALTO'] as const;
export const MISSION_STATES = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'] as const;

export type HeroState = (typeof HERO_STATES)[number];
export type MissionDangerLevel = (typeof MISSION_DANGER_LEVELS)[number];
export type MissionState = (typeof MISSION_STATES)[number];

export interface Hero {
  id: string;
  nombre: string;
  nombre_real: string;
  poder_principal: string;
  nivel_poder: number;
  imagen_url: string;
  estado: HeroState;
  created_at: string;
  updated_at: string;
}

export type HeroPayload = Omit<Hero, 'id' | 'created_at' | 'updated_at'>;

export interface HeroSummary {
  id: string;
  nombre: string;
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
  superheroe: HeroSummary;
  created_at: string;
  updated_at: string;
}

export type MissionPayload = Omit<Mission, 'id' | 'superheroe' | 'created_at' | 'updated_at'>;
