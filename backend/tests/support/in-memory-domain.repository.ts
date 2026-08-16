import { randomUUID } from 'node:crypto';

import {
  DuplicateHeroNameError,
  HeroHasMissionsError,
  HeroReferenceNotFoundError,
} from '../../src/modules/domain/domain.errors.js';
import type {
  DomainRepository,
  HeroInput,
  HeroRecord,
  MissionInput,
  MissionRecord,
} from '../../src/modules/domain/domain.types.js';

export class InMemoryDomainRepository implements DomainRepository {
  private readonly heroes: HeroRecord[] = [];
  private readonly missions: MissionRecord[] = [];

  async listHeroes(nombre?: string): Promise<HeroRecord[]> {
    const normalizedSearch = nombre?.toLocaleLowerCase();
    return this.heroes
      .filter(
        (hero) => !normalizedSearch || hero.nombre.toLocaleLowerCase().includes(normalizedSearch),
      )
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
      .map((hero) => structuredClone(hero));
  }

  async findHeroById(id: string): Promise<HeroRecord | null> {
    const hero = this.heroes.find((candidate) => candidate.id === id);
    return hero ? structuredClone(hero) : null;
  }

  async heroExists(id: string): Promise<boolean> {
    return this.heroes.some((hero) => hero.id === id);
  }

  async createHero(input: HeroInput): Promise<HeroRecord> {
    this.ensureUniqueHeroName(input.nombre);
    const now = new Date();
    const hero: HeroRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.heroes.push(hero);
    return structuredClone(hero);
  }

  async updateHero(id: string, input: HeroInput): Promise<HeroRecord | null> {
    const index = this.heroes.findIndex((hero) => hero.id === id);

    if (index < 0) {
      return null;
    }

    this.ensureUniqueHeroName(input.nombre, id);
    const current = this.heroes[index]!;
    const hero: HeroRecord = {
      ...current,
      ...input,
      updatedAt: new Date(),
    };
    this.heroes[index] = hero;
    return structuredClone(hero);
  }

  async deleteHero(id: string): Promise<boolean> {
    const index = this.heroes.findIndex((hero) => hero.id === id);

    if (index < 0) {
      return false;
    }

    if (this.missions.some((mission) => mission.superheroeId === id)) {
      throw new HeroHasMissionsError();
    }

    this.heroes.splice(index, 1);
    return true;
  }

  async listMissions(): Promise<MissionRecord[]> {
    return this.missions
      .slice()
      .sort(
        (left, right) =>
          right.fecha.getTime() - left.fecha.getTime() || left.titulo.localeCompare(right.titulo),
      )
      .map((mission) => structuredClone(mission));
  }

  async findMissionById(id: string): Promise<MissionRecord | null> {
    const mission = this.missions.find((candidate) => candidate.id === id);
    return mission ? structuredClone(mission) : null;
  }

  async createMission(input: MissionInput): Promise<MissionRecord> {
    const hero = this.heroes.find((candidate) => candidate.id === input.superheroeId);

    if (!hero) {
      throw new HeroReferenceNotFoundError();
    }

    const now = new Date();
    const mission: MissionRecord = {
      id: randomUUID(),
      ...input,
      superheroe: { id: hero.id, nombre: hero.nombre },
      createdAt: now,
      updatedAt: now,
    };
    this.missions.push(mission);
    return structuredClone(mission);
  }

  async updateMission(id: string, input: MissionInput): Promise<MissionRecord | null> {
    const index = this.missions.findIndex((mission) => mission.id === id);

    if (index < 0) {
      return null;
    }

    const hero = this.heroes.find((candidate) => candidate.id === input.superheroeId);

    if (!hero) {
      throw new HeroReferenceNotFoundError();
    }

    const current = this.missions[index]!;
    const mission: MissionRecord = {
      ...current,
      ...input,
      superheroe: { id: hero.id, nombre: hero.nombre },
      updatedAt: new Date(),
    };
    this.missions[index] = mission;
    return structuredClone(mission);
  }

  async deleteMission(id: string): Promise<boolean> {
    const index = this.missions.findIndex((mission) => mission.id === id);

    if (index < 0) {
      return false;
    }

    this.missions.splice(index, 1);
    return true;
  }

  seedHero(input: HeroInput & { id?: string }): HeroRecord {
    const now = new Date('2026-08-15T12:00:00.000Z');
    const hero: HeroRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.heroes.push(hero);
    return structuredClone(hero);
  }

  seedMission(input: MissionInput & { id?: string }): MissionRecord {
    const hero = this.heroes.find((candidate) => candidate.id === input.superheroeId);

    if (!hero) {
      throw new Error('Seed mission requires an existing hero.');
    }

    const now = new Date('2026-08-15T12:00:00.000Z');
    const mission: MissionRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      superheroe: { id: hero.id, nombre: hero.nombre },
      createdAt: now,
      updatedAt: now,
    };
    this.missions.push(mission);
    return structuredClone(mission);
  }

  private ensureUniqueHeroName(nombre: string, ignoredId?: string): void {
    const normalizedName = nombre.toLocaleLowerCase();
    const duplicated = this.heroes.some(
      (hero) => hero.id !== ignoredId && hero.nombre.toLocaleLowerCase() === normalizedName,
    );

    if (duplicated) {
      throw new DuplicateHeroNameError();
    }
  }
}
