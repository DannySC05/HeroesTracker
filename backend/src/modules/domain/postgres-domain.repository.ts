import type { Pool, QueryResultRow } from 'pg';

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

interface DatabaseError {
  code?: string;
}

interface HeroRow extends QueryResultRow {
  id: string;
  nombre: string;
  nombre_real: string;
  poder_principal: string;
  nivel_poder: number;
  imagen_url: string;
  estado: string;
  created_at: Date;
  updated_at: Date;
}

interface MissionRow extends QueryResultRow {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: Date | string;
  nivel_peligro: string;
  estado: string;
  superheroe_id: string;
  created_at: Date;
  updated_at: Date;
  heroe_nombre: string;
}

const heroColumns = `
  id, nombre, nombre_real, poder_principal, nivel_poder, imagen_url,
  estado, created_at, updated_at
`;

const missionColumns = `
  m.id, m.titulo, m.descripcion, m.ubicacion, m.fecha, m.nivel_peligro,
  m.estado, m.superheroe_id, m.created_at, m.updated_at,
  h.nombre AS heroe_nombre
`;

function toHeroRecord(hero: HeroRow): HeroRecord {
  return {
    id: hero.id,
    nombre: hero.nombre,
    nombreReal: hero.nombre_real,
    poderPrincipal: hero.poder_principal,
    nivelPoder: hero.nivel_poder,
    imagenUrl: hero.imagen_url,
    estado: hero.estado as HeroState,
    createdAt: hero.created_at,
    updatedAt: hero.updated_at,
  };
}

function toMissionDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toMissionRecord(mission: MissionRow): MissionRecord {
  return {
    id: mission.id,
    titulo: mission.titulo,
    descripcion: mission.descripcion,
    ubicacion: mission.ubicacion,
    fecha: toMissionDate(mission.fecha),
    nivelPeligro: mission.nivel_peligro as MissionDangerLevel,
    estado: mission.estado as MissionState,
    superheroeId: mission.superheroe_id,
    superheroe: {
      id: mission.superheroe_id,
      nombre: mission.heroe_nombre,
    },
    createdAt: mission.created_at,
    updatedAt: mission.updated_at,
  };
}

function errorCode(error: unknown): string | undefined {
  return (error as DatabaseError).code;
}

function requiredRow<T>(rows: T[], resource: string): T {
  const row = rows[0];

  if (!row) {
    throw new Error(`PostgreSQL no devolvió ${resource} después de crearlo.`);
  }

  return row;
}

export class PostgresDomainRepository implements DomainRepository {
  constructor(private readonly database: Pool) {}

  async listHeroes(nombre?: string): Promise<HeroRecord[]> {
    const values = nombre ? [`%${nombre}%`] : [];
    const where = nombre ? 'WHERE nombre ILIKE $1' : '';
    const result = await this.database.query<HeroRow>(
      `SELECT ${heroColumns} FROM heroes ${where} ORDER BY nombre ASC`,
      values,
    );
    return result.rows.map(toHeroRecord);
  }

  async findHeroById(id: string): Promise<HeroRecord | null> {
    const result = await this.database.query<HeroRow>(
      `SELECT ${heroColumns} FROM heroes WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? toHeroRecord(result.rows[0]) : null;
  }

  async heroExists(id: string): Promise<boolean> {
    const result = await this.database.query('SELECT 1 FROM heroes WHERE id = $1', [id]);
    return result.rowCount === 1;
  }

  async createHero(input: HeroInput): Promise<HeroRecord> {
    try {
      const result = await this.database.query<HeroRow>(
        `INSERT INTO heroes
           (nombre, nombre_real, poder_principal, nivel_poder, imagen_url, estado, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING ${heroColumns}`,
        [
          input.nombre,
          input.nombreReal,
          input.poderPrincipal,
          input.nivelPoder,
          input.imagenUrl,
          input.estado,
        ],
      );
      return toHeroRecord(requiredRow(result.rows, 'el héroe'));
    } catch (error) {
      if (errorCode(error) === '23505') throw new DuplicateHeroNameError();
      throw error;
    }
  }

  async updateHero(id: string, input: HeroInput): Promise<HeroRecord | null> {
    try {
      const result = await this.database.query<HeroRow>(
        `UPDATE heroes
         SET nombre = $2, nombre_real = $3, poder_principal = $4, nivel_poder = $5,
             imagen_url = $6, estado = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING ${heroColumns}`,
        [
          id,
          input.nombre,
          input.nombreReal,
          input.poderPrincipal,
          input.nivelPoder,
          input.imagenUrl,
          input.estado,
        ],
      );
      return result.rows[0] ? toHeroRecord(result.rows[0]) : null;
    } catch (error) {
      if (errorCode(error) === '23505') throw new DuplicateHeroNameError();
      throw error;
    }
  }

  async deleteHero(id: string): Promise<boolean> {
    try {
      const result = await this.database.query('DELETE FROM heroes WHERE id = $1', [id]);
      return result.rowCount === 1;
    } catch (error) {
      if (errorCode(error) === '23503') throw new HeroHasMissionsError();
      throw error;
    }
  }

  async listMissions(): Promise<MissionRecord[]> {
    const result = await this.database.query<MissionRow>(
      `SELECT ${missionColumns}
       FROM misiones m
       INNER JOIN heroes h ON h.id = m.superheroe_id
       ORDER BY m.fecha DESC, m.titulo ASC`,
    );
    return result.rows.map(toMissionRecord);
  }

  async findMissionById(id: string): Promise<MissionRecord | null> {
    const result = await this.database.query<MissionRow>(
      `SELECT ${missionColumns}
       FROM misiones m
       INNER JOIN heroes h ON h.id = m.superheroe_id
       WHERE m.id = $1`,
      [id],
    );
    return result.rows[0] ? toMissionRecord(result.rows[0]) : null;
  }

  async createMission(input: MissionInput): Promise<MissionRecord> {
    try {
      const result = await this.database.query<MissionRow>(
        `WITH inserted AS (
           INSERT INTO misiones
             (titulo, descripcion, ubicacion, fecha, nivel_peligro, estado, superheroe_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           RETURNING *
         )
         SELECT ${missionColumns.replaceAll('m.', 'inserted.')}
         FROM inserted
         INNER JOIN heroes h ON h.id = inserted.superheroe_id`,
        [
          input.titulo,
          input.descripcion,
          input.ubicacion,
          toDateOnly(input.fecha),
          input.nivelPeligro,
          input.estado,
          input.superheroeId,
        ],
      );
      return toMissionRecord(requiredRow(result.rows, 'la misión'));
    } catch (error) {
      if (errorCode(error) === '23503') throw new HeroReferenceNotFoundError();
      throw error;
    }
  }

  async updateMission(id: string, input: MissionInput): Promise<MissionRecord | null> {
    try {
      const result = await this.database.query<MissionRow>(
        `WITH updated AS (
           UPDATE misiones
           SET titulo = $2, descripcion = $3, ubicacion = $4, fecha = $5,
               nivel_peligro = $6, estado = $7, superheroe_id = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *
         )
         SELECT ${missionColumns.replaceAll('m.', 'updated.')}
         FROM updated
         INNER JOIN heroes h ON h.id = updated.superheroe_id`,
        [
          id,
          input.titulo,
          input.descripcion,
          input.ubicacion,
          toDateOnly(input.fecha),
          input.nivelPeligro,
          input.estado,
          input.superheroeId,
        ],
      );
      return result.rows[0] ? toMissionRecord(result.rows[0]) : null;
    } catch (error) {
      if (errorCode(error) === '23503') throw new HeroReferenceNotFoundError();
      throw error;
    }
  }

  async deleteMission(id: string): Promise<boolean> {
    const result = await this.database.query('DELETE FROM misiones WHERE id = $1', [id]);
    return result.rowCount === 1;
  }
}
