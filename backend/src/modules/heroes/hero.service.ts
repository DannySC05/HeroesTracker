import { AppError } from '../../shared/errors/app-error.js';
import { DuplicateHeroNameError, HeroHasMissionsError } from '../domain/domain.errors.js';
import type { DomainRepository, HeroInput, HeroRecord } from '../domain/domain.types.js';

function notFoundError(): AppError {
  return new AppError(404, 'RESOURCE_NOT_FOUND', 'El héroe solicitado no existe.');
}

function duplicateNameError(): AppError {
  return new AppError(409, 'HERO_NAME_ALREADY_EXISTS', 'Ya existe un héroe con ese nombre.');
}

export class HeroService {
  constructor(private readonly repository: DomainRepository) {}

  async list(nombre?: string): Promise<HeroRecord[]> {
    return this.repository.listHeroes(nombre?.trim());
  }

  async getById(id: string): Promise<HeroRecord> {
    const hero = await this.repository.findHeroById(id);

    if (!hero) {
      throw notFoundError();
    }

    return hero;
  }

  async create(input: HeroInput): Promise<HeroRecord> {
    try {
      return await this.repository.createHero(this.normalize(input));
    } catch (error) {
      if (error instanceof DuplicateHeroNameError) {
        throw duplicateNameError();
      }

      throw error;
    }
  }

  async update(id: string, input: HeroInput): Promise<HeroRecord> {
    try {
      const hero = await this.repository.updateHero(id, this.normalize(input));

      if (!hero) {
        throw notFoundError();
      }

      return hero;
    } catch (error) {
      if (error instanceof DuplicateHeroNameError) {
        throw duplicateNameError();
      }

      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deleted = await this.repository.deleteHero(id);

      if (!deleted) {
        throw notFoundError();
      }
    } catch (error) {
      if (error instanceof HeroHasMissionsError) {
        throw new AppError(
          409,
          'HERO_HAS_MISSIONS',
          'No se puede eliminar un héroe con misiones asociadas.',
        );
      }

      throw error;
    }
  }

  private normalize(input: HeroInput): HeroInput {
    return {
      ...input,
      nombre: input.nombre.trim(),
      nombreReal: input.nombreReal.trim(),
      poderPrincipal: input.poderPrincipal.trim(),
      imagenUrl: input.imagenUrl?.trim() || null,
    };
  }
}
