import type { PrismaClient } from '../../generated/prisma/client.ts';
import {
  DuplicateHeroNameError,
  HeroHasMissionsError,
  HeroReferenceNotFoundError,
} from './domain.errors.js';
import type {
  DomainRepository,
  HeroInput,
  HeroRecord,
  HeroState,
  MissionDangerLevel,
  MissionInput,
  MissionRecord,
  MissionState,
} from './domain.types.js';

interface PrismaErrorWithCode {
  code?: string;
}

interface PrismaHeroRecord {
  id: string;
  nombre: string;
  nombreReal: string;
  poderPrincipal: string;
  nivelPoder: number;
  imagenUrl: string;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaMissionRecord {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: Date;
  nivelPeligro: string;
  estado: string;
  superheroeId: string;
  createdAt: Date;
  updatedAt: Date;
  superheroe: {
    id: string;
    nombre: string;
  };
}

const heroSelect = {
  id: true,
  nombre: true,
  nombreReal: true,
  poderPrincipal: true,
  nivelPoder: true,
  imagenUrl: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const;

const missionSelect = {
  id: true,
  titulo: true,
  descripcion: true,
  ubicacion: true,
  fecha: true,
  nivelPeligro: true,
  estado: true,
  superheroeId: true,
  createdAt: true,
  updatedAt: true,
  superheroe: {
    select: {
      id: true,
      nombre: true,
    },
  },
} as const;

function toHeroRecord(hero: PrismaHeroRecord): HeroRecord {
  return {
    ...hero,
    estado: hero.estado as HeroState,
  };
}

function toMissionRecord(mission: PrismaMissionRecord): MissionRecord {
  return {
    ...mission,
    nivelPeligro: mission.nivelPeligro as MissionDangerLevel,
    estado: mission.estado as MissionState,
  };
}

function errorCode(error: unknown): string | undefined {
  return (error as PrismaErrorWithCode).code;
}

export class PrismaDomainRepository implements DomainRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listHeroes(nombre?: string): Promise<HeroRecord[]> {
    const heroes = await this.prisma.heroe.findMany({
      ...(nombre
        ? {
            where: {
              nombre: {
                contains: nombre,
                mode: 'insensitive',
              },
            },
          }
        : {}),
      orderBy: { nombre: 'asc' },
      select: heroSelect,
    });

    return heroes.map(toHeroRecord);
  }

  async findHeroById(id: string): Promise<HeroRecord | null> {
    const hero = await this.prisma.heroe.findUnique({
      where: { id },
      select: heroSelect,
    });

    return hero ? toHeroRecord(hero) : null;
  }

  async heroExists(id: string): Promise<boolean> {
    const hero = await this.prisma.heroe.findUnique({
      where: { id },
      select: { id: true },
    });

    return hero !== null;
  }

  async createHero(input: HeroInput): Promise<HeroRecord> {
    try {
      const hero = await this.prisma.heroe.create({
        data: input,
        select: heroSelect,
      });
      return toHeroRecord(hero);
    } catch (error) {
      if (errorCode(error) === 'P2002') {
        throw new DuplicateHeroNameError();
      }

      throw error;
    }
  }

  async updateHero(id: string, input: HeroInput): Promise<HeroRecord | null> {
    try {
      const hero = await this.prisma.heroe.update({
        where: { id },
        data: input,
        select: heroSelect,
      });
      return toHeroRecord(hero);
    } catch (error) {
      if (errorCode(error) === 'P2002') {
        throw new DuplicateHeroNameError();
      }

      if (errorCode(error) === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  async deleteHero(id: string): Promise<boolean> {
    try {
      await this.prisma.heroe.delete({ where: { id }, select: { id: true } });
      return true;
    } catch (error) {
      if (errorCode(error) === 'P2003' || errorCode(error) === 'P2014') {
        throw new HeroHasMissionsError();
      }

      if (errorCode(error) === 'P2025') {
        return false;
      }

      throw error;
    }
  }

  async listMissions(): Promise<MissionRecord[]> {
    const missions = await this.prisma.mision.findMany({
      orderBy: [{ fecha: 'desc' }, { titulo: 'asc' }],
      select: missionSelect,
    });

    return missions.map(toMissionRecord);
  }

  async findMissionById(id: string): Promise<MissionRecord | null> {
    const mission = await this.prisma.mision.findUnique({
      where: { id },
      select: missionSelect,
    });

    return mission ? toMissionRecord(mission) : null;
  }

  async createMission(input: MissionInput): Promise<MissionRecord> {
    try {
      const mission = await this.prisma.mision.create({
        data: input,
        select: missionSelect,
      });
      return toMissionRecord(mission);
    } catch (error) {
      if (errorCode(error) === 'P2003') {
        throw new HeroReferenceNotFoundError();
      }

      throw error;
    }
  }

  async updateMission(id: string, input: MissionInput): Promise<MissionRecord | null> {
    try {
      const mission = await this.prisma.mision.update({
        where: { id },
        data: input,
        select: missionSelect,
      });
      return toMissionRecord(mission);
    } catch (error) {
      if (errorCode(error) === 'P2003') {
        throw new HeroReferenceNotFoundError();
      }

      if (errorCode(error) === 'P2025') {
        return null;
      }

      throw error;
    }
  }

  async deleteMission(id: string): Promise<boolean> {
    try {
      await this.prisma.mision.delete({ where: { id }, select: { id: true } });
      return true;
    } catch (error) {
      if (errorCode(error) === 'P2025') {
        return false;
      }

      throw error;
    }
  }
}
