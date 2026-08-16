import { AppError } from '../../shared/errors/app-error.js';
import { HeroReferenceNotFoundError } from '../domain/domain.errors.js';
import type { DomainRepository, MissionInput, MissionRecord } from '../domain/domain.types.js';

function missionNotFoundError(): AppError {
  return new AppError(404, 'RESOURCE_NOT_FOUND', 'La misión solicitada no existe.');
}

function heroNotFoundError(): AppError {
  return new AppError(404, 'RESOURCE_NOT_FOUND', 'El héroe asociado no existe.');
}

export class MissionService {
  constructor(private readonly repository: DomainRepository) {}

  async list(): Promise<MissionRecord[]> {
    return this.repository.listMissions();
  }

  async getById(id: string): Promise<MissionRecord> {
    const mission = await this.repository.findMissionById(id);

    if (!mission) {
      throw missionNotFoundError();
    }

    return mission;
  }

  async create(input: MissionInput): Promise<MissionRecord> {
    await this.ensureHeroExists(input.superheroeId);

    try {
      return await this.repository.createMission(this.normalize(input));
    } catch (error) {
      if (error instanceof HeroReferenceNotFoundError) {
        throw heroNotFoundError();
      }

      throw error;
    }
  }

  async update(id: string, input: MissionInput): Promise<MissionRecord> {
    if (!(await this.repository.findMissionById(id))) {
      throw missionNotFoundError();
    }

    await this.ensureHeroExists(input.superheroeId);

    try {
      const mission = await this.repository.updateMission(id, this.normalize(input));

      if (!mission) {
        throw missionNotFoundError();
      }

      return mission;
    } catch (error) {
      if (error instanceof HeroReferenceNotFoundError) {
        throw heroNotFoundError();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.deleteMission(id);

    if (!deleted) {
      throw missionNotFoundError();
    }
  }

  private async ensureHeroExists(id: string): Promise<void> {
    if (!(await this.repository.heroExists(id))) {
      throw heroNotFoundError();
    }
  }

  private normalize(input: MissionInput): MissionInput {
    return {
      ...input,
      titulo: input.titulo.trim(),
      descripcion: input.descripcion.trim(),
      ubicacion: input.ubicacion.trim(),
    };
  }
}
