export const HERO_STATES = ['ACTIVO', 'INACTIVO'] as const;
export const MISSION_DANGER_LEVELS = ['BAJO', 'MEDIO', 'ALTO'] as const;
export const MISSION_STATES = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'] as const;

export type HeroState = (typeof HERO_STATES)[number];
export type MissionDangerLevel = (typeof MISSION_DANGER_LEVELS)[number];
export type MissionState = (typeof MISSION_STATES)[number];

export interface HeroRecord {
  id: string;
  nombre: string;
  nombreReal: string;
  poderPrincipal: string;
  nivelPoder: number;
  imagenUrl: string;
  estado: HeroState;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroInput {
  nombre: string;
  nombreReal: string;
  poderPrincipal: string;
  nivelPoder: number;
  imagenUrl: string;
  estado: HeroState;
}

export interface HeroSummary {
  id: string;
  nombre: string;
}

export interface MissionRecord {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: Date;
  nivelPeligro: MissionDangerLevel;
  estado: MissionState;
  superheroeId: string;
  superheroe: HeroSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionInput {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: Date;
  nivelPeligro: MissionDangerLevel;
  estado: MissionState;
  superheroeId: string;
}

export interface DomainRepository {
  listHeroes(nombre?: string): Promise<HeroRecord[]>;
  findHeroById(id: string): Promise<HeroRecord | null>;
  heroExists(id: string): Promise<boolean>;
  createHero(input: HeroInput): Promise<HeroRecord>;
  updateHero(id: string, input: HeroInput): Promise<HeroRecord | null>;
  deleteHero(id: string): Promise<boolean>;

  listMissions(): Promise<MissionRecord[]>;
  findMissionById(id: string): Promise<MissionRecord | null>;
  createMission(input: MissionInput): Promise<MissionRecord>;
  updateMission(id: string, input: MissionInput): Promise<MissionRecord | null>;
  deleteMission(id: string): Promise<boolean>;
}
