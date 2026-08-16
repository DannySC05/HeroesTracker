import type { Pool, QueryResultRow } from 'pg';

import { DuplicateEmailError } from './auth.errors.js';
import type {
  AuthRepository,
  CreateUserInput,
  RevokeTokenInput,
  UserRecord,
  UserRole,
  UpdateConsultationUserInput,
} from './auth.types.js';

interface DatabaseError {
  code?: string;
}

interface UserRow extends QueryResultRow {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
}

function toUserRecord(user: UserRow): UserRecord {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    passwordHash: user.password_hash,
    rol: user.rol as UserRole,
    activo: user.activo,
  };
}

const userColumns = 'id, nombre, email, password_hash, rol, activo';

function requiredUser(rows: UserRow[]): UserRow {
  const user = rows[0];

  if (!user) {
    throw new Error('PostgreSQL no devolvió el usuario recién creado.');
  }

  return user;
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly database: Pool) {}

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    try {
      const result = await this.database.query<UserRow>(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, activo, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING ${userColumns}`,
        [input.nombre, input.email, input.passwordHash, input.rol, input.activo ?? true],
      );

      return toUserRecord(requiredUser(result.rows));
    } catch (error) {
      if ((error as DatabaseError).code === '23505') {
        throw new DuplicateEmailError();
      }

      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.database.query<UserRow>(
      `SELECT ${userColumns} FROM usuarios WHERE email = $1`,
      [email],
    );

    return result.rows[0] ? toUserRecord(result.rows[0]) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const result = await this.database.query<UserRow>(
      `SELECT ${userColumns} FROM usuarios WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? toUserRecord(result.rows[0]) : null;
  }

  async listConsultationUsers(): Promise<UserRecord[]> {
    const result = await this.database.query<UserRow>(
      `SELECT ${userColumns}
       FROM usuarios
       WHERE rol = 'CONSULTA'
       ORDER BY activo DESC, nombre ASC, email ASC`,
    );
    return result.rows.map(toUserRecord);
  }

  async updateConsultationUser(
    id: string,
    input: UpdateConsultationUserInput,
  ): Promise<UserRecord | null> {
    try {
      const result = await this.database.query<UserRow>(
        `UPDATE usuarios
         SET nombre = $2,
             email = $3,
             password_hash = COALESCE($4, password_hash),
             activo = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND rol = 'CONSULTA'
         RETURNING ${userColumns}`,
        [id, input.nombre, input.email, input.passwordHash ?? null, input.activo],
      );
      return result.rows[0] ? toUserRecord(result.rows[0]) : null;
    } catch (error) {
      if ((error as DatabaseError).code === '23505') {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const result = await this.database.query('SELECT 1 FROM tokens_revocados WHERE jti = $1', [
      jti,
    ]);
    return result.rowCount === 1;
  }

  async revokeToken(input: RevokeTokenInput): Promise<void> {
    await this.database.query(
      `INSERT INTO tokens_revocados (jti, usuario_id, expira_en)
       VALUES ($1, $2, $3)
       ON CONFLICT (jti) DO NOTHING`,
      [input.jti, input.usuarioId, input.expiraEn],
    );
  }
}
