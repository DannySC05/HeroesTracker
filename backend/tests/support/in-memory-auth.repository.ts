import { randomUUID } from 'node:crypto';

import { DuplicateEmailError } from '../../src/modules/auth/auth.errors.js';
import type {
  AuthRepository,
  CreateUserInput,
  RevokeTokenInput,
  UserRecord,
  UpdateConsultationUserInput,
} from '../../src/modules/auth/auth.types.js';

export class InMemoryAuthRepository implements AuthRepository {
  private readonly users: UserRecord[] = [];
  private readonly revokedTokens = new Map<string, RevokeTokenInput>();

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const duplicated = this.users.some((user) => user.email === input.email);

    if (duplicated) {
      throw new DuplicateEmailError();
    }

    const user: UserRecord = {
      id: randomUUID(),
      ...input,
      activo: input.activo ?? true,
    };
    this.users.push(user);
    return structuredClone(user);
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = this.users.find((candidate) => candidate.email === email);
    return user ? structuredClone(user) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    return user ? structuredClone(user) : null;
  }

  async listConsultationUsers(): Promise<UserRecord[]> {
    return this.users
      .filter((user) => user.rol === 'CONSULTA')
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
      .map((user) => structuredClone(user));
  }

  async updateConsultationUser(
    id: string,
    input: UpdateConsultationUserInput,
  ): Promise<UserRecord | null> {
    const index = this.users.findIndex((user) => user.id === id && user.rol === 'CONSULTA');
    if (index < 0) return null;
    if (this.users.some((user, userIndex) => userIndex !== index && user.email === input.email)) {
      throw new DuplicateEmailError();
    }
    const current = this.users[index]!;
    const updated: UserRecord = {
      ...current,
      nombre: input.nombre,
      email: input.email,
      passwordHash: input.passwordHash ?? current.passwordHash,
      activo: input.activo,
    };
    this.users[index] = updated;
    return structuredClone(updated);
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    return this.revokedTokens.has(jti);
  }

  async revokeToken(input: RevokeTokenInput): Promise<void> {
    this.revokedTokens.set(input.jti, structuredClone(input));
  }

  seedUser(user: UserRecord): void {
    this.users.push(structuredClone(user));
  }
}
